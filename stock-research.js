// api/stock-research.js - Main API endpoint for stock analysis
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;

// Get real-time stock data from Finnhub
async function getStockData(ticker) {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('Finnhub error:', error);
    return null;
  }
}

// Get company fundamentals from Finnhub
async function getCompanyFundamentals(ticker) {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('Fundamentals error:', error);
    return null;
  }
}

// Get news sentiment for a stock
async function getStockNews(ticker) {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&limit=5&token=${FINNHUB_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('News error:', error);
    return null;
  }
}

// Get historical data from Alpha Vantage for context
async function getHistoricalData(ticker) {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('Historical data error:', error);
    return null;
  }
}

// Main research function - calls Claude with stock data
async function analyzeStock(ticker, userContext = '') {
  try {
    // Get real-time data
    const stockData = await getStockData(ticker);
    const fundamentals = await getCompanyFundamentals(ticker);
    const news = await getStockNews(ticker);
    const history = await getHistoricalData(ticker);

    // Build context for Claude
    const dataContext = `
Current Stock Data for ${ticker}:
- Price: $${stockData?.c || 'N/A'}
- Day High: $${stockData?.h || 'N/A'}
- Day Low: $${stockData?.l || 'N/A'}
- Volume: ${stockData?.v || 'N/A'}
- P/E Ratio: ${fundamentals?.pe || 'N/A'}
- Market Cap: $${fundamentals?.marketCapitalization || 'N/A'}
- Industry: ${fundamentals?.finnhubIndustry || 'N/A'}

Recent News:
${news?.slice(0, 3).map(n => `- ${n.headline}`).join('\n') || 'No recent news'}

User Context: ${userContext || 'General investor, mixed approach'}
    `.trim();

    // Call Claude for intelligent analysis
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `
Analyze this stock and provide a detailed research report:

${dataContext}

Please provide:
1. Buy/Hold/Sell recommendation with 2-3 sentence reasoning
2. Key valuation metrics (P/E, dividend yield, growth prospects)
3. Risk assessment (volatility, downside risks, key risks to monitor)
4. 3-4 peer/competitor stocks for comparison
5. Portfolio fit analysis - how this complements different strategies
6. Short-term catalysts & sentiment (label as speculative)
7. Final verdict - one clear actionable insight

Format clearly with sections. Include specific numbers and metrics where possible.
          `
        }
      ]
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      ticker,
      analysis,
      stockData,
      fundamentals,
      news,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Stock discovery endpoint - generates new ideas
async function discoverStocks(category) {
  const prompts = {
    'trending': 'Identify 3-4 US stocks that are trending or gaining momentum TODAY. For each: (1) Why it\'s trending, (2) Quick technical/fundamental outlook, (3) Buy/Hold/Sell for short & medium term, (4) Key risks.',
    'undervalued': 'Find 3-4 undervalued US stocks trading below intrinsic value. For each: (1) Why it\'s undervalued, (2) Valuation metrics, (3) Turnaround potential, (4) Recommendation.',
    'high-growth': 'Recommend 3-4 high-growth US stocks with strong upside potential. For each: (1) Growth story, (2) Revenue/earnings growth rate, (3) Competition & moat, (4) Risk/reward assessment.',
    'dividend': 'Suggest 3-4 dividend-paying stocks with solid yields. For each: (1) Current yield, (2) Dividend history, (3) Total return potential, (4) Safety rating.',
    'etf-screening': 'Recommend 3-4 must-own ETFs covering major asset classes. For each: (1) What it holds, (2) Expense ratio & performance, (3) Best use case, (4) Comparison to alternatives.',
    'sector-leaders': 'Identify top performers in 4 major sectors. For each sector: (1) The leader, (2) Sector tailwinds, (3) Valuation, (4) Investment thesis.'
  };

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompts[category] + '\n\nBe specific with tickers, numbers, and reasoning. Format clearly with sections for each idea.'
        }
      ]
    });

    return {
      category,
      ideas: message.content[0].type === 'text' ? message.content[0].text : '',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Discovery error:', error);
    throw error;
  }
}

// Save report to database
async function saveReport(userId, report) {
  try {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        ticker: report.ticker,
        analysis: report.analysis,
        created_at: new Date()
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Save report error:', error);
    throw error;
  }
}

// Create price alert
async function createPriceAlert(userId, ticker, targetPrice, alertType) {
  try {
    // First get current price
    const stockData = await getStockData(ticker);
    const currentPrice = stockData?.c;

    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        ticker,
        target_price: targetPrice,
        alert_type: alertType || 'above',
        is_active: true
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Price alert error:', error);
    throw error;
  }
}

// Check price alerts and send notifications
async function checkPriceAlerts() {
  try {
    const { data: alerts } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true);

    for (const alert of alerts || []) {
      const stockData = await getStockData(alert.ticker);
      const currentPrice = stockData?.c;

      let shouldTrigger = false;
      if (alert.alert_type === 'above' && currentPrice >= alert.target_price) {
        shouldTrigger = true;
      } else if (alert.alert_type === 'below' && currentPrice <= alert.target_price) {
        shouldTrigger = true;
      }

      if (shouldTrigger) {
        // Send notification
        await sendPriceAlertNotification(alert, currentPrice);
        
        // Update alert as triggered
        await supabase
          .from('price_alerts')
          .update({ triggered_at: new Date() })
          .eq('id', alert.id);
      }
    }
  } catch (error) {
    console.error('Price alert check error:', error);
  }
}

// Send price alert notification
async function sendPriceAlertNotification(alert, currentPrice) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', alert.user_id)
      .single();

    if (user?.email) {
      // Send email (implement with SendGrid/Resend)
      console.log(`Price alert: ${alert.ticker} hit $${currentPrice} - notifying ${user.email}`);
    }
  } catch (error) {
    console.error('Notification error:', error);
  }
}

// Generate and send weekly digest
async function sendWeeklyDigest(teamId) {
  try {
    // Get this week's screening results
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: results } = await supabase
      .from('screening_results')
      .select('*')
      .eq('team_id', teamId)
      .gte('created_at', weekAgo.toISOString());

    // Get team members
    const { data: users } = await supabase
      .from('users')
      .select('email')
      .eq('team_id', teamId);

    if (results && users) {
      // Compile digest and send
      console.log(`Weekly digest for team ${teamId}: ${results.length} screening results`);
    }
  } catch (error) {
    console.error('Weekly digest error:', error);
  }
}

export default async function handler(req, res) {
  const { action, ticker, category, userId, targetPrice, alertType, userContext, teamId } = req.body;

  try {
    if (action === 'analyze') {
      const report = await analyzeStock(ticker, userContext);
      if (userId) await saveReport(userId, report);
      return res.status(200).json(report);
    }

    if (action === 'discover') {
      const ideas = await discoverStocks(category);
      return res.status(200).json(ideas);
    }

    if (action === 'price-alert') {
      const alert = await createPriceAlert(userId, ticker, targetPrice, alertType);
      return res.status(200).json(alert);
    }

    if (action === 'check-alerts') {
      await checkPriceAlerts();
      return res.status(200).json({ message: 'Alerts checked' });
    }

    if (action === 'weekly-digest') {
      await sendWeeklyDigest(teamId);
      return res.status(200).json({ message: 'Digest sent' });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

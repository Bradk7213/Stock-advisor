// pages/api/stock-research.js - Main API endpoint for stock analysis
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
    console.error('Finnhub error:', error.message);
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
    console.error('Fundamentals error:', error.message);
    return null;
  }
}

// Get recent news for a stock
async function getStockNews(ticker) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const response = await axios.get(
      `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=${lastWeek}&to=${today}&token=${FINNHUB_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('News error:', error.message);
    return null;
  }
}

// Get historical data from Alpha Vantage
async function getHistoricalData(ticker) {
  try {
    const response = await axios.get(
      `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    );
    return response.data;
  } catch (error) {
    console.error('Historical data error:', error.message);
    return null;
  }
}

// Main research function — calls Claude with real stock data
async function analyzeStock(ticker, userContext = '') {
  try {
    const [stockData, fundamentals, news] = await Promise.all([
      getStockData(ticker),
      getCompanyFundamentals(ticker),
      getStockNews(ticker),
    ]);

    const dataContext = `
Current Stock Data for ${ticker}:
- Price: $${stockData?.c || 'N/A'}
- Day High: $${stockData?.h || 'N/A'}
- Day Low: $${stockData?.l || 'N/A'}
- Previous Close: $${stockData?.pc || 'N/A'}
- Volume: ${stockData?.v || 'N/A'}
- P/E Ratio: ${fundamentals?.pe || 'N/A'}
- Market Cap: $${fundamentals?.marketCapitalization ? (fundamentals.marketCapitalization / 1000).toFixed(1) + 'B' : 'N/A'}
- Industry: ${fundamentals?.finnhubIndustry || 'N/A'}
- Country: ${fundamentals?.country || 'N/A'}

Recent News Headlines:
${news?.slice(0, 5).map(n => `- ${n.headline}`).join('\n') || 'No recent news available'}

Investor Context: ${userContext || 'General investor, no specific preferences stated'}
    `.trim();

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Analyze this stock and provide a detailed research report:

${dataContext}

Please provide:
1. Buy/Hold/Sell recommendation with 2-3 sentence reasoning
2. Key valuation metrics (P/E, dividend yield, growth prospects)
3. Risk assessment (volatility, downside risks, key risks to monitor)
4. 3-4 peer/competitor stocks for comparison
5. Portfolio fit analysis — how this complements different strategies
6. Short-term catalysts & sentiment (label as speculative)
7. Final verdict — one clear actionable insight

Format clearly with sections. Include specific numbers and metrics where possible.`
        }
      ]
    });

    const analysis = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      ticker,
      analysis,
      stockData,
      fundamentals,
      news: news?.slice(0, 5) || [],
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Analysis error:', error);
    throw error;
  }
}

// Stock discovery — generates new ideas by category
async function discoverStocks(category) {
  const prompts = {
    'trending': "Identify 3-4 US stocks that are trending or gaining momentum right now. For each: (1) Why it's trending, (2) Quick technical/fundamental outlook, (3) Buy/Hold/Sell for short & medium term, (4) Key risks.",
    'undervalued': "Find 3-4 undervalued US stocks trading below intrinsic value. For each: (1) Why it's undervalued, (2) Key valuation metrics, (3) Turnaround potential, (4) Recommendation.",
    'high-growth': "Recommend 3-4 high-growth US stocks with strong upside potential. For each: (1) Growth story, (2) Revenue/earnings growth rate, (3) Competition & moat, (4) Risk/reward assessment.",
    'dividend': "Suggest 3-4 dividend-paying stocks with solid yields and sustainability. For each: (1) Current yield, (2) Dividend history & payout ratio, (3) Total return potential, (4) Safety rating.",
    'etf-screening': "Recommend 3-4 must-own ETFs covering major asset classes. For each: (1) What it holds, (2) Expense ratio & 5-year performance, (3) Best use case, (4) Comparison to alternatives.",
    'sector-leaders': "Identify the top performer in 4 major sectors (e.g., tech, healthcare, energy, finance). For each: (1) The leader ticker, (2) Sector tailwinds, (3) Valuation, (4) Investment thesis."
  };

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: (prompts[category] || prompts['trending']) + '\n\nBe specific with tickers, numbers, and reasoning. Format clearly with sections for each idea.'
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
    const { error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        ticker: report.ticker,
        analysis: report.analysis,
        created_at: new Date()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Save report error:', error.message);
    // Non-fatal — don't throw, just log
  }
}

// Create price alert
async function createPriceAlert(userId, ticker, targetPrice, alertType) {
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        ticker,
        target_price: targetPrice,
        alert_type: alertType || 'above',
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Price alert error:', error.message);
    throw error;
  }
}

// Check price alerts and trigger notifications
async function checkPriceAlerts() {
  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('is_active', true);

  for (const alert of alerts || []) {
    const stockData = await getStockData(alert.ticker);
    const currentPrice = stockData?.c;
    if (!currentPrice) continue;

    const shouldTrigger =
      (alert.alert_type === 'above' && currentPrice >= alert.target_price) ||
      (alert.alert_type === 'below' && currentPrice <= alert.target_price);

    if (shouldTrigger) {
      // Queue notification
      const { data: user } = await supabase
        .from('users')
        .select('email, team_id')
        .eq('id', alert.user_id)
        .single();

      if (user?.email) {
        await supabase.from('notifications').insert({
          user_id: alert.user_id,
          team_id: user.team_id,
          type: 'price_alert',
          recipient_email: user.email,
          content: `Price alert triggered: ${alert.ticker} hit $${currentPrice} (target: ${alert.alert_type} $${alert.target_price})`,
          status: 'pending'
        });
      }

      // Mark alert as triggered
      await supabase
        .from('price_alerts')
        .update({ is_active: false, triggered_at: new Date() })
        .eq('id', alert.id);
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, ticker, category, userId, targetPrice, alertType, userContext } = req.body;

  try {
    if (action === 'analyze') {
      if (!ticker) return res.status(400).json({ error: 'Ticker is required' });
      const report = await analyzeStock(ticker, userContext);
      if (userId) await saveReport(userId, report);
      return res.status(200).json(report);
    }

    if (action === 'discover') {
      if (!category) return res.status(400).json({ error: 'Category is required' });
      const ideas = await discoverStocks(category);
      return res.status(200).json(ideas);
    }

    if (action === 'price-alert') {
      if (!userId || !ticker || !targetPrice) {
        return res.status(400).json({ error: 'userId, ticker, and targetPrice are required' });
      }
      const alert = await createPriceAlert(userId, ticker, targetPrice, alertType);
      return res.status(200).json(alert);
    }

    if (action === 'check-alerts') {
      await checkPriceAlerts();
      return res.status(200).json({ message: 'Alerts checked' });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

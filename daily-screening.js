// api/cron/daily-screening.js - Runs daily at 8am to generate stock ideas
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
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

// Main daily screening function
async function runDailyScreening() {
  const startTime = new Date();
  
  try {
    // Log job start
    await supabase.from('job_logs').insert({
      job_type: 'daily_screening',
      status: 'started'
    });

    // Generate ideas for multiple categories
    const categories = ['trending', 'undervalued', 'high-growth'];
    const allIdeas = {};

    for (const category of categories) {
      console.log(`Screening for ${category} stocks...`);
      
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: getScreeningPrompt(category)
          }
        ]
      });

      allIdeas[category] = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    // Get all teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id');

    // Save screening results for each team
    for (const team of teams || []) {
      const { data, error } = await supabase
        .from('screening_results')
        .insert({
          team_id: team.id,
          screening_date: new Date().toISOString().split('T')[0],
          category: 'daily',
          stocks: allIdeas,
          sent_to_teams: false,
          sent_to_email: false
        });

      if (!error) {
        console.log(`Saved screening results for team ${team.id}`);

        // Send to Microsoft Teams if webhook is configured
        if (TEAMS_WEBHOOK_URL) {
          await sendToTeams(team.id, allIdeas);
        }

        // Send email digest
        await sendEmailDigest(team.id, allIdeas);
      }
    }

    // Log successful completion
    await supabase.from('job_logs').insert({
      job_type: 'daily_screening',
      status: 'completed',
      completed_at: new Date()
    });

    console.log('Daily screening completed successfully');
    return { success: true, timestamp: new Date() };

  } catch (error) {
    console.error('Daily screening error:', error);
    
    // Log error
    await supabase.from('job_logs').insert({
      job_type: 'daily_screening',
      status: 'failed',
      error_message: error.message,
      completed_at: new Date()
    });

    throw error;
  }
}

// Get screening prompt for each category
function getScreeningPrompt(category) {
  const prompts = {
    'trending': 'Find 2-3 US stocks that are trending TODAY with momentum. Include ticker, why it\'s trending, and a Buy/Hold/Sell stance.',
    'undervalued': 'Identify 2-3 undervalued US stocks with strong fundamentals trading below fair value. Include ticker, valuation metrics, and why it\'s undervalued.',
    'high-growth': 'Recommend 2-3 high-growth US stocks with strong upside. Include ticker, growth story, and risk/reward analysis.'
  };
  
  return prompts[category] + '\n\nBe concise. Include specific tickers and numbers. Format as bullet points.';
}

// Send screening results to Microsoft Teams
async function sendToTeams(teamId, ideas) {
  try {
    if (!TEAMS_WEBHOOK_URL) return;

    // Get team details
    const { data: team } = await supabase
      .from('teams')
      .select('name')
      .eq('id', teamId)
      .single();

    // Format message
    const message = {
      @type: 'MessageCard',
      @context: 'https://schema.org/extensions',
      summary: `Stock Advisor Daily Screening - ${new Date().toLocaleDateString()}`,
      themeColor: '0078D4',
      sections: [
        {
          activityTitle: '📈 Daily Stock Ideas',
          activitySubtitle: team?.name || 'Your Team',
          text: formatIdeasForTeams(ideas),
          markdown: true
        }
      ]
    };

    await axios.post(TEAMS_WEBHOOK_URL, message);
    console.log('Sent to Teams webhook');

    // Mark as sent
    await supabase
      .from('screening_results')
      .update({ sent_to_teams: true })
      .eq('team_id', teamId)
      .eq('screening_date', new Date().toISOString().split('T')[0]);

  } catch (error) {
    console.error('Teams webhook error:', error);
  }
}

// Format ideas for Teams message
function formatIdeasForTeams(ideas) {
  let message = '';
  
  for (const [category, content] of Object.entries(ideas)) {
    message += `**${category.toUpperCase().replace('-', ' ')}**\n`;
    message += content + '\n\n';
  }

  return message;
}

// Send email digest to team members
async function sendEmailDigest(teamId, ideas) {
  try {
    // Get team members
    const { data: users } = await supabase
      .from('users')
      .select('email')
      .eq('team_id', teamId);

    if (!users || users.length === 0) return;

    // Format email content
    const emailContent = formatIdeasForEmail(ideas);

    // Send to each user
    for (const user of users) {
      await supabase
        .from('notifications')
        .insert({
          team_id: teamId,
          user_id: null,
          type: 'daily_screening',
          recipient_email: user.email,
          content: emailContent,
          status: 'pending'
        });

      // In production, integrate with SendGrid/Resend here
      console.log(`Queued email for ${user.email}`);
    }

  } catch (error) {
    console.error('Email digest error:', error);
  }
}

// Format ideas for email
function formatIdeasForEmail(ideas) {
  let email = `<h2>📈 Your Daily Stock Ideas</h2>`;
  
  for (const [category, content] of Object.entries(ideas)) {
    email += `<h3>${category.toUpperCase().replace('-', ' ')}</h3>`;
    email += `<p>${content.replace(/\n/g, '<br>')}</p>`;
  }

  email += `<p><em>Generated by Stock Advisor on ${new Date().toLocaleDateString()}</em></p>`;
  return email;
}

// Cron handler for Vercel
export default async function handler(req, res) {
  // Verify this is from Vercel Cron
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await runDailyScreening();
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

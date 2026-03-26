// pages/api/cron/price-check.js
// Runs weekdays at 9am, 12pm, 3pm, 6pm — checks price alerts and sends notifications
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

async function getStockPrice(ticker) {
  try {
    const response = await axios.get(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    return response.data?.c || null; // current price
  } catch (error) {
    console.error(`Price fetch error for ${ticker}:`, error.message);
    return null;
  }
}

async function checkPriceAlerts() {
  // Log job start
  await supabase.from('job_logs').insert({
    job_type: 'price_check',
    status: 'started'
  });

  // Get all active alerts
  const { data: alerts, error } = await supabase
    .from('price_alerts')
    .select('*')
    .eq('is_active', true);

  if (error) throw error;

  let triggered = 0;

  for (const alert of alerts || []) {
    const currentPrice = await getStockPrice(alert.ticker);
    if (currentPrice === null) continue;

    const shouldTrigger =
      (alert.alert_type === 'above' && currentPrice >= alert.target_price) ||
      (alert.alert_type === 'below' && currentPrice <= alert.target_price);

    if (shouldTrigger) {
      triggered++;

      // Get user details
      const { data: user } = await supabase
        .from('users')
        .select('email, team_id')
        .eq('id', alert.user_id)
        .single();

      if (user?.email) {
        // Queue notification
        await supabase.from('notifications').insert({
          user_id: alert.user_id,
          team_id: user.team_id,
          type: 'price_alert',
          recipient_email: user.email,
          content: `🔔 Price alert: ${alert.ticker} is now $${currentPrice.toFixed(2)} — your target was ${alert.alert_type} $${alert.target_price}`,
          status: 'pending'
        });
      }

      // Mark alert as triggered
      await supabase
        .from('price_alerts')
        .update({ is_active: false, triggered_at: new Date() })
        .eq('id', alert.id);

      console.log(`Alert triggered: ${alert.ticker} at $${currentPrice}`);
    }
  }

  // Log completion
  await supabase.from('job_logs').insert({
    job_type: 'price_check',
    status: 'completed',
    completed_at: new Date()
  });

  return { checked: alerts?.length || 0, triggered };
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await checkPriceAlerts();
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Price check failed:', error);

    await supabase.from('job_logs').insert({
      job_type: 'price_check',
      status: 'failed',
      error_message: error.message,
      completed_at: new Date()
    }).catch(() => {});

    return res.status(500).json({ error: error.message });
  }
}

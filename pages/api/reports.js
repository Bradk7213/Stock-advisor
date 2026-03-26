// pages/api/reports.js - Fetch reports and price alerts for a user
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    // Get research reports for a user (most recent first)
    if (action === 'get-reports') {
      const { data: reports, error } = await supabase
        .from('reports')
        .select('id, ticker, analysis, recommendation, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Normalize field names for the frontend
      const normalized = (reports || []).map(r => ({
        ...r,
        timestamp: r.created_at,
      }));

      return res.status(200).json({ reports: normalized });
    }

    // Get active price alerts for a user
    if (action === 'get-alerts') {
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('id, ticker, target_price, alert_type, is_active, created_at, triggered_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ alerts: alerts || [] });
    }

    return res.status(400).json({ error: 'Invalid action' });

  } catch (error) {
    console.error('Reports API error:', error);
    return res.status(500).json({ error: error.message });
  }
}

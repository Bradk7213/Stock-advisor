# Stock Advisor App - Complete Setup Guide

## Overview
This is a full-stack stock research application with:
- React frontend (deployed to Vercel)
- Node.js serverless backend (Vercel functions)
- PostgreSQL database (Supabase)
- Automated daily stock screening
- Email & Microsoft Teams notifications
- Claude AI-powered analysis

---

## Step 1: Get Free API Keys (5 minutes)

### A. Finnhub API Key
1. Go to https://finnhub.io/
2. Sign up (free account)
3. Copy your API key from the dashboard
4. Keep it safe - you'll need it later

### B. Alpha Vantage API Key
1. Go to https://www.alphavantage.co/
2. Sign up (free account)
3. Copy your API key from email/dashboard
4. Keep it safe - you'll need it later

### C. Claude API Key (Anthropic)
1. Go to https://console.anthropic.com/
2. Log in with your Anthropic account
3. Create an API key
4. Keep it safe - you'll need it later

---

## Step 2: Set Up Supabase (Database)

1. Go to https://supabase.com/
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new project:
   - Name: `stock-advisor`
   - Region: Choose closest to you
   - Password: Create a strong password (save it!)
5. Wait for the project to initialize (2-3 minutes)
6. In the Supabase dashboard, go to Settings → API
7. Copy:
   - `Project URL` (this is your SUPABASE_URL)
   - `anon public` key (this is your SUPABASE_ANON_KEY)
   - `service_role` key (this is your SUPABASE_SERVICE_ROLE_KEY)
8. Keep all keys safe

---

## Step 3: Deploy to Vercel

1. Go to https://vercel.com/
2. Sign up with GitHub (recommended)
3. Import the repository (you'll get a link from me)
4. Create a new project
5. Add environment variables in Vercel dashboard:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
FINNHUB_API_KEY=<your-finnhub-key>
ALPHA_VANTAGE_API_KEY=<your-alpha-vantage-key>
ANTHROPIC_API_KEY=<your-claude-api-key>
NEXTAUTH_SECRET=<generate-random-string>
JWT_SECRET=<generate-random-string>
```

6. Deploy!
7. Your app will be live at `https://your-project.vercel.app`

---

## Step 4: Set Up Microsoft Teams Integration (Optional)

If you want Teams notifications:

1. Go to your Microsoft Teams workspace
2. Click the channel where you want Stock Advisor updates
3. Click "⋯" (More options) → Connectors
4. Search for "Incoming Webhook"
5. Configure it:
   - Name: `Stock Advisor`
   - Image: Use any stock market emoji
6. Copy the Webhook URL
7. Add to Vercel environment variables:

```
TEAMS_WEBHOOK_URL=<your-webhook-url>
```

---

## Step 5: Set Up Email Notifications (Optional)

For weekly digests and price alerts, you can use:

**Option A: SendGrid (Free tier: 100 emails/day)**
1. Go to https://sendgrid.com/
2. Sign up (free account)
3. Create an API key
4. Add to environment variables:
```
SENDGRID_API_KEY=<your-sendgrid-key>
```

**Option B: Resend (Free tier: unlimited for development)**
1. Go to https://resend.com/
2. Sign up (free account)
3. Create an API key
4. Add to environment variables:
```
RESEND_API_KEY=<your-resend-key>
```

---

## Step 6: Configure Database Tables

Once Supabase is set up:

1. Go to Supabase dashboard → SQL Editor
2. Run the initialization script provided
3. Tables created:
   - `users` - User accounts
   - `teams` - Team information
   - `portfolios` - Holdings tracked by each user
   - `reports` - Saved stock research reports
   - `price_alerts` - Price alert settings
   - `screening_results` - Daily screening results
   - `notifications` - Log of sent notifications

---

## Step 7: Test Everything

1. Go to your Vercel app URL
2. Sign up with an email address
3. Try researching a stock (e.g., "AAPL")
4. Create a price alert
5. Check your email for notifications

---

## Running Locally (Optional)

If you want to develop locally:

```bash
# Clone the repo
git clone <your-repo-url>
cd stock-advisor

# Install dependencies
npm install

# Create .env.local file with your API keys
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
# ... (add all keys from Step 3)

# Run dev server
npm run dev

# Visit http://localhost:3000
```

---

## Troubleshooting

**Q: I'm getting API errors**
A: Check that all environment variables are set correctly in Vercel

**Q: Daily screening isn't running**
A: Check that the scheduled job is enabled in your Vercel project settings

**Q: Teams notifications aren't working**
A: Verify your webhook URL is correct and hasn't expired

**Q: Database errors**
A: Check that Supabase tables are properly initialized

---

## Support

For issues or questions:
1. Check the error messages in Vercel logs
2. Check Supabase logs
3. Verify all API keys are correct
4. Restart the Vercel deployment

---

## Next Steps (After MVP)

- Add more stock screening criteria
- Implement portfolio backtesting
- Add user preferences & custom watchlists
- Create team collaboration features
- Add more API integrations (crypto, international stocks)

Good luck! 🚀

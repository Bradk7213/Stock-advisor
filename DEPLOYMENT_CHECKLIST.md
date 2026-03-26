# 🚀 Stock Advisor - Deployment Checklist

## Phase 1: Get API Keys (15 minutes)

- [ ] **Finnhub API Key**
  - Go to https://finnhub.io/
  - Sign up with email
  - Copy API key from dashboard
  - Save somewhere safe

- [ ] **Alpha Vantage API Key**
  - Go to https://www.alphavantage.co/
  - Sign up with email
  - Check email for API key
  - Save somewhere safe

- [ ] **Claude API Key**
  - Go to https://console.anthropic.com/
  - Log in to Anthropic account
  - Click "API keys" → "Create new key"
  - Copy the key
  - Save somewhere safe

## Phase 2: Set Up Database (10 minutes)

- [ ] **Create Supabase Project**
  - Go to https://supabase.com/
  - Click "Start your project"
  - Sign up with email or GitHub
  - Create new project:
    - Name: `stock-advisor`
    - Region: Closest to you
    - Password: Strong password (save it!)
  - Wait 2-3 minutes for initialization

- [ ] **Get Supabase Keys**
  - Go to Settings → API
  - Copy `Project URL` → save as `SUPABASE_URL`
  - Copy `anon public` key → save as `SUPABASE_ANON_KEY`
  - Copy `service_role` key → save as `SUPABASE_SERVICE_ROLE_KEY`

- [ ] **Initialize Database**
  - Go to SQL Editor in Supabase
  - Click "New query"
  - Copy all SQL from `schema.sql` file
  - Paste into editor
  - Click "Run"
  - Wait for tables to be created

## Phase 3: Deploy to Vercel (10 minutes)

- [ ] **Prepare for GitHub**
  - Create a new GitHub repository
  - Clone this project code into it
  - Push all files to GitHub

- [ ] **Create Vercel Project**
  - Go to https://vercel.com/
  - Sign up with GitHub
  - Click "New Project"
  - Select your GitHub repository
  - Click "Import"

- [ ] **Add Environment Variables**
  - In Vercel dashboard, go to Settings → Environment Variables
  - Add all variables from below:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
FINNHUB_API_KEY=<your-finnhub-key>
ALPHA_VANTAGE_API_KEY=<your-alpha-vantage-key>
ANTHROPIC_API_KEY=<your-claude-api-key>
JWT_SECRET=<generate-random-string-30-chars>
NEXTAUTH_SECRET=<generate-random-string-30-chars>
CRON_SECRET=<generate-random-string-30-chars>
TEAMS_WEBHOOK_URL= (optional, add later)
SENDGRID_API_KEY= (optional, add later)
```

- [ ] **Deploy**
  - Click "Deploy"
  - Wait 2-3 minutes
  - You'll get a URL like `https://stock-advisor-abc123.vercel.app`

## Phase 4: Test the App (5 minutes)

- [ ] **Visit Your App**
  - Go to your Vercel URL
  - Click "Sign Up"
  - Create an account with email/password
  - You should see the dashboard

- [ ] **Test Research**
  - Enter ticker: `AAPL`
  - Click "Research"
  - Wait 10-30 seconds
  - You should see AI analysis

- [ ] **Test Discover Ideas**
  - Click "Discover Ideas" tab
  - Click any category (e.g., "Trending Now")
  - Wait 10-30 seconds
  - You should see 3-4 stock ideas

## Phase 5: Add Team Members (Optional)

- [ ] **Invite Team Members**
  - Go to "Team" tab
  - Get email address of team member
  - Have them sign up first at your app URL
  - Then in Team tab, add them by email

- [ ] **Enable Notifications (Optional)**
  - Set up Microsoft Teams webhook (see below)
  - Set up email with SendGrid/Resend (see below)

## Phase 6: Microsoft Teams Integration (Optional, 5 minutes)

If you want daily stock ideas posted to Teams:

- [ ] **Create Webhook**
  - In Teams, find the channel for stock ideas
  - Click "⋯" (More options)
  - Find "Connectors"
  - Search for "Incoming Webhook"
  - Click "Configure"
  - Name: "Stock Advisor"
  - Image: Any stock emoji
  - Click "Create"
  - Copy the long webhook URL

- [ ] **Add to Vercel**
  - Go to Vercel Settings → Environment Variables
  - Add new variable: `TEAMS_WEBHOOK_URL`
  - Paste your webhook URL
  - Click "Add"
  - Vercel will auto-redeploy

- [ ] **Test**
  - Daily screening will run at 8am
  - Check your Teams channel at 8:05am
  - You should see stock ideas

## Phase 7: Email Notifications (Optional, 5 minutes)

If you want weekly digests and price alerts by email:

### Option A: SendGrid (100 free emails/day)
- [ ] Sign up at https://sendgrid.com/
- [ ] Create an API key
- [ ] Add to Vercel: `SENDGRID_API_KEY=<your-key>`
- [ ] Redeploy

### Option B: Resend (unlimited free)
- [ ] Sign up at https://resend.com/
- [ ] Create an API key
- [ ] Add to Vercel: `RESEND_API_KEY=<your-key>`
- [ ] Redeploy

## ✅ You're Done!

Your app is now live and running. Here's what happens automatically:

- **Daily at 8am**: Stock screening runs, posts to Teams
- **Weekdays 9am-6pm**: Price alerts checked
- **Every Monday 8am**: Weekly digest sent to email
- **24/7**: You can use the app anytime to research stocks

## Helpful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://app.supabase.com/
- **Claude API Dashboard**: https://console.anthropic.com/
- **Your App**: https://your-vercel-project-url

## Troubleshooting Quick Fixes

**Q: App shows 500 error**
A: Check Vercel logs - likely missing environment variable

**Q: Daily screening didn't run**
A: Vercel cron jobs are enabled by default, but try manual: go to /api/cron/daily-screening

**Q: Stock data not showing**
A: Check Finnhub API key in Vercel environment variables

**Q: Can't see reports**
A: Make sure Supabase database tables were created correctly

**Q: Teams notifications not working**
A: Verify webhook URL is current (they expire after 6 months)

## Support

For detailed setup help:
1. See SETUP_GUIDE.md
2. Check README.md
3. Review error logs in Vercel dashboard

Good luck! 🚀

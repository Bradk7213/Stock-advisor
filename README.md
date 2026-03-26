# 📈 Stock Advisor - Complete Full-Stack Application

An AI-powered stock research and recommendation platform for teams. Built with React, Node.js, PostgreSQL, and Claude AI.

## Features

✅ **AI-Powered Stock Analysis** — Claude AI analyzes real stock data for comprehensive insights  
✅ **Automated Daily Screening** — AI discovers trending, undervalued, and growth stocks daily at 8am  
✅ **Team Collaboration** — Share research, track holdings, and collaborate with your team  
✅ **Price Alerts** — Get notified when stocks hit your target prices  
✅ **Weekly Digests** — Email summaries of the week's best opportunities  
✅ **Microsoft Teams Integration** — Get daily stock ideas posted to Teams  
✅ **Real Financial Data** — Integrated with Finnhub and Alpha Vantage APIs  
✅ **Mobile Responsive** — Works on desktop, tablet, and mobile  

## Tech Stack

- **Frontend**: React 18 + Next.js 14
- **Backend**: Node.js + Express (Vercel Serverless Functions)
- **Database**: PostgreSQL (Supabase)
- **AI**: Claude Sonnet 4 (Anthropic)
- **Financial Data**: Finnhub + Alpha Vantage
- **Hosting**: Vercel
- **Notifications**: Email + Microsoft Teams

## Quick Start (5 minutes)

### Step 1: Get API Keys

1. **Finnhub** — https://finnhub.io/
   - Sign up (free)
   - Copy API key from dashboard

2. **Alpha Vantage** — https://www.alphavantage.co/
   - Sign up (free)
   - Copy API key from email

3. **Claude API** — https://console.anthropic.com/
   - Sign up (free tier available)
   - Create an API key

### Step 2: Set Up Database (Supabase)

1. Go to https://supabase.com/ and sign up
2. Create a new project (name: `stock-advisor`)
3. Wait for initialization
4. Go to Settings → API
5. Copy:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
6. Go to SQL Editor and run the schema from `schema.sql`

### Step 3: Deploy to Vercel

1. Go to https://vercel.com/
2. Click "New Project" and import this repository
3. Add environment variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FINNHUB_API_KEY=your_finnhub_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key
ANTHROPIC_API_KEY=your_claude_api_key
JWT_SECRET=generate_random_string
NEXTAUTH_SECRET=generate_random_string
CRON_SECRET=generate_random_string
```

4. Deploy!
5. Your app is live at `https://your-project.vercel.app`

### Step 4: Create Your Account

1. Visit your app URL
2. Click "Sign Up"
3. Enter email, password, full name
4. You'll be redirected to dashboard

### Step 5: (Optional) Set Up Microsoft Teams

If you want Teams notifications:

1. In Teams, find your desired channel
2. Click "⋯" (More) → Connectors
3. Search "Incoming Webhook"
4. Name it "Stock Advisor"
5. Copy the webhook URL
6. Add to Vercel environment: `TEAMS_WEBHOOK_URL=<your_webhook_url>`

## Usage

### Research Tab
- Enter any stock ticker (AAPL, VOO, QQQ, etc.)
- Optionally add investment context
- Get AI-powered analysis with:
  - Buy/Hold/Sell recommendation
  - Valuation metrics
  - Risk assessment
  - Peer comparison
  - Portfolio fit analysis

### Discover Tab
Pick a strategy to get 3-4 stock ideas:
- 🔥 **Trending Now** — Stocks gaining momentum
- 💰 **Undervalued** — Trading below fair value
- 📈 **High Growth** — Strong upside potential
- 💵 **Dividend Payers** — Income stocks
- 🎯 **ETF Screener** — Best ETFs by strategy
- ⭐ **Sector Leaders** — Top performers

### Reports Tab
- View all past research
- See full analysis with metrics
- Track recommendation history

### Alerts Tab
- Set price targets (notify when hit)
- Track multiple stocks simultaneously
- Get email notifications

### Team Tab
- Add team members
- Share research and findings
- Collaborate on investment decisions

## Daily Automation

The app automatically:

- **8:00 AM** — Runs daily screening, generates 3 stock ideas, posts to Teams
- **9am, 12pm, 3pm, 6pm** — Checks price alerts (weekdays)
- **Monday 8:00 AM** — Sends weekly digest email

## Database Schema

Tables created:
- `users` — User accounts
- `teams` — Team information
- `portfolios` — Holdings tracked
- `reports` — Research reports
- `price_alerts` — Price alert settings
- `screening_results` — Daily screening results
- `notifications` — Log of sent notifications
- `job_logs` — Automation job history

## Configuration

### Email Notifications (Optional)

**Option A: SendGrid**
1. Sign up at https://sendgrid.com/ (free tier: 100/day)
2. Create API key
3. Add to environment: `SENDGRID_API_KEY=<key>`

**Option B: Resend**
1. Sign up at https://resend.com/ (unlimited free)
2. Create API key
3. Add to environment: `RESEND_API_KEY=<key>`

### Customize Daily Screening

Edit `/api/cron/daily-screening.js` to change:
- Screening categories (line ~50)
- Stock selection criteria
- Notification channels
- Scheduling

## Development (Local)

```bash
# Install dependencies
npm install

# Create .env.local with your API keys
cp .env.local.example .env.local
# Edit .env.local with your keys

# Run dev server
npm run dev

# Visit http://localhost:3000
```

## Troubleshooting

**Q: Getting API errors**
A: Check that all environment variables are set in Vercel dashboard

**Q: Daily screening not running**
A: Verify in Vercel project settings that "Cron Jobs" are enabled

**Q: Teams notifications not working**
A: Check your webhook URL is correct and hasn't expired

**Q: Stock data missing**
A: Verify Finnhub and Alpha Vantage API keys are valid

**Q: Can't log in**
A: Check Supabase connection in Settings → API

## Support

For issues:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs in dashboard
3. Verify all API keys are correct
4. Try restarting: `vercel redeploy`

## Next Steps

After launching, you can add:

- **Backtesting**: See how past recommendations performed
- **Portfolio Tracking**: Monitor total returns
- **Custom Watchlists**: Save favorite stocks
- **Advanced Filtering**: Custom screening criteria
- **More APIs**: Crypto, international stocks, bonds
- **Slack Integration**: Alerts in Slack
- **Export Reports**: PDF/CSV downloads

## Security Notes

- Passwords hashed with bcryptjs
- JWT tokens expire in 30 days
- Row-level security enabled in database
- API keys stored in Vercel secrets (not in code)
- HTTPS enforced on all Vercel domains
- Rate limiting on API endpoints

## Costs

**Free Tier Estimates:**
- Vercel: Free (up to $150/month)
- Supabase: Free (500MB database)
- Finnhub: Free (60 req/min)
- Alpha Vantage: Free (5 req/min)
- Claude API: Pay-as-you-go (~$0.01 per analysis)
- **Monthly cost: ~$5-10 or free**

## License

MIT License - Use freely for personal/commercial use

## Questions?

Check the SETUP_GUIDE.md for detailed step-by-step instructions.

---

**Ready to launch?** 🚀

1. Copy `.env.local.example` to `.env.local`
2. Add your API keys
3. Deploy to Vercel
4. Visit your app URL
5. Sign up and start researching!

# AI Job Apply - Multi-Agent Platform

A 100% free, open-source multi-agent AI job application platform. 10 specialized AI agents collaborate to automate your entire job search pipeline — from resume optimization to application tracking.

## Features

- **10 Specialized AI Agents** working together:
  - **Manager Agent** - Orchestrates all other agents, delegates tasks
  - **Resume Writer Agent** - Parses, analyzes, tailors resumes for each job, ATS optimization
  - **Job Reviewer Agent** - Evaluates jobs, checks eligibility, location/remote matching, skill scoring
  - **Strategy Maker Agent** - Creates personalized job search strategies, market analysis
  - **Job Applier Agent** - Handles application submission, batch apply, follow-up scheduling
  - **Form Filler Agent** - Auto-fills application forms, answers screening questions
  - **Company Researcher Agent** - Researches companies, culture assessment, interview prep
  - **Account Manager Agent** - Creates/manages platform accounts, generates secure passwords
  - **Ops Manager Agent** - Dashboard, analytics, timeline tracking, reporting
  - **Product Manager Agent** - Pipeline management, prioritization, roadmap planning

- **Smart Job Matching** - AI scores jobs based on skills, location, experience, job type (remote/onsite/hybrid)
- **Resume Upload & Analysis** - Upload PDF/TXT resume, get skills extraction, ATS score, improvement suggestions
- **Gmail Integration** - Connect Gmail via free Google OAuth2 for account creation
- **Secure Credential Storage** - AES-256 encrypted passwords for all job platforms
- **Application Timeline** - Track every step of every application
- **Analytics Dashboard** - Conversion rates, platform breakdown, recommendations

## Tech Stack (All Free & Open Source)

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React 18, Tailwind CSS, Vite, Lucide Icons
- **Security**: AES-256 encryption (crypto-js), bcryptjs
- **Resume Parsing**: pdf-parse
- **No paid APIs required** - All agent logic is built-in

## Quick Start

### Prerequisites
- Node.js 18+
- npm

### Setup

```bash
# Clone the repo
git clone https://github.com/Maliktayyab764/Ai-Claude-agent.git
cd Ai-Claude-agent

# Install backend dependencies
cd server
cp .env.example .env
npm install

# Install frontend dependencies
cd ../client
npm install

# Start the backend (from server/)
cd ../server
npm run dev

# In a new terminal, start the frontend (from client/)
cd client
npm run dev
```

The app will be available at `http://localhost:5173` (frontend) and `http://localhost:5000` (API).

### Gmail Integration (Optional, Free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (free)
3. Enable Gmail API
4. Create OAuth 2.0 Client ID
5. Set redirect URI to `http://localhost:5000/api/gmail/callback`
6. Add Client ID and Secret to your `.env` file

## Architecture

```
Orchestrator
├── Manager Agent (coordinates all agents)
├── Resume Writer Agent (resume parsing, tailoring, ATS optimization)
├── Job Reviewer Agent (job evaluation, eligibility, ranking)
├── Strategy Maker Agent (strategy planning, market analysis)
├── Job Applier Agent (application submission, tracking)
├── Form Filler Agent (form analysis, auto-fill)
├── Company Researcher Agent (company research, culture fit)
├── Account Manager Agent (platform accounts, credentials)
├── Ops Manager Agent (dashboard, analytics, timeline)
└── Product Manager Agent (pipeline, prioritization, roadmap)
```

## API Endpoints

- `POST /api/users` - Create/login user
- `POST /api/resume/upload/:userId` - Upload and analyze resume
- `POST /api/jobs` - Add a job to track
- `GET /api/agents/status` - Get all agent statuses
- `POST /api/agents/delegate` - Delegate task to specific agent
- `POST /api/agents/workflow` - Run multi-agent workflow
- `GET /api/agents/dashboard/:userId` - Get full dashboard
- `GET /api/agents/timeline/:userId` - Get application timeline
- `GET /api/agents/analytics/:userId` - Get analytics
- `POST /api/agents/accounts/setup` - Auto-setup all platform accounts

## License

MIT

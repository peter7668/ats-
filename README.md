# ATS Resume Builder Pro — Deployment Guide

## Project Structure
```
ats-deploy/
├── src/              ← React frontend
│   ├── App.jsx       ← Main app
│   └── index.js      ← Entry point
├── public/
│   └── index.html
├── server/
│   ├── index.js      ← Express proxy server
│   ├── package.json
│   └── .env          ← Your API key goes here
├── package.json      ← Frontend deps
└── Dockerfile        ← For cloud deploy
```

---

## OPTION A — Deploy on Railway (Recommended, Free)

### Step 1 — Install Git (if not already)
- Download from: https://git-scm.com/downloads
- Install with all defaults

### Step 2 — Create GitHub Repository
1. Go to github.com → Sign in → Click "New repository"
2. Name it: `ats-resume-builder`
3. Set to Public, click "Create repository"

### Step 3 — Upload your code
Open Terminal / Command Prompt in the project folder and run:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ats-resume-builder.git
git push -u origin main
```

### Step 4 — Deploy on Railway
1. Go to railway.app → Sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your `ats-resume-builder` repo
4. Railway auto-detects the Dockerfile ✓
5. Go to "Variables" tab → Add:
   ```
   ANTHROPIC_API_KEY = sk-ant-your-actual-key-here
   NODE_ENV = production
   ```
6. Click Deploy → Wait 2-3 minutes
7. Go to "Settings" → "Domains" → Click "Generate Domain"
8. 🎉 Your app is live at: `https://ats-resume-builder-xxx.railway.app`

---

## OPTION B — Run Locally (Test on your PC)

### Requirements
- Node.js 18+ (download from nodejs.org)

### Step 1 — Install dependencies
```bash
# In the root folder (ats-deploy/)
npm install

# In the server folder
cd server
npm install
cd ..
```

### Step 2 — Add your API key
Edit `server/.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

### Step 3 — Run frontend + backend together
Open TWO terminal windows:

**Terminal 1 (Frontend):**
```bash
npm start
# Opens at http://localhost:3000
```

**Terminal 2 (Backend):**
```bash
cd server
node index.js
# Runs at http://localhost:3001
```

Open browser at: http://localhost:3000 ✅

---

## OPTION C — Deploy on Render (Also Free)

1. Go to render.com → Sign up
2. Click "New" → "Web Service"
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `npm install && npm run build && cd server && npm install`
   - **Start Command:** `node server/index.js`
5. Add Environment Variable:
   ```
   ANTHROPIC_API_KEY = sk-ant-your-key
   NODE_ENV = production
   ```
6. Click "Create Web Service" → Deploy!

---

## Common Issues

| Problem | Fix |
|---|---|
| "API key missing" | Check server/.env has your real key |
| "Port already in use" | Change PORT=3002 in .env |
| Build fails | Run `npm install` in root AND server/ |
| CORS error | Make sure backend is running on port 3001 |

---

## Cost Estimate
- Hosting: **FREE** (Railway/Render free tier)
- API cost: ~$0.01–0.03 per resume generated
- $5 free Anthropic credits = 150–500 resumes

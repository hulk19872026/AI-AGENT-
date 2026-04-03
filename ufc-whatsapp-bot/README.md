# 🥊 UFC AI Analyst — WhatsApp Bot

Text any UFC fight or fighter to a WhatsApp number and get instant AI-powered analysis, predictions, and betting picks powered by Claude.

---

## HOW IT WORKS

```
You (WhatsApp) → Twilio → Your Server → Claude API → Back to You
```

1. You text a WhatsApp number
2. Twilio receives it and forwards to your server
3. Server calls Claude with your UFC analyst prompt
4. Claude responds
5. You receive the analysis in WhatsApp

---

## STEP 1 — Get Your API Keys

### Anthropic API Key (for Claude)
1. Go to https://console.anthropic.com/settings/keys
2. Click **"Create Key"**
3. Copy the key — starts with `sk-ant-...`
4. Add some credits at https://console.anthropic.com/settings/billing

### Twilio Account (for WhatsApp)
1. Sign up free at https://www.twilio.com/try-twilio
2. Once in the console, go to **Messaging → Senders → WhatsApp Senders**
3. Use the **Sandbox** for testing (free, instant)
   - Go to: https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn
   - You'll get a sandbox number like `+1 415 523 8886`
   - Follow the instructions to join the sandbox (text "join [word]" to that number)
4. Note your **Account SID** and **Auth Token** from the Twilio console homepage

---

## STEP 2 — Deploy Your Server (FREE on Railway)

Railway is the easiest way to host this — free tier included.

### Option A: Deploy to Railway (Recommended)
1. Go to https://railway.app and sign up with GitHub
2. Click **"New Project" → "Deploy from GitHub repo"**
3. Push this folder to a GitHub repo first:
   ```bash
   git init
   git add .
   git commit -m "UFC AI Bot"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ufc-bot.git
   git push -u origin main
   ```
4. In Railway, select your repo and deploy
5. Go to **Settings → Environment Variables** and add:
   ```
   ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
   TWILIO_ACCOUNT_SID=ACxxxxxxxx
   TWILIO_AUTH_TOKEN=your_token
   PORT=3000
   ```
6. Railway will give you a public URL like:
   `https://ufc-bot-production.up.railway.app`

### Option B: Deploy to Render (Also Free)
1. Go to https://render.com and sign up
2. Click **"New Web Service"**
3. Connect your GitHub repo
4. Set **Build Command**: `npm install`
5. Set **Start Command**: `node server.js`
6. Add your environment variables in the Render dashboard
7. Deploy — you'll get a URL like `https://ufc-bot.onrender.com`

> ⚠️ Note: Render's free tier sleeps after 15 mins. Use Railway for always-on.

### Option C: Local Testing with ngrok
```bash
# Install dependencies
npm install

# Copy env file and fill in your keys
cp .env.example .env

# Start server
npm start

# In a new terminal, expose it publicly
npx ngrok http 3000
# Copy the https URL it gives you
```

---

## STEP 3 — Connect Twilio to Your Server

1. Go to Twilio Console → **Messaging → Senders → WhatsApp Senders → Sandbox**
2. Scroll to **"Sandbox Configuration"**
3. In the **"When a message comes in"** field, paste:
   ```
   https://YOUR-SERVER-URL/webhook
   ```
4. Set the method to **HTTP POST**
5. Click **Save**

---

## STEP 4 — Test It!

1. Open WhatsApp on your phone
2. Text the Twilio sandbox number (e.g., `+1 415 523 8886`)
3. Send: `Analyze Moicano vs Duncan`
4. You should get a full UFC analysis back within ~5 seconds!

---

## EXAMPLE MESSAGES TO SEND

```
Analyze Moicano vs Duncan
Best bets for UFC Vegas 115
Who wins Jon Jones vs Tom Aspinall?
Build me a 3-leg parlay for tonight
What are Jandiroba's martial arts skill levels?
Is Yakhyaev the real deal?
Give me Moicano's BJJ breakdown
Which fight should I avoid betting?
Help
```

---

## GOING TO PRODUCTION (Real WhatsApp Number)

The sandbox uses Twilio's shared number and requires users to opt in. For a dedicated WhatsApp number:

1. In Twilio → **Messaging → Senders → WhatsApp Senders**
2. Click **"Add Sender"** and follow the business verification
3. Meta will review and approve (takes 1-3 days)
4. You'll get a dedicated WhatsApp Business number

---

## COSTS

| Service | Cost |
|---------|------|
| Railway hosting | Free (500 hrs/month) |
| Twilio WhatsApp sandbox | Free |
| Twilio WhatsApp messages (production) | ~$0.005/msg |
| Claude API | ~$0.003 per analysis |
| **Total per analysis** | **~$0.01 or less** |

---

## COMMANDS

| Command | What it does |
|---------|-------------|
| `help` | Show menu |
| `clear` | Reset conversation |
| Any fighter/fight | Get analysis |

---

## TROUBLESHOOTING

**Bot not responding?**
- Check your server is running (visit the URL in browser — should see JSON)
- Check Twilio webhook URL is correct and has `/webhook` at the end
- Check environment variables are set correctly

**"Authentication failed" error?**
- Double-check your Anthropic API key
- Make sure you have billing set up at console.anthropic.com

**Messages cut off?**
- This is normal — long responses auto-split into multiple messages

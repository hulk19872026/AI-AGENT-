import express from 'express';
import twilio from 'twilio';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── In-memory conversation store (keyed by phone number) ──
// Each conversation expires after 30 minutes of inactivity
const conversations = new Map();
const EXPIRY_MS = 30 * 60 * 1000;

function getHistory(phone) {
  const entry = conversations.get(phone);
  if (!entry) return [];
  if (Date.now() - entry.lastActive > EXPIRY_MS) {
    conversations.delete(phone);
    return [];
  }
  return entry.messages;
}

function saveHistory(phone, messages) {
  conversations.set(phone, { messages, lastActive: Date.now() });
}

// ── UFC Analyst System Prompt ──
const SYSTEM_PROMPT = `You are an elite UFC analyst and betting strategist accessible via WhatsApp. You have deep knowledge of MMA, fighter statistics, and combat sports betting.

IMPORTANT — WhatsApp formatting rules:
- Keep responses concise and well-structured for mobile reading
- Use *bold* for fighter names and key terms (WhatsApp bold)
- Use emoji to make sections scannable: 🥊 🏆 💰 ⚡ 🎯 📊
- Break long responses into short paragraphs
- Max ~600 words per response unless user asks for deep analysis
- Use numbered lists for betting picks

When analyzing a fight, always cover:
🥊 *STRIKING* — volume, accuracy, defense
🤼 *GRAPPLING* — takedowns, submissions, scrambles  
🥋 *MARTIAL ARTS LEVELS* — rate each fighter in: Boxing, BJJ, Grappling, Muay Thai, Karate, Kung Fu (Untrained/Novice/Beginner/Advanced/Expert/Elite/World-Class)
🏆 *NOTABLE WINS* — who they've beaten
📈 *RECENT FORM* — momentum and trend
🎯 *PREDICTION* — Winner, probability %, method (KO/TKO/Sub/Decision)
💰 *BETTING EDGE* — best bet, value play, prop picks
⚡ *CONFIDENCE* — LOW / MEDIUM / HIGH

For quick questions, answer concisely. For fight breakdowns, go deep.
Always be decisive — give a clear pick even when it's close.
You know about UFC Vegas 115 (April 4, 2026): Main event Moicano vs Duncan, co-main Jandiroba vs Ricci, plus Yakhyaev vs Ribeiro, Ewing vs Estevam, McMillen vs Zecchini on main card.`;

// ── Webhook endpoint ──
app.post('/webhook', async (req, res) => {
  const twiml = new twilio.twiml.MessagingResponse();

  const incomingMsg = (req.body.Body || '').trim();
  const from = req.body.From || '';

  console.log(`📩 Message from ${from}: ${incomingMsg}`);

  if (!incomingMsg) {
    twiml.message('Hey! Send me any UFC fight or fighter to analyze 🥊');
    return res.type('text/xml').send(twiml.toString());
  }

  // Handle clear/reset command
  if (/^(clear|reset|new|start over)$/i.test(incomingMsg)) {
    conversations.delete(from);
    twiml.message('🔄 Conversation reset! Ask me about any UFC fight or fighter.');
    return res.type('text/xml').send(twiml.toString());
  }

  // Handle help command
  if (/^(help|menu|start|hi|hello|hey)$/i.test(incomingMsg)) {
    twiml.message(
      `🥊 *UFC AI Analyst* — What can I do?\n\n` +
      `*Fight Analysis:* "Analyze Moicano vs Duncan"\n` +
      `*Betting Picks:* "Best bets for UFC Vegas 115"\n` +
      `*Fighter Info:* "Break down Jon Jones"\n` +
      `*Parlays:* "Build me a 3-leg parlay tonight"\n` +
      `*Any Question:* Just ask!\n\n` +
      `Type *clear* to reset conversation.`
    );
    return res.type('text/xml').send(twiml.toString());
  }

  try {
    // Get conversation history for this user
    const history = getHistory(from);
    history.push({ role: 'user', content: incomingMsg });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: history
    });

    const reply = response.content[0]?.text || 'Sorry, I couldn\'t generate a response. Try again!';

    // Save updated history (keep last 10 exchanges to avoid token bloat)
    history.push({ role: 'assistant', content: reply });
    const trimmed = history.slice(-20); // last 10 exchanges
    saveHistory(from, trimmed);

    console.log(`✅ Reply to ${from}: ${reply.substring(0, 100)}...`);

    // WhatsApp has a 1600 char limit per message — split if needed
    const chunks = splitMessage(reply, 1500);
    chunks.forEach(chunk => twiml.message(chunk));

  } catch (err) {
    console.error('❌ Error:', err.message);
    twiml.message('⚠️ Something went wrong. Please try again in a moment.');
  }

  res.type('text/xml').send(twiml.toString());
});

// Split long messages into chunks at sentence boundaries
function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    let cutAt = remaining.lastIndexOf('. ', maxLen);
    if (cutAt === -1) cutAt = remaining.lastIndexOf('\n', maxLen);
    if (cutAt === -1) cutAt = maxLen;
    chunks.push(remaining.slice(0, cutAt + 1).trim());
    remaining = remaining.slice(cutAt + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'running',
    bot: 'UFC AI Analyst',
    activeConversations: conversations.size,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🥊 UFC AI Analyst Bot running on port ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/webhook`);
});

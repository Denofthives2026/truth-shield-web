const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are Truth Shield, a disinformation detection assistant. Analyze the provided text and return ONLY a JSON object with this exact structure:
{
  "risk_score": <integer 0-100>,
  "risk_level": <"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">,
  "verdict": <one clear sentence>,
  "signals": [<2-5 specific red flags, or empty array>],
  "explanation": <2-3 plain English sentences>,
  "recommendation": <one practical action>
}
Respond ONLY with the JSON object, no other text.`;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text || text.length < 20) {
    return res.status(400).json({ error: 'Text too short' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `Analyze this text for disinformation:\n\n${text.slice(0, 3000)}` }],
    });

    const raw = message.content[0].text.trim().replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const result = JSON.parse(raw);
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
};

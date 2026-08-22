import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { EdgeTTS } from 'edge-tts-universal';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-flash-latest';

// Voix neurales gratuites (service Microsoft Edge, sans cle API)
const FRENCH_VOICES = [
  { id: 'fr-FR-VivienneMultilingualNeural', label: 'Vivienne (femme, expressive)' },
  { id: 'fr-FR-DeniseNeural', label: 'Denise (femme, posee)' },
  { id: 'fr-FR-RemyMultilingualNeural', label: 'Remy (homme, expressif)' },
  { id: 'fr-FR-HenriNeural', label: 'Henri (homme, pose)' }
];

// Instructions selon le niveau choisi par l'apprenant
const LEVEL_INSTRUCTIONS = {
  debutant:
    "L'apprenant est DEBUTANT. Utilise des phrases courtes et simples, un vocabulaire de base, " +
    "parle lentement dans le style (phrases courtes), et n'hesite pas a reformuler simplement si besoin.",
  intermediaire:
    "L'apprenant est de niveau INTERMEDIAIRE. Utilise des phrases de longueur normale, un vocabulaire " +
    "courant et varie, et introduis quelques expressions idiomatiques simples.",
  avance:
    "L'apprenant est AVANCE. Parle naturellement comme avec un francophone natif, utilise des expressions " +
    "idiomatiques, un vocabulaire riche, et n'hesite pas a debattre ou nuancer tes propos."
};

function buildSystemPrompt(level) {
  const levelText = LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS.intermediaire;
  return `Tu es un partenaire de conversation en francais, patient, chaleureux et encourageant. Ton but est d'aider un apprenant a PRATIQUER LE FRANCAIS A L'ORAL par la conversation.

Regles importantes :
- Reponds TOUJOURS en francais, sauf si on te demande explicitement une traduction ou une explication en anglais.
- ${levelText}
- Si l'apprenant fait une faute de grammaire, de conjugaison ou de vocabulaire, corrige-le brievement et gentiment (une seule phrase courte de correction, precedee par exemple de "Petite correction :"), puis enchaine naturellement sur la conversation. Ne fais jamais un long cours de grammaire.
- Garde tes reponses assez courtes (2 a 4 phrases maximum) car elles seront lues a voix haute par une synthese vocale.
- Termine souvent (pas toujours) par une question simple pour relancer la conversation.
- Reste chaleureux, patient, jamais condescendant. Encourage les efforts de l'apprenant.
- N'utilise pas de markdown, d'emoji ou de mise en forme : ecris du texte parle naturel, car c'est vocalise.`;
}

app.post('/api/chat', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Cle API manquante. Cree un fichier .env avec GEMINI_API_KEY=ta_cle (voir .env.example)."
      });
    }

    const { messages, level } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages manquant ou vide' });
    }

    // On ne garde que les 20 derniers messages pour limiter la latence
    const trimmed = messages.slice(-20);

    // Gemini utilise les roles "user" et "model" (pas "assistant")
    const contents = trimmed.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: buildSystemPrompt(level) }] },
        generationConfig: {
          maxOutputTokens: 500,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur API Gemini:', data);
      return res.status(502).json({ error: data.error?.message || 'Erreur API Gemini' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur interne' });
  }
});

app.get('/api/voices', (req, res) => {
  res.json({ voices: FRENCH_VOICES });
});

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'texte manquant' });
    }
    const voiceId = FRENCH_VOICES.some((v) => v.id === voice) ? voice : FRENCH_VOICES[0].id;

    const tts = new EdgeTTS(text, voiceId);
    const result = await tts.synthesize();
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());

    res.set('content-type', 'audio/mpeg');
    res.send(audioBuffer);
  } catch (err) {
    console.error('Erreur TTS:', err);
    res.status(502).json({ error: 'Erreur generation vocale' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, keyConfigured: Boolean(GEMINI_API_KEY) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur pret : http://localhost:${PORT}`);
  console.log('Pour y acceder depuis ton telephone (meme WiFi), utilise l\'IP locale de ce PC.');
});

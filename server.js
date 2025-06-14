import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import multer from 'multer';
import FormData from 'form-data';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const upload = multer();

app.use(cors({
  origin: [
    'https://jobtaskpro.netlify.app',
    'https://jobtask.pro',
    'http://localhost:3000'
  ],
  methods: ['POST', 'GET', 'OPTIONS'],
  credentials: true
}));

app.post('/api/openai-proxy', upload.any(), async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Chave da OpenAI não configurada no backend.' });

  try {
    let openaiRes;
    let isAudio = false;

    // Áudio (Whisper)
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      isAudio = true;
      const form = new FormData();
      let fileFound = false;
      for (const file of req.files) {
        form.append('file', file.buffer, file.originalname);
        fileFound = true;
      }
      let hasModel = false;
      for (const key in req.body) {
        if (key === 'model') hasModel = true;
        form.append(key, req.body[key]);
      }
      if (!hasModel) {
        form.append('model', 'whisper-1');
      }
      if (!fileFound) {
        return res.status(400).json({ error: 'Arquivo de áudio não enviado.' });
      }
      openaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          ...form.getHeaders()
        },
        body: form
      });
    } else {
      // LOG PARA DEBUG
      console.log('Payload recebido:', JSON.stringify(req.body, null, 2));
      openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
      });
    }
    const data = await openaiRes.json();
    if (openaiRes.status !== 200) {
      return res.status(openaiRes.status).json({ error: data.error?.message || 'Erro na OpenAI', details: data });
    }
    if (isAudio) {
      return res.json({ text: data.text });
    } else {
      let content = '';
      if (data.choices && data.choices[0]) {
        content = data.choices[0].message?.content || data.choices[0].text || '';
      }
      return res.json({ text: content });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erro desconhecido no backend' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`));
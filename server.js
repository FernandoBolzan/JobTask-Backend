import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import multer from 'multer';
import FormData from 'form-data';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(express.json());

const upload = multer();

app.use(cors({
  origin: ['http://localhost:3000', 'https://seu-dominio.com'], // adicione outros domínios se necessário
  credentials: true
}));

app.post('/api/openai-proxy', upload.any(), async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return res.status(500).json({ error: 'Chave da OpenAI não configurada no backend.' });

  try {
    let openaiRes;
    let isAudio = false;
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
      if (!req.body.model) req.body.model = 'gpt-3.5-turbo';
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
    res.status(500).json({ error: err.message || 'Erro desconhecido no backend' });
  }
});

// (Opcional) Servir frontend buildado pelo backend
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend rodando na porta ${PORT}`)); 
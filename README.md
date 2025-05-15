# JobTash Backend

Backend para integração com a API da OpenAI, suportando tanto requisições de chat quanto transcrição de áudio.

## Requisitos

- Node.js 14.x ou superior
- NPM ou Yarn
- Chave de API da OpenAI

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```
PORT=3001
OPENAI_API_KEY=sua_chave_api_aqui
```

## Executando o projeto

Para desenvolvimento:
```bash
npm run dev
```

Para produção:
```bash
npm start
```

## Endpoints

### POST /api/openai-proxy

Este endpoint funciona como um proxy para a API da OpenAI, suportando dois tipos de requisições:

1. **Chat Completions** (GPT)
   - Content-Type: application/json
   - Corpo da requisição: Objeto JSON com os parâmetros da API da OpenAI
   - Modelo padrão: gpt-3.5-turbo

2. **Transcrição de Áudio** (Whisper)
   - Content-Type: multipart/form-data
   - Arquivo de áudio deve ser enviado no campo 'file'
   - Modelo padrão: whisper-1

## Respostas

Todas as respostas são retornadas no formato:
```json
{
  "text": "conteúdo da resposta"
}
```

Em caso de erro:
```json
{
  "error": "mensagem de erro",
  "details": "detalhes adicionais (opcional)"
}
``` 
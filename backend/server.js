import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'Backend ishlayapti' });
});

app.get('/', (_request, response) => {
  response.send(`<!doctype html>
<html lang="uz">
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>TishYor backend</title></head>
  <body><h1>Loyiha ishga tushirildi</h1><p>Backend muvaffaqiyatli ishlayapti.</p></body>
</html>`);
});

app.listen(port, () => {
  console.log(`Backend http://localhost:${port} manzilida ishlayapti`);
});

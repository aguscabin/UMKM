import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { handleSecurityApiRequest } from './netlify/functions/api';

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);

  // Gunakan text parser mentah agar batas 1MB & JSON parsing ditangani seragam dengan Netlify Functions
  app.use('/api', express.text({ type: '*/*', limit: '1100kb' }));

  app.all('/api/*', async (req, res) => {
    const rawBody = typeof req.body === 'string' ? req.body : '';
    const clientIp =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ||
      req.ip ||
      'unknown';

    const result = await handleSecurityApiRequest({
      method: req.method,
      pathname: req.originalUrl.split('?')[0],
      clientIp,
      headers: {
        authorization: req.headers.authorization,
      },
      rawBody,
    });

    for (const [k, v] of Object.entries(result.headers)) {
      res.setHeader(k, v);
    }

    if (result.status === 204) {
      res.status(204).end();
      return;
    }

    res.status(result.status).json(result.body);
  });

  if (!IS_PRODUCTION) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan pada http://0.0.0.0:${PORT} (mode: ${IS_PRODUCTION ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Gagal memulai server:', err);
  process.exit(1);
});

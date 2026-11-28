import { createApp } from './_server.mjs';

export default async function handler(req, res) {
  try {
    const rawUrl = String(req.url || '/');
    const parsed = new URL(rawUrl, 'http://localhost');
    const nzPath = parsed.searchParams.get('__nz_path');
    if (nzPath !== null) {
      parsed.searchParams.delete('__nz_path');
      const cleaned = nzPath.replace(/^\/+/, '');
      const encodedPath = cleaned
        .split('/')
        .filter((seg) => seg.length > 0)
        .map((seg) => encodeURIComponent(seg))
        .join('/');
      const qs = parsed.searchParams.toString();
      req.url = `/api/${encodedPath}${qs ? `?${qs}` : ''}`;
      if (req.query && typeof req.query === 'object') {
        delete req.query.__nz_path;
      }
    }

    const app = await createApp();
    await new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        if (typeof res.removeListener === 'function') {
          res.removeListener('finish', onDone);
          res.removeListener('close', onDone);
          res.removeListener('error', onError);
        }
      };
      const onDone = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };
      const onError = (err) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(err);
      };

      if (typeof res.on === 'function') {
        res.on('finish', onDone);
        res.on('close', onDone);
        res.on('error', onError);
      }

      try {
        app(req, res);
        if (typeof res.on !== 'function') {
          onDone();
        }
      } catch (err) {
        onError(err);
      }
    });
  } catch (err) {
    console.error('[api/index]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      if (typeof res.setHeader === 'function') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify({ error: err?.message || 'Internal server error' }));
    }
  }
}

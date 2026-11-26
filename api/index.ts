import { createApp } from '../server';

export default async function handler(req: any, res: any) {
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
    return app(req, res);
  } catch (err: any) {
    console.error('[api/index]', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
}

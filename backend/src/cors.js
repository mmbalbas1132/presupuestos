import { config } from './config.js';

export function middlewareCors(req, res, next) {
  const origen = req.headers.origin;

  if (config.allowedOrigin && origen && origen !== config.allowedOrigin) {
    return res.status(403).json({ error: 'Origen no autorizado.' });
  }

  if (config.allowedOrigin && origen === config.allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origen);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  next();
}

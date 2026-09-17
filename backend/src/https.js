import { config } from './config.js';

export function middlewareHttps(req, res, next) {
  if (!config.forceHttps || req.secure) {
    return next();
  }
  return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
}

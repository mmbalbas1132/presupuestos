import path from 'node:path';

export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'presupuestospro.sqlite'),
};

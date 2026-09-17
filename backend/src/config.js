import path from 'node:path';
import os from 'node:os';

const esTest = process.env.NODE_ENV === 'test';

try {
  process.loadEnvFile();
} catch {
  // No hay fichero .env (por ejemplo, en producción las variables ya están
  // en el entorno de despliegue); no es un error.
}

const CLAVE_ACCESO_PRUEBAS = 'clave-de-pruebas-automaticas-000000';

const accessKey = process.env.ACCESS_KEY || (esTest ? CLAVE_ACCESO_PRUEBAS : undefined);

if (!esTest && (!accessKey || accessKey.length < 16)) {
  throw new Error(
    'ACCESS_KEY no está configurada o es demasiado corta (mínimo 16 caracteres). ' +
      'Define esta variable de entorno antes de arrancar la aplicación (ver backend/.env.example).'
  );
}

export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || path.join(process.cwd(), 'presupuestospro.sqlite'),
  accessKey,
  allowedOrigin: process.env.ALLOWED_ORIGIN || null,
  forceHttps: process.env.FORCE_HTTPS === 'true',
  logPath:
    process.env.LOG_PATH ||
    (esTest
      ? // Sufijo aleatorio: cada fichero de test carga este módulo por separado
        // y vitest puede ejecutar ficheros en paralelo; sin esto, varios
        // ficheros de test compartirían el mismo log físico y sus eventos se
        // mezclarían.
        path.join(os.tmpdir(), `presupuestospro-test-security-${process.pid}-${Math.random().toString(36).slice(2)}.log`)
      : path.join(process.cwd(), 'security.log')),
};

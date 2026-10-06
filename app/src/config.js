// Toda la configuración proviene de variables de entorno (nunca credenciales en el código).
const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: process.env.DATABASE_URL || '',
  appVersion: process.env.APP_VERSION || 'dev',
  environment: process.env.NODE_ENV || 'development',
};

module.exports = config;

const config = require('./config');
const { createApp } = require('./app');
const { createPgRepository, createMemoryRepository } = require('./repository');

async function start() {
  const repo = config.databaseUrl ? createPgRepository(config.databaseUrl) : createMemoryRepository();
  if (!config.databaseUrl) console.warn('DATABASE_URL no definida: usando almacenamiento en memoria');

  // Reintentos: en el arranque con compose la base de datos puede tardar unos segundos.
  for (let intento = 1; intento <= 10; intento += 1) {
    try {
      await repo.init();
      break;
    } catch (err) {
      if (intento === 10) throw err;
      console.warn(`BD no disponible (intento ${intento}/10): ${err.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const app = createApp(repo, { version: config.appVersion, environment: config.environment });
  const server = app.listen(config.port, () => {
    console.log(`Inventario ${config.appVersion} escuchando en puerto ${config.port}`);
  });

  const shutdown = () => {
    server.close(async () => {
      await repo.close();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Error al iniciar:', err);
  process.exit(1);
});

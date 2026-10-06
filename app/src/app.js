const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { validarProducto, parseId } = require('./validation');

function createApp(repo, { version = 'dev', environment = 'development' } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: { directives: { 'script-src': ["'self'"], 'upgrade-insecure-requests': null } },
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(express.static(path.join(__dirname, '..', 'public')));

  const asyncH = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  // Salud y versión: usado por Docker HEALTHCHECK y por el CD para verificar el despliegue.
  app.get('/health', asyncH(async (_req, res) => {
    try {
      await repo.ping();
      res.json({ status: 'ok', db: 'up', version, environment });
    } catch {
      res.status(503).json({ status: 'error', db: 'down', version, environment });
    }
  }));
  app.get('/api/version', (_req, res) => res.json({ version, environment }));

  app.get('/api/productos', asyncH(async (_req, res) => {
    res.json(await repo.list());
  }));

  app.get('/api/productos/alertas', asyncH(async (_req, res) => {
    const items = await repo.list();
    res.json(items.filter((p) => p.stock <= p.stockMinimo));
  }));

  app.get('/api/productos/:id', asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const item = await repo.get(id);
    if (!item) return res.status(404).json({ error: 'producto no encontrado' });
    res.json(item);
  }));

  app.post('/api/productos', asyncH(async (req, res) => {
    const { errores, valor } = validarProducto(req.body);
    if (errores) return res.status(400).json({ errores });
    try {
      res.status(201).json(await repo.create(valor));
    } catch (err) {
      if (err.code === '23505') return res.status(409).json({ error: 'SKU ya existe' });
      throw err;
    }
  }));

  app.put('/api/productos/:id', asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { errores, valor } = validarProducto(req.body);
    if (errores) return res.status(400).json({ errores });
    const item = await repo.update(id, valor);
    if (!item) return res.status(404).json({ error: 'producto no encontrado' });
    res.json(item);
  }));

  // Movimiento de stock: { "cantidad": 5 } entrada, { "cantidad": -3 } salida.
  app.post('/api/productos/:id/movimientos', asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    const cantidad = req.body && req.body.cantidad;
    if (!id) return res.status(400).json({ error: 'id inválido' });
    if (!Number.isInteger(cantidad) || cantidad === 0) {
      return res.status(400).json({ error: 'cantidad: entero distinto de 0' });
    }
    if (!(await repo.get(id))) return res.status(404).json({ error: 'producto no encontrado' });
    const item = await repo.adjustStock(id, cantidad);
    if (!item) return res.status(409).json({ error: 'stock insuficiente' });
    res.json(item);
  }));

  app.delete('/api/productos/:id', asyncH(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    if (!(await repo.remove(id))) return res.status(404).json({ error: 'producto no encontrado' });
    res.status(204).end();
  }));

  app.use('/api', (_req, res) => res.status(404).json({ error: 'ruta no encontrada' }));

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido' });
    console.error(err);
    res.status(500).json({ error: 'error interno' });
  });

  return app;
}

module.exports = { createApp };

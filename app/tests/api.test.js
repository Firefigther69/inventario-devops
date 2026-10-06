const request = require('supertest');
const { createApp } = require('../src/app');
const { createMemoryRepository } = require('../src/repository');

const base = { sku: 'GAS-15KG', nombre: 'Cilindro gas 15 kg', categoria: 'Gas', stock: 10, stockMinimo: 3, precio: 21990 };

function nuevaApp() {
  return createApp(createMemoryRepository(), { version: 'test', environment: 'test' });
}

describe('Salud y versión', () => {
  test('GET /health responde ok con la versión', async () => {
    const res = await request(nuevaApp()).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'ok', db: 'up', version: 'test' });
  });

  test('GET /health responde 503 si la BD no responde', async () => {
    const repo = createMemoryRepository();
    repo.ping = async () => { throw new Error('down'); };
    const res = await request(createApp(repo)).get('/health');
    expect(res.status).toBe(503);
  });

  test('GET /api/version', async () => {
    const res = await request(nuevaApp()).get('/api/version');
    expect(res.body.version).toBe('test');
  });
});

describe('CRUD de productos', () => {
  let app;
  beforeEach(() => { app = nuevaApp(); });

  test('crea y lista un producto', async () => {
    const creado = await request(app).post('/api/productos').send(base);
    expect(creado.status).toBe(201);
    expect(creado.body.id).toBe(1);
    const lista = await request(app).get('/api/productos');
    expect(lista.body).toHaveLength(1);
  });

  test('rechaza datos inválidos con 400', async () => {
    const res = await request(app).post('/api/productos').send({ sku: 'x', nombre: '', stock: -1, precio: 'a' });
    expect(res.status).toBe(400);
    expect(res.body.errores.length).toBeGreaterThanOrEqual(4);
  });

  test('rechaza SKU duplicado con 409', async () => {
    await request(app).post('/api/productos').send(base);
    const res = await request(app).post('/api/productos').send(base);
    expect(res.status).toBe(409);
  });

  test('obtiene, actualiza y elimina', async () => {
    await request(app).post('/api/productos').send(base);
    expect((await request(app).get('/api/productos/1')).body.sku).toBe('GAS-15KG');
    const upd = await request(app).put('/api/productos/1').send({ ...base, nombre: 'Cilindro 15 kg' });
    expect(upd.body.nombre).toBe('Cilindro 15 kg');
    expect((await request(app).delete('/api/productos/1')).status).toBe(204);
    expect((await request(app).get('/api/productos/1')).status).toBe(404);
  });

  test('id inválido y recurso inexistente', async () => {
    expect((await request(app).get('/api/productos/abc')).status).toBe(400);
    expect((await request(app).put('/api/productos/99').send(base)).status).toBe(404);
    expect((await request(app).delete('/api/productos/99')).status).toBe(404);
  });

  test('JSON mal formado devuelve 400', async () => {
    const res = await request(app).post('/api/productos').set('Content-Type', 'application/json').send('{malo');
    expect(res.status).toBe(400);
  });

  test('ruta API inexistente devuelve 404', async () => {
    expect((await request(app).get('/api/nada')).status).toBe(404);
  });
});

describe('Movimientos de stock y alertas', () => {
  let app;
  beforeEach(async () => {
    app = nuevaApp();
    await request(app).post('/api/productos').send(base);
  });

  test('entrada y salida de stock', async () => {
    expect((await request(app).post('/api/productos/1/movimientos').send({ cantidad: 5 })).body.stock).toBe(15);
    expect((await request(app).post('/api/productos/1/movimientos').send({ cantidad: -12 })).body.stock).toBe(3);
  });

  test('no permite stock negativo', async () => {
    const res = await request(app).post('/api/productos/1/movimientos').send({ cantidad: -50 });
    expect(res.status).toBe(409);
  });

  test('valida cantidad y producto', async () => {
    expect((await request(app).post('/api/productos/1/movimientos').send({ cantidad: 0 })).status).toBe(400);
    expect((await request(app).post('/api/productos/9/movimientos').send({ cantidad: 1 })).status).toBe(404);
  });

  test('alertas de stock bajo', async () => {
    await request(app).post('/api/productos/1/movimientos').send({ cantidad: -8 });
    const res = await request(app).get('/api/productos/alertas');
    expect(res.body).toHaveLength(1);
  });
});

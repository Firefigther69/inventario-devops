// Capa de acceso a datos. Usa PostgreSQL cuando hay DATABASE_URL;
// en pruebas se usa un repositorio en memoria con la misma interfaz.
const { Pool } = require('pg');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS productos (
  id          SERIAL PRIMARY KEY,
  sku         VARCHAR(40)  NOT NULL UNIQUE,
  nombre      VARCHAR(120) NOT NULL,
  categoria   VARCHAR(60)  NOT NULL DEFAULT 'General',
  stock       INTEGER      NOT NULL DEFAULT 0 CHECK (stock >= 0),
  stock_minimo INTEGER     NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  precio      NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
  actualizado TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);`;

const COLS = 'id, sku, nombre, categoria, stock, stock_minimo AS "stockMinimo", precio::float AS precio, actualizado';

function createPgRepository(databaseUrl) {
  const pool = new Pool({ connectionString: databaseUrl });

  return {
    async init() {
      await pool.query(SCHEMA);
    },
    async ping() {
      await pool.query('SELECT 1');
    },
    async list() {
      const { rows } = await pool.query(`SELECT ${COLS} FROM productos ORDER BY id`);
      return rows;
    },
    async get(id) {
      const { rows } = await pool.query(`SELECT ${COLS} FROM productos WHERE id = $1`, [id]);
      return rows[0] || null;
    },
    async create(p) {
      const { rows } = await pool.query(
        `INSERT INTO productos (sku, nombre, categoria, stock, stock_minimo, precio)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING ${COLS}`,
        [p.sku, p.nombre, p.categoria, p.stock, p.stockMinimo, p.precio],
      );
      return rows[0];
    },
    async update(id, p) {
      const { rows } = await pool.query(
        `UPDATE productos SET sku=$1, nombre=$2, categoria=$3, stock=$4, stock_minimo=$5,
         precio=$6, actualizado=NOW() WHERE id=$7 RETURNING ${COLS}`,
        [p.sku, p.nombre, p.categoria, p.stock, p.stockMinimo, p.precio, id],
      );
      return rows[0] || null;
    },
    async adjustStock(id, delta) {
      const { rows } = await pool.query(
        `UPDATE productos SET stock = stock + $1, actualizado=NOW()
         WHERE id=$2 AND stock + $1 >= 0 RETURNING ${COLS}`,
        [delta, id],
      );
      return rows[0] || null;
    },
    async remove(id) {
      const { rowCount } = await pool.query('DELETE FROM productos WHERE id = $1', [id]);
      return rowCount > 0;
    },
    async close() {
      await pool.end();
    },
  };
}

function createMemoryRepository() {
  let seq = 0;
  const items = new Map();

  return {
    async init() {},
    async ping() {},
    async list() {
      return [...items.values()];
    },
    async get(id) {
      return items.get(id) || null;
    },
    async create(p) {
      if ([...items.values()].some((i) => i.sku === p.sku)) {
        const err = new Error('SKU duplicado');
        err.code = '23505';
        throw err;
      }
      seq += 1;
      const item = { id: seq, ...p, actualizado: new Date().toISOString() };
      items.set(seq, item);
      return item;
    },
    async update(id, p) {
      if (!items.has(id)) return null;
      const item = { id, ...p, actualizado: new Date().toISOString() };
      items.set(id, item);
      return item;
    },
    async adjustStock(id, delta) {
      const item = items.get(id);
      if (!item || item.stock + delta < 0) return null;
      item.stock += delta;
      return item;
    },
    async remove(id) {
      return items.delete(id);
    },
    async close() {},
  };
}

module.exports = { createPgRepository, createMemoryRepository };

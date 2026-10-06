// Validación de entrada de productos.
function validarProducto(body) {
  const errores = [];
  const b = body || {};

  if (typeof b.sku !== 'string' || !/^[A-Z0-9-]{3,40}$/.test(b.sku)) {
    errores.push('sku: requerido, 3-40 caracteres en mayúsculas, números o guiones');
  }
  if (typeof b.nombre !== 'string' || b.nombre.trim().length < 2 || b.nombre.length > 120) {
    errores.push('nombre: requerido, entre 2 y 120 caracteres');
  }
  const enteros = { stock: b.stock ?? 0, stockMinimo: b.stockMinimo ?? 0 };
  for (const [campo, valor] of Object.entries(enteros)) {
    if (!Number.isInteger(valor) || valor < 0) errores.push(`${campo}: entero mayor o igual a 0`);
  }
  const precio = b.precio ?? 0;
  if (typeof precio !== 'number' || Number.isNaN(precio) || precio < 0) {
    errores.push('precio: número mayor o igual a 0');
  }

  if (errores.length) return { errores };
  return {
    valor: {
      sku: b.sku,
      nombre: b.nombre.trim(),
      categoria: typeof b.categoria === 'string' && b.categoria.trim() ? b.categoria.trim() : 'General',
      stock: enteros.stock,
      stockMinimo: enteros.stockMinimo,
      precio,
    },
  };
}

function parseId(raw) {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = { validarProducto, parseId };

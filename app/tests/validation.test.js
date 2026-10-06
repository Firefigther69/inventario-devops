const { validarProducto, parseId } = require('../src/validation');

describe('validarProducto', () => {
  test('aplica valores por defecto', () => {
    const { valor } = validarProducto({ sku: 'ABC-1', nombre: '  Producto  ' });
    expect(valor).toEqual({ sku: 'ABC-1', nombre: 'Producto', categoria: 'General', stock: 0, stockMinimo: 0, precio: 0 });
  });

  test('cuerpo vacío produce errores', () => {
    expect(validarProducto(undefined).errores.length).toBe(2);
  });

  test('rechaza stock decimal', () => {
    expect(validarProducto({ sku: 'ABC', nombre: 'Xy', stock: 1.5 }).errores).toHaveLength(1);
  });
});

describe('parseId', () => {
  test.each([['5', 5], ['0', null], ['-1', null], ['x', null], ['2.5', null]])('%s -> %s', (raw, esperado) => {
    expect(parseId(raw)).toBe(esperado);
  });
});

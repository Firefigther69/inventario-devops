(function () {
  'use strict';
  var filas = document.getElementById('filas');
  var msg = document.getElementById('msg');
  var form = document.getElementById('form');
  var clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' });

  function celda(tr, texto) {
    var td = document.createElement('td');
    td.textContent = texto;
    tr.appendChild(td);
    return td;
  }

  function boton(td, texto, fn) {
    var b = document.createElement('button');
    b.className = 'sec';
    b.type = 'button';
    b.textContent = texto;
    b.addEventListener('click', fn);
    td.appendChild(b);
    td.appendChild(document.createTextNode(' '));
  }

  function mover(id, cantidad) {
    fetch('/api/productos/' + id + '/movimientos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cantidad: cantidad }),
    }).then(function (r) { return r.json(); }).then(function (d) {
      msg.textContent = d.error || '';
      cargar();
    });
  }

  function eliminar(id) {
    fetch('/api/productos/' + id, { method: 'DELETE' }).then(cargar);
  }

  function cargar() {
    fetch('/api/productos').then(function (r) { return r.json(); }).then(function (items) {
      filas.textContent = '';
      items.forEach(function (p) {
        var tr = document.createElement('tr');
        if (p.stock <= p.stockMinimo) tr.className = 'bajo';
        celda(tr, p.sku);
        celda(tr, p.nombre);
        celda(tr, p.categoria);
        celda(tr, String(p.stock));
        celda(tr, clp.format(p.precio));
        var acc = celda(tr, '');
        boton(acc, '+1', function () { mover(p.id, 1); });
        boton(acc, '−1', function () { mover(p.id, -1); });
        boton(acc, 'Eliminar', function () { eliminar(p.id); });
        filas.appendChild(tr);
      });
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var body = {
      sku: String(f.get('sku')).toUpperCase(),
      nombre: f.get('nombre'),
      categoria: f.get('categoria'),
      stock: parseInt(f.get('stock'), 10) || 0,
      stockMinimo: parseInt(f.get('stockMinimo'), 10) || 0,
      precio: Number(f.get('precio')) || 0,
    };
    fetch('/api/productos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        msg.textContent = d.errores ? d.errores.join(' · ') : (d.error || 'Producto agregado');
        if (d.id) { form.reset(); cargar(); }
      });
  });

  fetch('/api/version').then(function (r) { return r.json(); }).then(function (v) {
    document.getElementById('version').textContent = 'versión ' + v.version + ' · ' + v.environment;
  });
  cargar();
})();

import { listarPresupuestos, obtenerPresupuesto } from '../../api/presupuestos.js';
import { listarClientes, obtenerCliente } from '../../api/clientes.js';
import { obtenerPerfil } from '../../api/perfil.js';
import { formatMoney } from '../../shared/formatMoney.js';
import { escapeHtml } from '../../shared/escapeHtml.js';
import { descargarPdf } from '../../pdf/generarPdf.js';
import { estadoVisual } from '../../shared/estadoPresupuesto.js';

export async function renderHistorial(contenedor) {
  contenedor.innerHTML = '<p>Cargando historial…</p>';

  const [presupuestos, clientes] = await Promise.all([
    listarPresupuestos().catch(() => []),
    listarClientes().catch(() => []),
  ]);

  const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

  contenedor.innerHTML = '';
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';
  tarjeta.innerHTML = '<h2>Historial de presupuestos</h2>';

  const zonaNuevo = document.createElement('div');
  zonaNuevo.className = 'campo';
  const botonNuevo = document.createElement('button');
  botonNuevo.textContent = 'Nuevo presupuesto';
  botonNuevo.addEventListener('click', () => {
    window.location.hash = '#/presupuesto';
  });
  zonaNuevo.appendChild(botonNuevo);
  tarjeta.appendChild(zonaNuevo);

  if (presupuestos.length === 0) {
    const vacio = document.createElement('p');
    vacio.textContent = 'Todavía no has creado ningún presupuesto.';
    tarjeta.appendChild(vacio);
    contenedor.appendChild(tarjeta);
    return;
  }

  const tabla = document.createElement('table');
  tabla.innerHTML = `
    <thead>
      <tr><th>Número</th><th>Cliente</th><th>Estado</th><th>Total</th><th></th></tr>
    </thead>
  `;
  const tbody = document.createElement('tbody');

  presupuestos.forEach((presupuesto) => {
    const cliente = clientesPorId.get(presupuesto.clienteId);
    const visual = estadoVisual(presupuesto.estado);
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${presupuesto.numero || '(borrador)'}</td>
      <td>${cliente ? escapeHtml(cliente.nombre) : ''}</td>
      <td><span class="estado ${visual.clase}">${visual.etiqueta}</span></td>
      <td>${formatMoney(presupuesto.total)}</td>
    `;

    const celdaAcciones = document.createElement('td');
    if (presupuesto.estado === 'borrador') {
      const boton = document.createElement('button');
      boton.className = 'secundario';
      boton.textContent = 'Continuar editando';
      boton.addEventListener('click', () => {
        window.location.hash = '#/presupuesto';
      });
      celdaAcciones.appendChild(boton);
    } else {
      const boton = document.createElement('button');
      boton.className = 'secundario';
      boton.textContent = 'Descargar PDF';
      boton.addEventListener('click', async () => {
        boton.disabled = true;
        try {
          const [completo, clienteCompleto, perfil] = await Promise.all([
            obtenerPresupuesto(presupuesto.id),
            cliente ? Promise.resolve(cliente) : obtenerCliente(presupuesto.clienteId),
            obtenerPerfil().catch(() => null),
          ]);
          descargarPdf({ presupuesto: completo, cliente: clienteCompleto, perfil });
        } finally {
          boton.disabled = false;
        }
      });
      celdaAcciones.appendChild(boton);
    }

    fila.appendChild(celdaAcciones);
    tbody.appendChild(fila);
  });

  tabla.appendChild(tbody);
  tarjeta.appendChild(tabla);
  contenedor.appendChild(tarjeta);
}


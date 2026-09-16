import { listarPresupuestos } from '../../api/presupuestos.js';
import { listarClientes } from '../../api/clientes.js';
import { listarServicios } from '../../api/servicios.js';
import { estadoVisual } from '../../shared/estadoPresupuesto.js';

const SECCIONES = [
  { ruta: '#/historial', etiqueta: 'Presupuestos' },
  { ruta: '#/clientes', etiqueta: 'Clientes' },
  { ruta: '#/catalogo', etiqueta: 'Catálogo' },
  { ruta: '#/configuracion', etiqueta: 'Perfil' },
];

export async function renderInicio(contenedor) {
  contenedor.innerHTML = '<p>Cargando resumen de actividad…</p>';

  const [presupuestos, clientes, servicios] = await Promise.all([
    listarPresupuestos().catch(() => null),
    listarClientes().catch(() => null),
    listarServicios().catch(() => null),
  ]);

  contenedor.innerHTML = '';

  const resumen = document.createElement('div');
  resumen.className = 'tarjeta';
  resumen.innerHTML = '<h2>Resumen de actividad</h2>';
  resumen.appendChild(resumenPresupuestos(presupuestos));
  resumen.appendChild(resumenContador('clientes', clientes));
  resumen.appendChild(resumenContador('servicios en catálogo', servicios));
  contenedor.appendChild(resumen);

  contenedor.appendChild(accesosSecciones());
}

function resumenPresupuestos(presupuestos) {
  const bloque = document.createElement('div');
  bloque.className = 'campo';

  if (presupuestos === null) {
    bloque.innerHTML = '<div class="aviso-error">No se ha podido cargar el resumen de presupuestos.</div>';
    return bloque;
  }

  if (presupuestos.length === 0) {
    const vacio = document.createElement('p');
    vacio.textContent = 'Todavía no has creado ningún presupuesto.';
    bloque.appendChild(vacio);
    return bloque;
  }

  const conteos = new Map();
  presupuestos.forEach((presupuesto) => {
    const visual = estadoVisual(presupuesto.estado);
    const actual = conteos.get(visual.clave) || { etiqueta: visual.etiqueta, clase: visual.clase, total: 0 };
    actual.total += 1;
    conteos.set(visual.clave, actual);
  });

  const lista = document.createElement('div');
  lista.className = 'acciones';
  conteos.forEach(({ etiqueta, clase, total }) => {
    const insignia = document.createElement('span');
    insignia.className = `estado ${clase}`;
    insignia.textContent = `${etiqueta}: ${total}`;
    lista.appendChild(insignia);
  });
  bloque.appendChild(lista);
  return bloque;
}

function resumenContador(etiqueta, lista) {
  const parrafo = document.createElement('p');
  if (lista === null) {
    parrafo.className = 'aviso-error';
    parrafo.textContent = `No se ha podido cargar el número de ${etiqueta}.`;
  } else {
    parrafo.textContent = `${lista.length} ${etiqueta}`;
  }
  return parrafo;
}

function accesosSecciones() {
  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';
  tarjeta.innerHTML = '<h2>Ir a</h2>';

  const lista = document.createElement('div');
  lista.className = 'accesos-inicio';
  SECCIONES.forEach(({ ruta, etiqueta }) => {
    const enlace = document.createElement('a');
    enlace.href = ruta;
    enlace.className = 'acceso-inicio';
    enlace.textContent = etiqueta;
    lista.appendChild(enlace);
  });
  tarjeta.appendChild(lista);
  return tarjeta;
}

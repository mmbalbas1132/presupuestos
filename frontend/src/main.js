import { renderPresupuesto } from './ui/presupuesto/index.js';
import { renderHistorial } from './ui/historial/index.js';
import { renderCatalogo } from './ui/catalogo/index.js';
import { renderConfiguracion } from './ui/configuracion/index.js';
import { renderInicio } from './ui/inicio/index.js';
import { renderClientes } from './ui/clientes/index.js';

const rutas = new Map();
let rutaPorDefecto = '/inicio';

export function registrarRuta(ruta, render) {
  rutas.set(ruta, render);
}

export function establecerRutaPorDefecto(ruta) {
  rutaPorDefecto = ruta;
}

function rutaActual() {
  const hash = window.location.hash.replace(/^#/, '');
  return hash || rutaPorDefecto;
}

function actualizarNavActiva(ruta) {
  // '/presupuesto' no tiene entrada propia en la nav: forma parte de "Presupuestos"
  // (contracts/navegacion-contract.md).
  const rutaResaltada = ruta === '/presupuesto' ? '/historial' : ruta;
  document.querySelectorAll('.nav a').forEach((enlace) => {
    const destino = enlace.getAttribute('href').replace(/^#/, '');
    enlace.classList.toggle('activo', destino === rutaResaltada);
  });
}

async function renderizar() {
  const app = document.getElementById('app');
  const ruta = rutaActual();
  const render = rutas.get(ruta);

  const nav = document.getElementById('app-nav');
  if (nav) {
    actualizarNavActiva(ruta);
  }

  const contenedor = document.getElementById('app-contenido') || app;
  contenedor.innerHTML = '';

  if (!render) {
    contenedor.innerHTML = '<p>Página no encontrada.</p>';
    return;
  }

  await render(contenedor);
}

function crearNavegacion() {
  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.id = 'app-nav';
  nav.innerHTML = `
    <a href="#/inicio">Inicio</a>
    <a href="#/historial">Presupuestos</a>
    <a href="#/clientes">Clientes</a>
    <a href="#/catalogo">Catálogo</a>
    <a href="#/configuracion">Perfil</a>
  `;
  return nav;
}

export function iniciarApp() {
  const app = document.getElementById('app');
  app.appendChild(crearNavegacion());

  const contenido = document.createElement('div');
  contenido.id = 'app-contenido';
  app.appendChild(contenido);

  window.addEventListener('hashchange', renderizar);
  renderizar();
}

registrarRuta('/presupuesto', renderPresupuesto);
registrarRuta('/historial', renderHistorial);
registrarRuta('/catalogo', renderCatalogo);
registrarRuta('/configuracion', renderConfiguracion);
registrarRuta('/inicio', renderInicio);
registrarRuta('/clientes', renderClientes);

iniciarApp();

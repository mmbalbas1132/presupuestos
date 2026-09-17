import { obtenerPerfil, guardarPerfil } from '../../api/perfil.js';

function leerImagenComoDataUrl(fichero) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error('No se pudo leer el logo.'));
    lector.readAsDataURL(fichero);
  });
}

export async function renderConfiguracion(contenedor) {
  contenedor.innerHTML = '<p>Cargando configuración…</p>';
  const perfil = await obtenerPerfil().catch(() => null);
  let logoDataUrl = perfil?.logo || null;
  let mensaje = '';
  let mensajeEsError = false;

  contenedor.innerHTML = '';

  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';
  tarjeta.innerHTML = '<h2>Configuración de tu marca</h2>';

  if (mensaje) {
    const aviso = document.createElement('div');
    aviso.className = mensajeEsError ? 'aviso-error' : '';
    aviso.textContent = mensaje;
    tarjeta.appendChild(aviso);
  }

  const campoNombre = crearCampo('Nombre', 'perfil-nombre', perfil?.nombre);
  const campoNif = crearCampo('NIF', 'perfil-nif', perfil?.nif);
  const campoContacto = crearCampo('Contacto (email y/o teléfono)', 'perfil-contacto', perfil?.contacto);

  const campoLogo = document.createElement('div');
  campoLogo.className = 'campo';
  campoLogo.innerHTML = '<label>Logo (opcional)</label>';
  const inputLogo = document.createElement('input');
  inputLogo.type = 'file';
  inputLogo.accept = 'image/*';

  const previsualizacion = document.createElement('div');
  previsualizacion.className = 'vista-previa';
  function actualizarPrevisualizacion() {
    previsualizacion.innerHTML = logoDataUrl
      ? `<img src="${logoDataUrl}" alt="Logo" class="logo-vista-previa">`
      : '';
  }
  actualizarPrevisualizacion();

  inputLogo.addEventListener('change', async () => {
    const fichero = inputLogo.files[0];
    if (!fichero) return;
    logoDataUrl = await leerImagenComoDataUrl(fichero);
    actualizarPrevisualizacion();
  });

  campoLogo.append(inputLogo, previsualizacion);

  const zonaMensaje = document.createElement('div');

  const boton = document.createElement('button');
  boton.textContent = 'Guardar';
  boton.addEventListener('click', async () => {
    const nombre = contenedor.querySelector('#perfil-nombre').value.trim();
    const nif = contenedor.querySelector('#perfil-nif').value.trim();
    const contacto = contenedor.querySelector('#perfil-contacto').value.trim();

    if (!nombre || !nif || !contacto) {
      zonaMensaje.className = 'aviso-error';
      zonaMensaje.textContent = 'Nombre, NIF y contacto son obligatorios.';
      return;
    }

    try {
      await guardarPerfil({ nombre, nif, contacto, logo: logoDataUrl });
      zonaMensaje.className = '';
      zonaMensaje.textContent = 'Guardado correctamente.';
    } catch (err) {
      zonaMensaje.className = 'aviso-error';
      zonaMensaje.textContent = err.message;
    }
  });

  tarjeta.append(campoNombre, campoNif, campoContacto, campoLogo, boton, zonaMensaje);
  contenedor.appendChild(tarjeta);
}

function crearCampo(etiqueta, id, valorInicial) {
  const campo = document.createElement('div');
  campo.className = 'campo';
  const label = document.createElement('label');
  label.textContent = etiqueta;
  label.setAttribute('for', id);
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.value = valorInicial || '';
  campo.append(label, input);
  return campo;
}

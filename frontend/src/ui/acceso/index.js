import { iniciarSesion } from '../../api/auth.js';

function rutaTrasAcceso() {
  try {
    const guardada = sessionStorage.getItem('rutaTrasAcceso');
    sessionStorage.removeItem('rutaTrasAcceso');
    return guardada || '/inicio';
  } catch {
    return '/inicio';
  }
}

function avisoPendiente() {
  try {
    return sessionStorage.getItem('avisoAcceso');
  } catch {
    return null;
  }
}

function limpiarAvisoPendiente() {
  try {
    sessionStorage.removeItem('avisoAcceso');
  } catch {
    // Almacenamiento no disponible; no hay nada que limpiar.
  }
}

export async function renderAcceso(contenedor) {
  contenedor.innerHTML = '';

  const tarjeta = document.createElement('div');
  tarjeta.className = 'tarjeta';
  tarjeta.innerHTML = '<h2>Acceso</h2><p>Introduce la clave de acceso de tu aplicación.</p>';

  const campo = document.createElement('div');
  campo.className = 'campo';
  campo.innerHTML = '<label for="clave-acceso">Clave de acceso</label>';
  const input = document.createElement('input');
  input.type = 'password';
  input.id = 'clave-acceso';
  input.autocomplete = 'current-password';
  campo.appendChild(input);

  const mensaje = document.createElement('div');

  const aviso = avisoPendiente();
  if (aviso) {
    mensaje.className = 'aviso-error';
    mensaje.textContent = aviso;
  }

  const boton = document.createElement('button');
  boton.textContent = 'Entrar';

  async function intentarAcceso() {
    const clave = input.value.trim();
    if (!clave) return;

    boton.disabled = true;
    mensaje.className = '';
    mensaje.textContent = '';
    limpiarAvisoPendiente();

    try {
      await iniciarSesion(clave);
      window.location.hash = `#${rutaTrasAcceso()}`;
      window.location.reload();
    } catch {
      mensaje.className = 'aviso-error';
      mensaje.textContent = 'Clave incorrecta. Inténtalo de nuevo.';
      boton.disabled = false;
    }
  }

  boton.addEventListener('click', intentarAcceso);
  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter') intentarAcceso();
  });

  tarjeta.append(campo, boton, mensaje);
  contenedor.appendChild(tarjeta);
  input.focus();
}

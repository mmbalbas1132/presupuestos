import { listarClientes, crearCliente } from '../../api/clientes.js';
import { validarCliente } from '../../domain/validaciones.js';
import { escapeHtml } from '../../shared/escapeHtml.js';

const ETIQUETAS_TIPO = {
  particular: 'Particular',
  empresa: 'Empresa',
  autonomo: 'Autónomo',
};

export async function renderClientes(contenedor) {
  contenedor.innerHTML = '<p>Cargando clientes…</p>';
  let clientes = await listarClientes().catch(() => []);
  let mensajeError = '';

  function dibujar() {
    contenedor.innerHTML = '';

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = '<h2>Clientes</h2>';

    if (mensajeError) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso-error';
      aviso.textContent = mensajeError;
      tarjeta.appendChild(aviso);
    }

    if (clientes.length > 0) {
      const tabla = document.createElement('table');
      tabla.innerHTML = '<thead><tr><th>Nombre</th><th>NIF</th><th>Tipo</th></tr></thead>';
      const tbody = document.createElement('tbody');

      clientes.forEach((cliente) => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
          <td>${escapeHtml(cliente.nombre)}</td>
          <td>${escapeHtml(cliente.nif)}</td>
          <td>${escapeHtml(ETIQUETAS_TIPO[cliente.tipo] || cliente.tipo)}</td>
        `;
        tbody.appendChild(fila);
      });

      tabla.appendChild(tbody);
      tarjeta.appendChild(tabla);
    } else {
      const vacio = document.createElement('p');
      vacio.textContent = 'Todavía no has añadido ningún cliente.';
      tarjeta.appendChild(vacio);
    }

    tarjeta.appendChild(formularioAlta());
    contenedor.appendChild(tarjeta);
  }

  function formularioAlta() {
    const contenedorForm = document.createElement('div');
    contenedorForm.className = 'subseccion';
    contenedorForm.innerHTML = '<h3>Añadir cliente</h3>';

    const campoNombre = crearCampoTexto('Nombre', 'nombre-cliente-nuevo');
    const campoNif = crearCampoTexto('NIF', 'nif-cliente-nuevo');

    const campoTipo = document.createElement('div');
    campoTipo.className = 'campo';
    campoTipo.innerHTML = '<label>Tipo de cliente</label>';
    const selectTipo = document.createElement('select');
    Object.entries(ETIQUETAS_TIPO).forEach(([valor, etiqueta]) => {
      const opcion = document.createElement('option');
      opcion.value = valor;
      opcion.textContent = etiqueta;
      selectTipo.appendChild(opcion);
    });
    campoTipo.appendChild(selectTipo);

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = 'Añadir cliente';
    boton.addEventListener('click', async () => {
      const nombre = contenedorForm.querySelector('#nombre-cliente-nuevo').value.trim();
      const nif = contenedorForm.querySelector('#nif-cliente-nuevo').value.trim();
      const tipo = selectTipo.value;

      const validacion = validarCliente(nombre, nif, tipo);
      if (!validacion.valido) {
        mensajeError = validacion.error;
        dibujar();
        return;
      }

      try {
        await crearCliente({ nombre, nif, tipo });
        clientes = await listarClientes();
        mensajeError = '';
        dibujar();
      } catch (err) {
        mensajeError = err.message;
        dibujar();
      }
    });

    contenedorForm.append(campoNombre, campoNif, campoTipo, boton);
    return contenedorForm;
  }

  dibujar();
}

function crearCampoTexto(etiqueta, id) {
  const campo = document.createElement('div');
  campo.className = 'campo';
  const label = document.createElement('label');
  label.textContent = etiqueta;
  label.setAttribute('for', id);
  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  campo.append(label, input);
  return campo;
}


import { listarServicios, crearServicio, actualizarServicio, eliminarServicio } from '../../api/servicios.js';
import { formatMoney } from '../../shared/formatMoney.js';

export async function renderCatalogo(contenedor) {
  contenedor.innerHTML = '<p>Cargando catálogo…</p>';
  let servicios = await listarServicios().catch(() => []);
  let mensajeError = '';
  let edicionId = null;

  function dibujar() {
    contenedor.innerHTML = '';

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = '<h2>Catálogo de servicios</h2>';

    if (mensajeError) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso-error';
      aviso.textContent = mensajeError;
      tarjeta.appendChild(aviso);
    }

    if (servicios.length > 0) {
      const tabla = document.createElement('table');
      tabla.innerHTML = '<thead><tr><th>Nombre</th><th>Precio habitual</th><th></th></tr></thead>';
      const tbody = document.createElement('tbody');

      servicios.forEach((servicio) => {
        const fila = document.createElement('tr');

        if (edicionId === servicio.id) {
          const celdaNombre = document.createElement('td');
          const inputNombre = document.createElement('input');
          inputNombre.type = 'text';
          inputNombre.value = servicio.nombre;
          celdaNombre.appendChild(inputNombre);

          const celdaPrecio = document.createElement('td');
          const inputPrecio = document.createElement('input');
          inputPrecio.type = 'number';
          inputPrecio.step = 'any';
          inputPrecio.value = servicio.precioHabitual;
          celdaPrecio.appendChild(inputPrecio);

          const celdaAcciones = document.createElement('td');
          celdaAcciones.className = 'acciones';
          const botonGuardar = document.createElement('button');
          botonGuardar.textContent = 'Guardar';
          botonGuardar.addEventListener('click', async () => {
            const nombre = inputNombre.value.trim();
            const precioHabitual = Number(inputPrecio.value);
            if (!nombre || precioHabitual < 0) {
              mensajeError = 'El nombre no puede estar vacío y el precio no puede ser negativo.';
              dibujar();
              return;
            }
            try {
              await actualizarServicio(servicio.id, { nombre, precioHabitual });
              servicios = await listarServicios();
              edicionId = null;
              mensajeError = '';
              dibujar();
            } catch (err) {
              mensajeError = err.message;
              dibujar();
            }
          });
          const botonCancelar = document.createElement('button');
          botonCancelar.className = 'secundario';
          botonCancelar.textContent = 'Cancelar';
          botonCancelar.addEventListener('click', () => {
            edicionId = null;
            dibujar();
          });
          celdaAcciones.append(botonGuardar, botonCancelar);

          fila.append(celdaNombre, celdaPrecio, celdaAcciones);
        } else {
          fila.innerHTML = `<td>${escapeHtml(servicio.nombre)}</td><td>${formatMoney(servicio.precioHabitual)}</td>`;
          const celdaAcciones = document.createElement('td');
          celdaAcciones.className = 'acciones';

          const botonEditar = document.createElement('button');
          botonEditar.className = 'secundario';
          botonEditar.textContent = 'Editar';
          botonEditar.addEventListener('click', () => {
            edicionId = servicio.id;
            dibujar();
          });

          const botonEliminar = document.createElement('button');
          botonEliminar.className = 'peligro';
          botonEliminar.textContent = 'Eliminar';
          botonEliminar.addEventListener('click', async () => {
            try {
              await eliminarServicio(servicio.id);
              servicios = await listarServicios();
              mensajeError = '';
              dibujar();
            } catch (err) {
              mensajeError = err.message;
              dibujar();
            }
          });

          celdaAcciones.append(botonEditar, botonEliminar);
          fila.appendChild(celdaAcciones);
        }

        tbody.appendChild(fila);
      });

      tabla.appendChild(tbody);
      tarjeta.appendChild(tabla);
    } else {
      const vacio = document.createElement('p');
      vacio.textContent = 'Todavía no has añadido ningún servicio.';
      tarjeta.appendChild(vacio);
    }

    tarjeta.appendChild(formularioAlta());
    contenedor.appendChild(tarjeta);
  }

  function formularioAlta() {
    const contenedorForm = document.createElement('div');
    contenedorForm.className = 'subseccion';
    contenedorForm.innerHTML = '<h3>Añadir servicio</h3>';

    const fila = document.createElement('div');
    fila.className = 'fila-linea';

    const inputNombre = document.createElement('input');
    inputNombre.type = 'text';
    inputNombre.placeholder = 'Nombre del servicio';

    const inputPrecio = document.createElement('input');
    inputPrecio.type = 'number';
    inputPrecio.step = 'any';
    inputPrecio.placeholder = 'Precio habitual (€)';

    const boton = document.createElement('button');
    boton.textContent = 'Añadir';
    boton.addEventListener('click', async () => {
      const nombre = inputNombre.value.trim();
      const precioHabitual = Number(inputPrecio.value);

      if (!nombre || precioHabitual < 0 || Number.isNaN(precioHabitual)) {
        mensajeError = 'El nombre no puede estar vacío y el precio no puede ser negativo.';
        dibujar();
        return;
      }

      try {
        await crearServicio({ nombre, precioHabitual });
        servicios = await listarServicios();
        mensajeError = '';
        dibujar();
      } catch (err) {
        mensajeError = err.message;
        dibujar();
      }
    });

    fila.append(inputNombre, inputPrecio, boton);
    contenedorForm.appendChild(fila);
    return contenedorForm;
  }

  dibujar();
}

function escapeHtml(texto) {
  const div = document.createElement('div');
  div.textContent = texto ?? '';
  return div.innerHTML;
}

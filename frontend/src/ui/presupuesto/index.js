import { listarClientes, crearCliente } from '../../api/clientes.js';
import {
  obtenerBorradorActivo,
  obtenerPresupuesto,
  guardarBorrador,
  emitirPresupuesto,
} from '../../api/presupuestos.js';
import { listarServicios } from '../../api/servicios.js';
import { obtenerPerfil } from '../../api/perfil.js';
import { calcularBaseImponible, calcularIVA, calcularRetencion, calcularTotal } from '../../domain/calculo.js';
import { validarLinea, validarCliente } from '../../domain/validaciones.js';
import { formatMoney } from '../../shared/formatMoney.js';
import { escapeHtml } from '../../shared/escapeHtml.js';
import { descargarPdf } from '../../pdf/generarPdf.js';

let contadorLineaLocal = 0;

function estadoVacio() {
  return {
    id: null,
    cliente: null,
    autonomoNuevo: false,
    lineas: [],
    estado: 'borrador',
    numero: null,
    fechaEmision: null,
    validezDias: 30,
  };
}

function debounce(fn, ms) {
  let temporizador;
  return (...args) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => fn(...args), ms);
  };
}

export async function renderPresupuesto(contenedor) {
  const estado = estadoVacio();
  let clientesDisponibles = [];
  let serviciosDisponibles = [];
  let perfil = null;
  let mostrarAltaCliente = false;
  let mensajeError = '';

  const [borradorActivo, clientes, servicios, perfilGuardado] = await Promise.all([
    obtenerBorradorActivo().catch(() => null),
    listarClientes().catch(() => []),
    listarServicios().catch(() => []),
    obtenerPerfil().catch(() => null),
  ]);

  clientesDisponibles = clientes;
  serviciosDisponibles = servicios;
  perfil = perfilGuardado;

  if (borradorActivo) {
    estado.id = borradorActivo.id;
    estado.autonomoNuevo = borradorActivo.autonomoNuevo;
    estado.lineas = borradorActivo.lineas.map((l) => ({ ...l, claveLocal: `srv-${contadorLineaLocal++}` }));
    estado.estado = borradorActivo.estado;
    estado.numero = borradorActivo.numero;
    estado.fechaEmision = borradorActivo.fechaEmision;
    estado.validezDias = borradorActivo.validezDias;
    estado.cliente = clientesDisponibles.find((c) => c.id === borradorActivo.clienteId) || null;
  }

  const guardarBorradorDebounced = debounce(async () => {
    if (!estado.cliente || estado.estado === 'emitido') return;
    const totales = calcularTotales();
    try {
      const guardado = await guardarBorrador(estado.id, {
        clienteId: estado.cliente.id,
        autonomoNuevo: estado.autonomoNuevo,
        lineas: estado.lineas.map(({ origen, servicioId, descripcion, cantidad, precioUnitario }) => ({
          origen,
          servicioId,
          descripcion,
          cantidad,
          precioUnitario,
        })),
        ...totales,
      });
      estado.id = guardado.id;
    } catch (err) {
      mensajeError = err.message;
      dibujar();
    }
  }, 400);

  function calcularTotales() {
    const baseImponible = calcularBaseImponible(estado.lineas);
    const iva = calcularIVA(baseImponible);
    const tipoCliente = estado.cliente ? estado.cliente.tipo : 'particular';
    const retencion = calcularRetencion(tipoCliente, estado.autonomoNuevo, baseImponible);
    const total = calcularTotal(baseImponible, iva, retencion.importe);
    return {
      baseImponible,
      iva,
      retencionPorcentaje: retencion.porcentaje,
      retencionImporte: retencion.importe,
      total,
    };
  }

  function moverLinea(indice, direccion) {
    const destino = indice + direccion;
    if (destino < 0 || destino >= estado.lineas.length) return;
    const [linea] = estado.lineas.splice(indice, 1);
    estado.lineas.splice(destino, 0, linea);
    guardarBorradorDebounced();
    dibujar();
  }

  function eliminarLinea(indice) {
    estado.lineas.splice(indice, 1);
    guardarBorradorDebounced();
    dibujar();
  }

  function dibujar() {
    contenedor.innerHTML = '';

    if (perfil) {
      const cabecera = document.createElement('div');
      cabecera.className = 'tarjeta';
      cabecera.innerHTML = `
        <div class="grupo-cabecera">
          ${perfil.logo ? `<img src="${perfil.logo}" alt="Logo" class="logo-cabecera">` : ''}
          <div>
            <strong>${escapeHtml(perfil.nombre)}</strong><br>
            <small>${escapeHtml(perfil.nif)} · ${escapeHtml(perfil.contacto)}</small>
          </div>
        </div>
      `;
      contenedor.appendChild(cabecera);
    }

    if (mensajeError) {
      const aviso = document.createElement('div');
      aviso.className = 'aviso-error';
      aviso.textContent = mensajeError;
      contenedor.appendChild(aviso);
    }

    if (estado.estado === 'emitido') {
      dibujarPresupuestoEmitido();
      return;
    }

    dibujarSeccionCliente();
    dibujarSeccionLineas();
    dibujarTotales();
    dibujarAcciones();
  }

  function dibujarPresupuestoEmitido() {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = `
      <h2>Presupuesto ${escapeHtml(estado.numero)} emitido</h2>
      <p>Este presupuesto ya se ha emitido y no se puede modificar. Para cambiar algo, crea un presupuesto nuevo.</p>
    `;
    const botonPdf = document.createElement('button');
    botonPdf.textContent = 'Descargar PDF de nuevo';
    botonPdf.addEventListener('click', () => {
      descargarPdf({ presupuesto: estado, cliente: estado.cliente, perfil });
    });

    const botonNuevo = document.createElement('button');
    botonNuevo.className = 'secundario';
    botonNuevo.textContent = 'Nuevo presupuesto';
    botonNuevo.addEventListener('click', () => {
      Object.assign(estado, estadoVacio());
      mensajeError = '';
      dibujar();
    });

    const acciones = document.createElement('div');
    acciones.className = 'acciones';
    acciones.append(botonPdf, botonNuevo);
    tarjeta.appendChild(acciones);
    contenedor.appendChild(tarjeta);
  }

  function dibujarSeccionCliente() {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = '<h2>Cliente</h2>';

    const campoSelector = document.createElement('div');
    campoSelector.className = 'campo';
    const select = document.createElement('select');
    const opcionVacia = document.createElement('option');
    opcionVacia.value = '';
    opcionVacia.textContent = '-- Selecciona un cliente --';
    select.appendChild(opcionVacia);

    clientesDisponibles.forEach((cliente) => {
      const opcion = document.createElement('option');
      opcion.value = cliente.id;
      opcion.textContent = `${cliente.nombre} (${cliente.nif})`;
      if (estado.cliente && estado.cliente.id === cliente.id) opcion.selected = true;
      select.appendChild(opcion);
    });

    const opcionNuevo = document.createElement('option');
    opcionNuevo.value = 'nuevo';
    opcionNuevo.textContent = '+ Nuevo cliente';
    if (mostrarAltaCliente) opcionNuevo.selected = true;
    select.appendChild(opcionNuevo);

    select.addEventListener('change', () => {
      mensajeError = '';
      if (select.value === 'nuevo') {
        mostrarAltaCliente = true;
      } else {
        mostrarAltaCliente = false;
        estado.cliente = clientesDisponibles.find((c) => String(c.id) === select.value) || null;
        guardarBorradorDebounced();
      }
      dibujar();
    });

    campoSelector.appendChild(select);
    tarjeta.appendChild(campoSelector);

    if (mostrarAltaCliente) {
      tarjeta.appendChild(formularioAltaCliente());
    }

    if (estado.cliente && estado.cliente.tipo === 'autonomo') {
      const campoAutonomo = document.createElement('div');
      campoAutonomo.className = 'campo';
      const label = document.createElement('label');
      label.className = 'campo-checkbox';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = estado.autonomoNuevo;
      checkbox.addEventListener('change', () => {
        estado.autonomoNuevo = checkbox.checked;
        guardarBorradorDebounced();
        dibujar();
      });
      label.appendChild(checkbox);
      label.append(' Autónomo de menos de 2 años (retención reducida del 7%)');
      campoAutonomo.appendChild(label);
      tarjeta.appendChild(campoAutonomo);
    }

    contenedor.appendChild(tarjeta);
  }

  function formularioAltaCliente() {
    const contenedorAlta = document.createElement('div');
    contenedorAlta.className = 'subseccion';

    const campoNombre = crearCampoTexto('Nombre', 'nombre-cliente');
    const campoNif = crearCampoTexto('NIF', 'nif-cliente');

    const campoTipo = document.createElement('div');
    campoTipo.className = 'campo';
    campoTipo.innerHTML = '<label>Tipo de cliente</label>';
    const selectTipo = document.createElement('select');
    selectTipo.id = 'tipo-cliente';
    ['particular', 'empresa', 'autonomo'].forEach((tipo) => {
      const opcion = document.createElement('option');
      opcion.value = tipo;
      opcion.textContent = tipo === 'particular' ? 'Particular' : tipo === 'empresa' ? 'Empresa' : 'Autónomo';
      selectTipo.appendChild(opcion);
    });
    campoTipo.appendChild(selectTipo);

    const botonAnadir = document.createElement('button');
    botonAnadir.type = 'button';
    botonAnadir.textContent = 'Añadir cliente';
    botonAnadir.addEventListener('click', async () => {
      const nombre = contenedorAlta.querySelector('#nombre-cliente').value.trim();
      const nif = contenedorAlta.querySelector('#nif-cliente').value.trim();
      const tipo = selectTipo.value;

      const validacion = validarCliente(nombre, nif, tipo);
      if (!validacion.valido) {
        mensajeError = validacion.error;
        dibujar();
        return;
      }

      try {
        const cliente = await crearCliente({ nombre, nif, tipo });
        clientesDisponibles.push(cliente);
        estado.cliente = cliente;
        mostrarAltaCliente = false;
        mensajeError = '';
        guardarBorradorDebounced();
        dibujar();
      } catch (err) {
        mensajeError = err.message;
        dibujar();
      }
    });

    contenedorAlta.append(campoNombre, campoNif, campoTipo, botonAnadir);
    return contenedorAlta;
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

  function dibujarSeccionLineas() {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = '<h2>Líneas del presupuesto</h2>';

    if (estado.lineas.length > 0) {
      const tabla = document.createElement('table');
      tabla.innerHTML = `
        <thead>
          <tr><th>Descripción</th><th>Cant.</th><th>Precio</th><th>Importe</th><th></th></tr>
        </thead>
      `;
      const tbody = document.createElement('tbody');
      estado.lineas.forEach((linea, indice) => {
        const fila = document.createElement('tr');
        const importe = linea.cantidad * linea.precioUnitario;
        fila.innerHTML = `
          <td>${escapeHtml(linea.descripcion)}</td>
          <td>${linea.cantidad}</td>
          <td>${formatMoney(linea.precioUnitario)}</td>
          <td>${formatMoney(importe)}</td>
        `;
        const celdaAcciones = document.createElement('td');
        celdaAcciones.className = 'acciones';

        const botonSubir = document.createElement('button');
        botonSubir.className = 'secundario';
        botonSubir.type = 'button';
        botonSubir.textContent = '↑';
        botonSubir.disabled = indice === 0;
        botonSubir.addEventListener('click', () => moverLinea(indice, -1));

        const botonBajar = document.createElement('button');
        botonBajar.className = 'secundario';
        botonBajar.type = 'button';
        botonBajar.textContent = '↓';
        botonBajar.disabled = indice === estado.lineas.length - 1;
        botonBajar.addEventListener('click', () => moverLinea(indice, 1));

        const botonEliminar = document.createElement('button');
        botonEliminar.className = 'peligro';
        botonEliminar.type = 'button';
        botonEliminar.textContent = 'Eliminar';
        botonEliminar.addEventListener('click', () => eliminarLinea(indice));

        celdaAcciones.append(botonSubir, botonBajar, botonEliminar);
        fila.appendChild(celdaAcciones);
        tbody.appendChild(fila);
      });
      tabla.appendChild(tbody);
      tarjeta.appendChild(tabla);
    } else {
      const vacio = document.createElement('p');
      vacio.textContent = 'Todavía no has añadido ninguna línea.';
      tarjeta.appendChild(vacio);
    }

    tarjeta.appendChild(formularioLineaCatalogo());
    tarjeta.appendChild(formularioLineaManual());

    contenedor.appendChild(tarjeta);
  }

  function formularioLineaCatalogo() {
    const contenedorForm = document.createElement('div');
    contenedorForm.className = 'subseccion';
    contenedorForm.innerHTML = '<h3>Añadir desde el catálogo</h3>';

    if (serviciosDisponibles.length === 0) {
      const vacio = document.createElement('p');
      vacio.textContent = 'Tu catálogo está vacío. Puedes añadir servicios desde la pantalla de Catálogo.';
      contenedorForm.appendChild(vacio);
      return contenedorForm;
    }

    const fila = document.createElement('div');
    fila.className = 'fila-linea';

    const selectServicio = document.createElement('select');
    serviciosDisponibles.forEach((servicio) => {
      const opcion = document.createElement('option');
      opcion.value = servicio.id;
      opcion.textContent = `${servicio.nombre} (${formatMoney(servicio.precioHabitual)})`;
      selectServicio.appendChild(opcion);
    });

    const inputCantidad = document.createElement('input');
    inputCantidad.type = 'number';
    inputCantidad.min = '0';
    inputCantidad.step = 'any';
    inputCantidad.value = '1';
    inputCantidad.placeholder = 'Cantidad';

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = 'Añadir';
    boton.addEventListener('click', () => {
      const servicio = serviciosDisponibles.find((s) => String(s.id) === selectServicio.value);
      const cantidad = Number(inputCantidad.value);
      const validacion = validarLinea(cantidad, servicio.precioHabitual);
      if (!validacion.valido) {
        mensajeError = validacion.error;
        dibujar();
        return;
      }
      estado.lineas.push({
        claveLocal: `srv-${contadorLineaLocal++}`,
        origen: 'catalogo',
        servicioId: servicio.id,
        descripcion: servicio.nombre,
        cantidad,
        precioUnitario: servicio.precioHabitual,
      });
      mensajeError = '';
      guardarBorradorDebounced();
      dibujar();
    });

    fila.append(selectServicio, inputCantidad, boton);
    contenedorForm.appendChild(fila);
    return contenedorForm;
  }

  function formularioLineaManual() {
    const contenedorForm = document.createElement('div');
    contenedorForm.className = 'subseccion';
    contenedorForm.innerHTML = '<h3>Añadir línea manual</h3>';

    const fila = document.createElement('div');
    fila.className = 'fila-linea';

    const inputDescripcion = document.createElement('input');
    inputDescripcion.type = 'text';
    inputDescripcion.placeholder = 'Descripción';

    const inputCantidad = document.createElement('input');
    inputCantidad.type = 'number';
    inputCantidad.step = 'any';
    inputCantidad.placeholder = 'Cantidad';
    inputCantidad.value = '1';

    const inputPrecio = document.createElement('input');
    inputPrecio.type = 'number';
    inputPrecio.step = 'any';
    inputPrecio.placeholder = 'Precio unitario (€)';

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = 'Añadir línea';
    boton.addEventListener('click', () => {
      const descripcion = inputDescripcion.value.trim();
      const cantidad = Number(inputCantidad.value);
      const precioUnitario = Number(inputPrecio.value);

      if (!descripcion) {
        mensajeError = 'Escribe una descripción para la línea.';
        dibujar();
        return;
      }

      const validacion = validarLinea(cantidad, precioUnitario);
      if (!validacion.valido) {
        mensajeError = validacion.error;
        dibujar();
        return;
      }

      estado.lineas.push({
        claveLocal: `man-${contadorLineaLocal++}`,
        origen: 'manual',
        servicioId: null,
        descripcion,
        cantidad,
        precioUnitario,
      });
      mensajeError = '';
      guardarBorradorDebounced();
      dibujar();
    });

    fila.append(inputDescripcion, inputCantidad, inputPrecio, boton);
    contenedorForm.appendChild(fila);
    return contenedorForm;
  }

  function dibujarTotales() {
    const totales = calcularTotales();
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta';
    tarjeta.innerHTML = `
      <div class="totales">
        <div class="fila"><span>Base imponible</span><span>${formatMoney(totales.baseImponible)}</span></div>
        <div class="fila"><span>IVA (21%)</span><span>${formatMoney(totales.iva)}</span></div>
        <div class="fila"><span>Retención (${totales.retencionPorcentaje}%)</span><span>-${formatMoney(totales.retencionImporte)}</span></div>
        <div class="fila total"><span>Total</span><span>${formatMoney(totales.total)}</span></div>
      </div>
    `;
    contenedor.appendChild(tarjeta);
  }

  function dibujarAcciones() {
    const contenedorAcciones = document.createElement('div');
    contenedorAcciones.className = 'acciones';

    const botonPdf = document.createElement('button');
    botonPdf.textContent = 'Generar PDF';
    botonPdf.addEventListener('click', async () => {
      if (!estado.cliente) {
        mensajeError = 'Selecciona o da de alta un cliente antes de generar el PDF.';
        dibujar();
        return;
      }
      if (estado.lineas.length === 0) {
        mensajeError = 'Añade al menos una línea antes de generar el PDF.';
        dibujar();
        return;
      }

      botonPdf.disabled = true;
      try {
        const totales = calcularTotales();
        const guardado = await guardarBorrador(estado.id, {
          clienteId: estado.cliente.id,
          autonomoNuevo: estado.autonomoNuevo,
          lineas: estado.lineas.map(({ origen, servicioId, descripcion, cantidad, precioUnitario }) => ({
            origen,
            servicioId,
            descripcion,
            cantidad,
            precioUnitario,
          })),
          ...totales,
        });
        estado.id = guardado.id;

        const emitido = await emitirPresupuesto(estado.id);
        estado.estado = emitido.estado;
        estado.numero = emitido.numero;
        estado.fechaEmision = emitido.fechaEmision;
        estado.validezDias = emitido.validezDias;
        Object.assign(estado, totales);

        descargarPdf({ presupuesto: estado, cliente: estado.cliente, perfil });
        mensajeError = '';
        dibujar();
      } catch (err) {
        mensajeError = err.message;
        botonPdf.disabled = false;
        dibujar();
      }
    });

    contenedorAcciones.appendChild(botonPdf);
    contenedor.appendChild(contenedorAcciones);
  }

  dibujar();
}


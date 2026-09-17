import { jsPDF } from 'jspdf';
import { formatMoney } from '../shared/formatMoney.js';
import { COLOR_PRIMARIO, COLOR_TEXTO, COLOR_TEXTO_SUAVE, COLOR_BORDE, FUENTE_BASE, TAMANOS } from './estilosPdf.js';

function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const [anio, mes, dia] = fechaISO.split('-');
  return `${dia}/${mes}/${anio}`;
}

function fechaValidez(fechaEmisionISO, validezDias) {
  if (!fechaEmisionISO) return '';
  const fecha = new Date(`${fechaEmisionISO}T00:00:00`);
  fecha.setDate(fecha.getDate() + validezDias);
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return formatearFecha(`${anio}-${mes}-${dia}`);
}

export function generarPdf({ presupuesto, cliente, perfil }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  doc.setFont(FUENTE_BASE, 'normal');
  doc.setTextColor(...COLOR_TEXTO);
  const margenIzq = 15;
  let y = 18;

  if (perfil && perfil.logo) {
    try {
      doc.addImage(perfil.logo, 'PNG', margenIzq, y, 30, 20, undefined, 'FAST');
    } catch {
      // Si el logo no se puede decodificar, se genera el PDF sin él.
    }
  }

  doc.setTextColor(...COLOR_PRIMARIO);
  doc.setFont(FUENTE_BASE, 'bold');
  doc.setFontSize(TAMANOS.titulo);
  doc.text('Presupuesto', 200 - margenIzq, y + 6, { align: 'right' });

  doc.setTextColor(...COLOR_TEXTO_SUAVE);
  doc.setFont(FUENTE_BASE, 'normal');
  doc.setFontSize(TAMANOS.textoPequeno);
  doc.text(`Nº ${presupuesto.numero || '(borrador)'}`, 200 - margenIzq, y + 12, { align: 'right' });
  if (presupuesto.fechaEmision) {
    doc.text(`Fecha: ${formatearFecha(presupuesto.fechaEmision)}`, 200 - margenIzq, y + 17, { align: 'right' });
    doc.text(
      `Válido hasta: ${fechaValidez(presupuesto.fechaEmision, presupuesto.validezDias)}`,
      200 - margenIzq,
      y + 22,
      { align: 'right' }
    );
  }

  y += 30;

  doc.setTextColor(...COLOR_TEXTO);
  doc.setFontSize(TAMANOS.subtitulo);
  doc.setFont(FUENTE_BASE, 'bold');
  doc.text(perfil?.nombre || '', margenIzq, y);
  doc.setFont(FUENTE_BASE, 'normal');
  doc.setFontSize(TAMANOS.texto);
  doc.setTextColor(...COLOR_TEXTO_SUAVE);
  y += 5;
  if (perfil?.nif) {
    doc.text(`NIF: ${perfil.nif}`, margenIzq, y);
    y += 4;
  }
  if (perfil?.contacto) {
    doc.text(perfil.contacto, margenIzq, y);
    y += 4;
  }

  y += 6;
  doc.setTextColor(...COLOR_PRIMARIO);
  doc.setFontSize(TAMANOS.subtitulo);
  doc.setFont(FUENTE_BASE, 'bold');
  doc.text('Cliente', margenIzq, y);
  doc.setFont(FUENTE_BASE, 'normal');
  doc.setFontSize(TAMANOS.texto);
  doc.setTextColor(...COLOR_TEXTO);
  y += 5;
  doc.text(cliente?.nombre || '', margenIzq, y);
  y += 4;
  if (cliente?.nif) {
    doc.setTextColor(...COLOR_TEXTO_SUAVE);
    doc.text(`NIF: ${cliente.nif}`, margenIzq, y);
    y += 4;
  }

  y += 8;

  const colDescripcion = margenIzq;
  const colCantidad = 130;
  const colPrecio = 155;
  const colImporte = 180;

  doc.setTextColor(...COLOR_TEXTO);
  doc.setFont(FUENTE_BASE, 'bold');
  doc.setFontSize(TAMANOS.texto);
  doc.text('Descripción', colDescripcion, y);
  doc.text('Cant.', colCantidad, y, { align: 'right' });
  doc.text('Precio', colPrecio, y, { align: 'right' });
  doc.text('Importe', colImporte, y, { align: 'right' });
  doc.setFont(FUENTE_BASE, 'normal');
  y += 2;
  doc.setDrawColor(...COLOR_BORDE);
  doc.line(margenIzq, y, 195, y);
  y += 5;

  for (const linea of presupuesto.lineas || []) {
    const importe = linea.cantidad * linea.precioUnitario;
    const descripcionLineas = doc.splitTextToSize(String(linea.descripcion), 105);
    doc.text(descripcionLineas, colDescripcion, y);
    doc.text(String(linea.cantidad), colCantidad, y, { align: 'right' });
    doc.text(formatMoney(linea.precioUnitario), colPrecio, y, { align: 'right' });
    doc.text(formatMoney(importe), colImporte, y, { align: 'right' });
    // Una descripción larga ocupa varias líneas: la fila crece con ella para
    // que la siguiente fila no se solape (Edge Case de spec.md).
    y += 6 * descripcionLineas.length;
  }

  y += 4;
  doc.setDrawColor(...COLOR_BORDE);
  doc.line(120, y, 195, y);
  y += 6;

  const filaTotal = (etiqueta, valor, negrita = false) => {
    doc.setFont(FUENTE_BASE, negrita ? 'bold' : 'normal');
    doc.setTextColor(...(negrita ? COLOR_PRIMARIO : COLOR_TEXTO_SUAVE));
    doc.text(etiqueta, 155, y, { align: 'right' });
    doc.setTextColor(...(negrita ? COLOR_PRIMARIO : COLOR_TEXTO));
    doc.text(formatMoney(valor), colImporte, y, { align: 'right' });
    y += 6;
  };

  filaTotal('Base imponible', presupuesto.baseImponible);
  filaTotal('IVA (21%)', presupuesto.iva);
  filaTotal(`Retención (${presupuesto.retencionPorcentaje}%)`, -presupuesto.retencionImporte);
  filaTotal('Total', presupuesto.total, true);

  return doc;
}

export function descargarPdf({ presupuesto, cliente, perfil }) {
  const doc = generarPdf({ presupuesto, cliente, perfil });
  const nombreFichero = `presupuesto-${presupuesto.numero || 'borrador'}.pdf`;
  doc.save(nombreFichero);
}

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ─── Mapeo ARCA ────────────────────────────────────────────────────────────────
const TIPO_META: Record<string, { codigo: number; letra: string; nombre: string }> = {
  FA:  { codigo: 1,  letra: 'A', nombre: 'FACTURA' },
  FB:  { codigo: 6,  letra: 'B', nombre: 'FACTURA' },
  FC:  { codigo: 11, letra: 'C', nombre: 'FACTURA' },
  FE:  { codigo: 19, letra: 'E', nombre: 'FACTURA' },
  NCA: { codigo: 3,  letra: 'A', nombre: 'NOTA DE CRÉDITO' },
  NCB: { codigo: 8,  letra: 'B', nombre: 'NOTA DE CRÉDITO' },
  NCC: { codigo: 13, letra: 'C', nombre: 'NOTA DE CRÉDITO' },
  NDA: { codigo: 2,  letra: 'A', nombre: 'NOTA DE DÉBITO' },
  NDB: { codigo: 7,  letra: 'B', nombre: 'NOTA DE DÉBITO' },
}

const COND_IVA: Record<string | number, string> = {
  RI: 'Responsable Inscripto',
  MONO: 'Monotributo',
  CF: 'Consumidor Final',
  EX: 'Exento',
  1: 'Responsable Inscripto',
  4: 'Exento',
  5: 'Consumidor Final',
  6: 'Monotributo',
}

const MONEDA_NOMBRE: Record<string, string> = {
  PES: 'Pesos Argentinos',
  DOL: 'Dólares Estadounidenses',
  EUR: 'Euros',
}

const CONCEPTO_NOMBRE: Record<number, string> = {
  1: 'Productos',
  2: 'Servicios',
  3: 'Productos y Servicios',
}

const CONDPAGO_NOMBRE: Record<string, string> = {
  contado: 'Contado',
  '30': '30 días',
  '60': '60 días',
  '90': '90 días',
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const AR = (n: number) =>
  '$ ' + Math.abs(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const fmtDate = (s: string) => {
  if (!s) return ''
  try {
    const d = new Date(s + (s.includes('T') ? '' : 'T12:00:00'))
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return s }
}

const padLeft = (n: number, len: number) => String(n).padStart(len, '0')

// ─── Tipos ─────────────────────────────────────────────────────────────────────
export interface PdfItem {
  codigo?: string
  descripcion: string
  unidad?: string
  cantidad: number
  precio_unitario: number
  descuento?: number
  alicuota_iva: number
}

export interface PdfAlicuota {
  alicuota: number
  base_imp: number
  importe: number
}

export interface PdfData {
  tipo: string
  punto_venta: string
  numero?: number
  fecha: string
  concepto: number
  fch_serv_desde?: string
  fch_serv_hasta?: string
  cbte_asoc?: { tipo: string; pto_vta: string; nro: string }
  empresa: {
    razon_social: string
    cuit: string
    domicilio: string
    cond_iva: string
    inicio_actividades?: string
    iibb?: string
  }
  cliente: {
    razon_social: string
    cuit: string
    cond_iva: string
    domicilio?: string
  }
  moneda: string
  cotizacion?: number
  condicion_pago?: string
  orden_compra?: string
  items: PdfItem[]
  alicuotas_iva: PdfAlicuota[]
  imp_neto: number
  imp_iva: number
  imp_total: number
  descuento_global?: number
  cae?: string
  cae_vencimiento?: string
  estado: string
  observaciones?: string
}

// ─── Generador principal ───────────────────────────────────────────────────────
export function generarPDF(data: PdfData): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const meta = TIPO_META[data.tipo] ?? { codigo: 0, letra: '?', nombre: data.tipo }
  const W = 210
  const ML = 15
  const MR = 15
  const CW = W - ML - MR  // 180mm

  // ── Colores ──
  const BLUE = [30, 78, 216] as [number, number, number]
  const LIGHT_BLUE = [239, 246, 255] as [number, number, number]
  const GRAY_DARK = [30, 41, 59] as [number, number, number]
  const GRAY_MID = [100, 116, 139] as [number, number, number]
  const GRAY_LIGHT = [226, 232, 240] as [number, number, number]

  const setColor = (rgb: [number, number, number]) => doc.setTextColor(rgb[0], rgb[1], rgb[2])
  const setDrawColor = (rgb: [number, number, number]) => doc.setDrawColor(rgb[0], rgb[1], rgb[2])
  const setFillColor = (rgb: [number, number, number]) => doc.setFillColor(rgb[0], rgb[1], rgb[2])

  let y = 15

  // ══════════════════════════════════════════════
  // HEADER — empresa | caja letra | datos cbte
  // ══════════════════════════════════════════════

  // Caja de la letra (centro)
  const boxX = ML + CW / 2 - 15
  const boxW = 30
  const boxH = 38

  setFillColor(BLUE)
  doc.roundedRect(boxX, y - 2, boxW, boxH, 2, 2, 'F')

  // Letra grande
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(36)
  doc.setTextColor(255, 255, 255)
  doc.text(meta.letra, boxX + boxW / 2, y + 18, { align: 'center' })

  // Código debajo de la letra
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`Cód. ${padLeft(meta.codigo, 2)}`, boxX + boxW / 2, y + 26, { align: 'center' })

  // Separador vertical izq/der
  setDrawColor(GRAY_LIGHT)
  doc.setLineWidth(0.3)
  doc.line(boxX - 2, y - 2, boxX - 2, y + boxH - 2)
  doc.line(boxX + boxW + 2, y - 2, boxX + boxW + 2, y + boxH - 2)

  // ── Empresa (izquierda) ──────────────────────────────
  const empX = ML
  const empMaxW = boxX - ML - 5

  setColor(GRAY_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(data.empresa.razon_social, empX, y + 4, { maxWidth: empMaxW })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setColor(GRAY_MID)

  let ey = y + 12
  doc.text(data.empresa.domicilio, empX, ey, { maxWidth: empMaxW })
  ey += 5
  doc.text(`CUIT: ${data.empresa.cuit}`, empX, ey)
  ey += 5
  doc.text(`IVA: ${COND_IVA[data.empresa.cond_iva] ?? data.empresa.cond_iva}`, empX, ey)
  if (data.empresa.iibb) {
    ey += 5
    doc.text(`IIBB: ${data.empresa.iibb}`, empX, ey)
  }
  if (data.empresa.inicio_actividades) {
    ey += 5
    doc.text(`Inicio actividades: ${fmtDate(data.empresa.inicio_actividades)}`, empX, ey)
  }

  // ── Datos del comprobante (derecha) ──────────────────
  const cbteX = boxX + boxW + 5
  const cbteMaxW = W - MR - cbteX

  setColor(GRAY_DARK)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(meta.nombre, cbteX, y + 4, { maxWidth: cbteMaxW })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  setColor(GRAY_MID)

  let dy = y + 12
  const nroStr = data.numero
    ? `${padLeft(Number(data.punto_venta), 4)} - ${padLeft(data.numero, 8)}`
    : `${padLeft(Number(data.punto_venta), 4)} - ________`
  doc.text(`Nro: ${nroStr}`, cbteX, dy)
  dy += 5
  doc.text(`Fecha: ${fmtDate(data.fecha)}`, cbteX, dy)
  dy += 5
  doc.text(`Concepto: ${CONCEPTO_NOMBRE[data.concepto] ?? ''}`, cbteX, dy)
  if (data.concepto !== 1 && data.fch_serv_desde) {
    dy += 5
    doc.text(`Período: ${fmtDate(data.fch_serv_desde)} al ${fmtDate(data.fch_serv_hasta ?? '')}`, cbteX, dy)
  }
  if (data.condicion_pago) {
    dy += 5
    doc.text(`Cond. pago: ${CONDPAGO_NOMBRE[data.condicion_pago] ?? data.condicion_pago}`, cbteX, dy)
  }
  if (data.orden_compra) {
    dy += 5
    doc.text(`O/C: ${data.orden_compra}`, cbteX, dy)
  }

  // Avanzamos y después del header
  y = y + boxH + 2

  // ══════════════════════════════════════════════
  // SECCIÓN RECEPTOR
  // ══════════════════════════════════════════════
  setFillColor(LIGHT_BLUE)
  doc.rect(ML, y, CW, 22, 'F')
  setDrawColor(GRAY_LIGHT)
  doc.rect(ML, y, CW, 22)

  setColor(GRAY_MID)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7)
  doc.text('DATOS DEL RECEPTOR', ML + 3, y + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  setColor(GRAY_DARK)
  doc.text(data.cliente.razon_social, ML + 3, y + 10)

  doc.setFontSize(8)
  setColor(GRAY_MID)
  const clienteInfo = [
    `CUIT: ${data.cliente.cuit}`,
    `IVA: ${COND_IVA[data.cliente.cond_iva] ?? data.cliente.cond_iva}`,
    data.cliente.domicilio ? `Dom: ${data.cliente.domicilio}` : '',
  ].filter(Boolean).join('    ')
  doc.text(clienteInfo, ML + 3, y + 16)

  y += 28

  // Cbte asociado (NC/ND)
  if (data.cbte_asoc) {
    setFillColor([255, 251, 235] as [number, number, number])
    doc.rect(ML, y - 4, CW, 10, 'F')
    setColor([146, 64, 14] as [number, number, number])
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Comprobante original asociado:', ML + 3, y + 2)
    doc.setFont('helvetica', 'normal')
    const cbteLabel = TIPO_META[data.cbte_asoc.tipo]?.nombre ?? data.cbte_asoc.tipo
    doc.text(
      `${cbteLabel} — Pto. Vta. ${padLeft(Number(data.cbte_asoc.pto_vta), 4)} — Nro. ${padLeft(Number(data.cbte_asoc.nro), 8)}`,
      ML + 60, y + 2,
    )
    y += 12
  }

  // ══════════════════════════════════════════════
  // TABLA DE ÍTEMS
  // ══════════════════════════════════════════════
  const rows = data.items.map((it) => {
    const neto = it.cantidad * it.precio_unitario * (1 - (it.descuento ?? 0) / 100)
    return [
      it.codigo ?? '',
      it.descripcion,
      it.unidad ?? '',
      it.cantidad.toLocaleString('es-AR', { maximumFractionDigits: 3 }),
      AR(it.precio_unitario),
      it.descuento ? `${it.descuento}%` : '',
      `${it.alicuota_iva}%`,
      AR(neto),
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Código', 'Descripción', 'U.M.', 'Cant.', 'P. Unit.', 'Dto.', 'IVA', 'Subtotal']],
    body: rows,
    margin: { left: ML, right: MR },
    styles: { fontSize: 8, cellPadding: 2, textColor: GRAY_DARK },
    headStyles: {
      fillColor: BLUE,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 55 },
      2: { cellWidth: 13 },
      3: { halign: 'right', cellWidth: 14 },
      4: { halign: 'right', cellWidth: 22 },
      5: { halign: 'right', cellWidth: 12 },
      6: { halign: 'right', cellWidth: 14 },
      7: { halign: 'right', cellWidth: 22 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] as [number, number, number] },
  })

  y = (doc as any).lastAutoTable.finalY + 4

  // ══════════════════════════════════════════════
  // TOTALES
  // ══════════════════════════════════════════════
  const totX = ML + CW * 0.55
  const totW = CW * 0.45
  const row = (label: string, value: string, bold = false, bg?: [number, number, number]) => {
    if (bg) {
      setFillColor(bg)
      doc.rect(totX, y - 3.5, totW, 7, 'F')
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setFontSize(bold ? 9 : 8)
    setColor(bold ? GRAY_DARK : GRAY_MID)
    doc.text(label, totX + 2, y + 0.5)
    setColor(GRAY_DARK)
    doc.text(value, totX + totW - 2, y + 0.5, { align: 'right' })
    y += 7
  }

  // Línea separadora
  setDrawColor(GRAY_LIGHT)
  doc.line(totX, y - 2, totX + totW, y - 2)
  y += 2

  // Desglose por alícuota
  const descFactor = 1 - (data.descuento_global ?? 0) / 100
  data.alicuotas_iva.forEach((ali) => {
    row(`Neto gravado ${ali.alicuota}%:`, AR(ali.base_imp * descFactor))
    row(`IVA ${ali.alicuota}%:`, AR(ali.importe * descFactor))
  })

  // Descuento global
  if ((data.descuento_global ?? 0) > 0) {
    const descMonto = data.imp_neto * (data.descuento_global! / 100)
    row(`Descuento ${data.descuento_global}%:`, `- ${AR(descMonto)}`)
  }

  // Separador
  setDrawColor(GRAY_LIGHT)
  doc.line(totX, y - 2, totX + totW, y - 2)

  row('Subtotal neto:', AR(data.imp_neto))
  row('Total IVA:', AR(data.imp_iva))

  // TOTAL
  row('TOTAL:', AR(data.imp_total), true, LIGHT_BLUE)

  // Moneda / Cotización
  if (data.moneda !== 'PES' && data.cotizacion) {
    doc.setFontSize(7)
    setColor(GRAY_MID)
    doc.setFont('helvetica', 'italic')
    doc.text(
      `Moneda: ${MONEDA_NOMBRE[data.moneda] ?? data.moneda} — Cotización: ${data.cotizacion}`,
      totX + 2, y + 0.5,
    )
    y += 6
  }

  // Observaciones
  if (data.observaciones) {
    y += 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(GRAY_MID)
    doc.text('Observaciones:', ML, y)
    y += 5
    doc.setFontSize(8)
    setColor(GRAY_DARK)
    const lines = doc.splitTextToSize(data.observaciones, CW)
    doc.text(lines, ML, y)
    y += lines.length * 5
  }

  // ══════════════════════════════════════════════
  // PIE — CAE + QR
  // ══════════════════════════════════════════════
  y += 4
  setFillColor(LIGHT_BLUE)
  doc.rect(ML, y, CW, data.cae ? 22 : 12, 'F')
  setDrawColor(GRAY_LIGHT)
  doc.rect(ML, y, CW, data.cae ? 22 : 12)

  if (data.cae) {
    setColor(GRAY_MID)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('CAE', ML + 3, y + 5)
    setColor(GRAY_DARK)
    doc.setFontSize(10)
    doc.text(data.cae, ML + 12, y + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    setColor(GRAY_MID)
    doc.text(`Vencimiento CAE: ${fmtDate(data.cae_vencimiento ?? '')}`, ML + 3, y + 12)

    // Placeholder QR (requiere paquete qrcode para generación real)
    setFillColor([255, 255, 255])
    doc.rect(W - MR - 22, y + 2, 18, 18, 'F')
    setDrawColor(GRAY_LIGHT)
    doc.rect(W - MR - 22, y + 2, 18, 18)
    doc.setFontSize(5)
    setColor(GRAY_MID)
    doc.text('QR', W - MR - 22 + 9, y + 12, { align: 'center' })
    doc.text('ARCA', W - MR - 22 + 9, y + 16, { align: 'center' })
  } else {
    // Borrador
    setColor(GRAY_MID)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('Comprobante pendiente de emisión — sin CAE asignado', ML + 3, y + 7)

    // Sello BORRADOR diagonal
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(48)
    doc.setTextColor(200, 200, 200)
    doc.setGState(doc.GState({ opacity: 0.15 }))
    doc.text('BORRADOR', W / 2, 148, { align: 'center', angle: 45 })
    doc.setGState(doc.GState({ opacity: 1 }))
  }

  // ── Pie de página ──────────────────────────────
  const footY = 285
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6.5)
  setColor(GRAY_MID)
  doc.text('Comprobante generado por FacturaSaaS', W / 2, footY, { align: 'center' })
  doc.text('1 / 1', W - MR, footY, { align: 'right' })

  return doc
}

/** Descarga el PDF directamente en el navegador */
export function descargarPDF(data: PdfData): void {
  const doc = generarPDF(data)
  const tipo = TIPO_META[data.tipo] ?? { letra: '?', nombre: data.tipo }
  const nro = data.numero ? String(data.numero).padStart(8, '0') : 'borrador'
  const pvta = String(data.punto_venta).padStart(4, '0')
  doc.save(`${tipo.nombre.replace(/ /g, '_')}_${tipo.letra}_${pvta}-${nro}.pdf`)
}

/** Retorna el PDF como Blob para poder subirlo al servidor */
export function pdfToBlob(data: PdfData): Blob {
  const doc = generarPDF(data)
  return doc.output('blob')
}

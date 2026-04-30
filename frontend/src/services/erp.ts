import api from './api'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Proveedor {
  id: string
  razon_social: string
  nombre_fantasia?: string
  tipo_doc: string
  nro_doc?: string
  condicion_iva?: string
  email?: string
  telefono?: string
  contacto?: string
  domicilio?: string
  localidad?: string
  provincia?: string
  codigo_postal?: string
  pais: string
  condicion_pago?: string
  cbu?: string
  alias_cbu?: string
  notas?: string
  activo: boolean
}

export interface Producto {
  id: string
  codigo?: string
  descripcion: string
  tipo: string
  unidad_medida: string
  precio_venta: number
  precio_compra: number
  alicuota_iva: number
  stock_actual: number
  stock_minimo: number
  activo: boolean
}

export interface MovimientoStock {
  id: string
  producto_id: string
  tipo: string
  cantidad: number
  costo_unitario: number
  origen: string
  observaciones?: string
}

export interface Compra {
  id: string
  proveedor_id?: string
  tipo_comprobante?: string
  punto_venta?: string
  numero?: number
  imp_total: number
  moneda: string
  ret_ganancias: number
  ret_iibb: number
  ret_iva: number
  estado: string
  stock_actualizado: boolean
}

export interface CuentaBancaria {
  id: string
  nombre: string
  tipo: string
  banco?: string
  cbu?: string
  alias?: string
  moneda: string
  saldo_inicial: number
  activo: boolean
}

export interface Cobro {
  id: string
  cliente_id?: string
  cuenta_id?: string
  comprobante_id?: string
  importe: number
  forma_pago?: string
  referencia?: string
}

export interface Pago {
  id: string
  proveedor_id?: string
  cuenta_id?: string
  compra_id?: string
  importe: number
  forma_pago?: string
  referencia?: string
}

export interface ResumenTesoreria {
  total_cuentas: number
  total_cobros: number
  total_pagos: number
  posicion_neta: number
}

export interface Presupuesto {
  id: string
  cliente_id?: string
  numero?: number
  imp_total: number
  moneda: string
  estado: string
  validez_dias: number
  comprobante_id?: string
}

export interface Empleado {
  id: string
  nombre: string
  apellido: string
  cuil?: string
  email?: string
  telefono?: string
  puesto?: string
  departamento?: string
  fecha_ingreso?: string
  salario_bruto: number
  modalidad: string
  activo: boolean
}

export interface CuentaContable {
  id: string
  codigo: string
  nombre: string
  tipo: string
  nivel: number
  padre_id?: string
  activo: boolean
}

export interface Asiento {
  id: string
  fecha: string
  descripcion: string
  numero?: number
  origen?: string
  origen_id?: string
  total_debe: number
  total_haber: number
  lineas: LineaAsiento[]
}

export interface LineaAsiento {
  cuenta_id: string
  cuenta_codigo: string
  cuenta_nombre: string
  debe: number
  haber: number
  descripcion?: string
}

// ─── Proveedores ─────────────────────────────────────────────────────────────

export const proveedoresApi = {
  listar: (empresaId: string, activo?: boolean) =>
    api.get<Proveedor[]>('/proveedores/', { params: { empresa_id: empresaId, activo } }).then(r => r.data),
  crear: (data: Omit<Proveedor, 'id'> & { empresa_id: string }) =>
    api.post<Proveedor>('/proveedores/', data).then(r => r.data),
  actualizar: (id: string, data: Partial<Proveedor> & { empresa_id: string }) =>
    api.put<Proveedor>(`/proveedores/${id}`, data).then(r => r.data),
  eliminar: (id: string) =>
    api.delete(`/proveedores/${id}`),
}

// ─── Inventario ───────────────────────────────────────────────────────────────

export const inventarioApi = {
  listarProductos: (empresaId: string, tipo?: string) =>
    api.get<Producto[]>('/inventario/productos', { params: { empresa_id: empresaId, tipo } }).then(r => r.data),
  crearProducto: (data: Omit<Producto, 'id' | 'stock_actual'> & { empresa_id: string }) =>
    api.post<Producto>('/inventario/productos', data).then(r => r.data),
  actualizarProducto: (id: string, data: Partial<Producto> & { empresa_id: string }) =>
    api.put<Producto>(`/inventario/productos/${id}`, data).then(r => r.data),
  listarMovimientos: (empresaId: string, productoId?: string) =>
    api.get<MovimientoStock[]>('/inventario/movimientos', { params: { empresa_id: empresaId, producto_id: productoId } }).then(r => r.data),
  registrarMovimiento: (data: Omit<MovimientoStock, 'id'> & { empresa_id: string }) =>
    api.post<MovimientoStock>('/inventario/movimientos', data).then(r => r.data),
  stockBajo: (empresaId: string) =>
    api.get<Producto[]>('/inventario/stock-bajo', { params: { empresa_id: empresaId } }).then(r => r.data),
}

// ─── Compras ──────────────────────────────────────────────────────────────────

export const comprasApi = {
  listar: (empresaId: string, estado?: string) =>
    api.get<Compra[]>('/compras/', { params: { empresa_id: empresaId, estado } }).then(r => r.data),
  crear: (data: Omit<Compra, 'id' | 'stock_actualizado'> & { empresa_id: string }) =>
    api.post<Compra>('/compras/', data).then(r => r.data),
  obtener: (id: string) =>
    api.get<Compra>(`/compras/${id}`).then(r => r.data),
  cambiarEstado: (id: string, estado: string) =>
    api.patch(`/compras/${id}/estado`, null, { params: { estado } }),
}

// ─── Tesorería ────────────────────────────────────────────────────────────────

export const tesoreriaApi = {
  listarCuentas: (empresaId: string) =>
    api.get<CuentaBancaria[]>('/tesoreria/cuentas', { params: { empresa_id: empresaId } }).then(r => r.data),
  crearCuenta: (data: Omit<CuentaBancaria, 'id'> & { empresa_id: string }) =>
    api.post<CuentaBancaria>('/tesoreria/cuentas', data).then(r => r.data),
  saldoCuenta: (id: string) =>
    api.get<{ saldo: number; moneda: string }>(`/tesoreria/cuentas/${id}/saldo`).then(r => r.data),
  listarCobros: (empresaId: string) =>
    api.get<Cobro[]>('/tesoreria/cobros', { params: { empresa_id: empresaId } }).then(r => r.data),
  registrarCobro: (data: Omit<Cobro, 'id'> & { empresa_id: string }) =>
    api.post<Cobro>('/tesoreria/cobros', data).then(r => r.data),
  listarPagos: (empresaId: string) =>
    api.get<Pago[]>('/tesoreria/pagos', { params: { empresa_id: empresaId } }).then(r => r.data),
  registrarPago: (data: Omit<Pago, 'id'> & { empresa_id: string }) =>
    api.post<Pago>('/tesoreria/pagos', data).then(r => r.data),
  resumen: (empresaId: string) =>
    api.get<ResumenTesoreria>('/tesoreria/resumen', { params: { empresa_id: empresaId } }).then(r => r.data),
}

// ─── Presupuestos ─────────────────────────────────────────────────────────────

export const presupuestosApi = {
  listar: (empresaId: string, estado?: string) =>
    api.get<Presupuesto[]>('/presupuestos/', { params: { empresa_id: empresaId, estado } }).then(r => r.data),
  crear: (data: Omit<Presupuesto, 'id'> & { empresa_id: string; items: unknown[] }) =>
    api.post<Presupuesto>('/presupuestos/', data).then(r => r.data),
  cambiarEstado: (id: string, estado: string) =>
    api.patch(`/presupuestos/${id}/estado`, null, { params: { estado } }),
  convertirFactura: (id: string) =>
    api.post(`/presupuestos/${id}/convertir-factura`).then(r => r.data),
}

// ─── RRHH ─────────────────────────────────────────────────────────────────────

export const rrhhApi = {
  listarEmpleados: (empresaId: string, activo?: boolean) =>
    api.get<Empleado[]>('/rrhh/empleados', { params: { empresa_id: empresaId, activo } }).then(r => r.data),
  crearEmpleado: (data: Omit<Empleado, 'id'> & { empresa_id: string }) =>
    api.post<Empleado>('/rrhh/empleados', data).then(r => r.data),
  actualizarEmpleado: (id: string, data: Partial<Empleado> & { empresa_id: string }) =>
    api.put<Empleado>(`/rrhh/empleados/${id}`, data).then(r => r.data),
}

// ─── Contabilidad ─────────────────────────────────────────────────────────────

export const contabilidadApi = {
  listarCuentas: (empresaId: string) =>
    api.get<CuentaContable[]>('/contabilidad/cuentas', { params: { empresa_id: empresaId } }).then(r => r.data),
  crearCuenta: (data: Omit<CuentaContable, 'id'> & { empresa_id: string }) =>
    api.post<CuentaContable>('/contabilidad/cuentas', data).then(r => r.data),
  listarAsientos: (empresaId: string) =>
    api.get<Asiento[]>('/contabilidad/asientos', { params: { empresa_id: empresaId } }).then(r => r.data),
  crearAsiento: (data: { empresa_id: string; fecha: string; descripcion: string; lineas: Omit<LineaAsiento, 'cuenta_codigo' | 'cuenta_nombre'>[] }) =>
    api.post<Asiento>('/contabilidad/asientos', data).then(r => r.data),
}

import { z } from 'zod';

export const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Cliente requerido'),
  items: z.array(z.object({
    Descripcion: z.string().min(1, 'Descripción requerida'),
    Cantidad: z.number().min(1, 'Cantidad mínima 1'),
    ValorUnitario: z.number().min(0, 'Valor unitario requerido'),
    ClaveProdServ: z.string().min(1, 'ClaveProdServ requerida'),
    ClaveUnidad: z.string().min(1, 'ClaveUnidad requerida'),
    NoIdentificacion: z.string().optional(),
    Unidad: z.string().optional(),
    Descuento: z.string().optional(),
    ObjetoImp: z.string().optional(),
    Impuestos: z.any().optional(),
  })).min(1, 'Al menos un item requerido'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  TipoDocumento: z.string().optional(),
  Serie: z.string().optional(),
  FormaPago: z.string().optional(),
  MetodoPago: z.string().optional(),
  Moneda: z.string().optional(),
  UsoCFDI: z.string().optional(),
  Pais: z.string().optional(),
  RegimenFiscal: z.string().optional(),
  BorradorSiFalla: z.string().optional(),
  Draft: z.string().optional(),
  NumeroPedido: z.string().optional(), // 🔥 NUEVO: Campo para número de pedido
  // Campos para factura global
  RFC: z.string().optional(),
  RazonSocial: z.string().optional(),
  Correo: z.string().optional(),
  Pedido: z.string().optional(),
  CodigoPostal: z.string().optional(),
  Periodicidad: z.string().optional(),
  Meses: z.string().optional(),
  Año: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  // ... más validaciones
});

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import Select from '../common/Select/Select';
import CustomerModalForm from './CustomerModalForm';

const defaultConcepto = {
  ClaveProdServ: '',
  NoIdentificacion: '',
  Cantidad: 1,
  ClaveUnidad: '',
  Unidad: '',
  ValorUnitario: '',
  Descripcion: '',
  Descuento: '0',
  ObjetoImp: '02',
  Impuestos: {
    Traslados: [],
    Retenidos: [],
    Locales: [],
  },
};

const WOOCOMMERCE_URL = 'https://sieeg.com.mx';
const WOOCOMMERCE_CONSUMER_KEY = 'ck_135a712cae91341b1383f5031eff37f89a8f62a4';
const WOOCOMMERCE_CONSUMER_SECRET = 'cs_9a3f25a9fd51c50866c4d7ad442abeb63be74c0e';
const FACTURA_API_URL = import.meta.env.VITE_FACTURA_API_URL || 'https://api.factura.com/v1/clients';
const FACTURA_API_KEY = import.meta.env.VITE_FACTURA_API_KEY;
const FACTURA_SECRET_KEY = import.meta.env.VITE_FACTURA_SECRET_KEY;
const FACTURA_PLUGIN = import.meta.env.VITE_FACTURA_PLUGIN;

// Mapeo de métodos de pago de WooCommerce a códigos SAT (igual que en CFDIForm)
const mapearMetodoPago = (wooPaymentMethod) => {
  // Mapeos más completos basados en los catálogos del SAT
  const mapeos = {
    // WooCommerce -> {FormaPago, MetodoPago}
    
    // Efectivo y equivalentes
    'cod': { FormaPago: '01', MetodoPago: 'PUE' }, // Contra entrega -> Efectivo
    'oxxo': { FormaPago: '01', MetodoPago: 'PUE' }, // OXXO -> Efectivo
    'cash': { FormaPago: '01', MetodoPago: 'PUE' }, // Efectivo -> Efectivo
    
    // Cheques
    'cheque': { FormaPago: '02', MetodoPago: 'PUE' }, // Cheque -> Cheque nominativo
    'check': { FormaPago: '02', MetodoPago: 'PUE' }, // Check -> Cheque nominativo
    
    // Transferencias bancarias
    'bacs': { FormaPago: '03', MetodoPago: 'PUE' }, // Transferencia bancaria -> Transferencia electrónica de fondos
    'spei': { FormaPago: '03', MetodoPago: 'PUE' }, // SPEI -> Transferencia electrónica de fondos
    'wire_transfer': { FormaPago: '03', MetodoPago: 'PUE' }, // Transferencia -> Transferencia electrónica de fondos
    
    // Tarjetas de crédito/débito
    'stripe': { FormaPago: '04', MetodoPago: 'PUE' }, // Stripe -> Tarjeta de crédito
    'paypal': { FormaPago: '04', MetodoPago: 'PUE' }, // PayPal -> Tarjeta de crédito  
    'mercadopago': { FormaPago: '04', MetodoPago: 'PUE' }, // MercadoPago -> Tarjeta de crédito
    'square': { FormaPago: '04', MetodoPago: 'PUE' }, // Square -> Tarjeta de crédito
    'credit_card': { FormaPago: '04', MetodoPago: 'PUE' }, // Tarjeta de crédito -> Tarjeta de crédito
    'debit_card': { FormaPago: '28', MetodoPago: 'PUE' }, // Tarjeta de débito -> Tarjeta de débito
    
    // Monederos electrónicos
    'paypal_express': { FormaPago: '05', MetodoPago: 'PUE' }, // PayPal Express -> Monedero electrónico
    'amazon_payments': { FormaPago: '05', MetodoPago: 'PUE' }, // Amazon Pay -> Monedero electrónico
    
    // Otros métodos comunes en México
    'conekta': { FormaPago: '04', MetodoPago: 'PUE' }, // Conekta -> Tarjeta de crédito
    'openpay': { FormaPago: '04', MetodoPago: 'PUE' }, // OpenPay -> Tarjeta de crédito
    'clip': { FormaPago: '04', MetodoPago: 'PUE' }, // Clip -> Tarjeta de crédito
    
    // Métodos de pago diferido
    'bank_deposit': { FormaPago: '03', MetodoPago: 'PPD' }, // Depósito bancario -> Pago diferido
    'installments': { FormaPago: '04', MetodoPago: 'PPD' }, // Pagos a plazos -> Pago diferido
  };
  
  // Si no encuentra mapeo exacto, intentar mapeo por patrones
  if (!mapeos[wooPaymentMethod]) {
    const metodoBajo = wooPaymentMethod.toLowerCase();
    
    if (metodoBajo.includes('paypal')) return { FormaPago: '04', MetodoPago: 'PUE' };
    if (metodoBajo.includes('stripe') || metodoBajo.includes('card') || metodoBajo.includes('tarjeta')) return { FormaPago: '04', MetodoPago: 'PUE' };
    if (metodoBajo.includes('transfer') || metodoBajo.includes('spei') || metodoBajo.includes('bancari')) return { FormaPago: '03', MetodoPago: 'PUE' };
    if (metodoBajo.includes('oxxo') || metodoBajo.includes('cash') || metodoBajo.includes('efectivo')) return { FormaPago: '01', MetodoPago: 'PUE' };
    if (metodoBajo.includes('cheque')) return { FormaPago: '02', MetodoPago: 'PUE' };
  }
  
  return mapeos[wooPaymentMethod] || { FormaPago: '99', MetodoPago: 'PUE' }; // Por defecto: Otros
};

const CFDIGlobalForm = () => {
  const [showDraft, setShowDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [catalogs, setCatalogs] = useState({});
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [isFacturaGlobal, setIsFacturaGlobal] = useState(false);
  const [pedidoInput, setPedidoInput] = useState("");
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [productosImportados, setProductosImportados] = useState([]);
  const [clienteData, setClienteData] = useState(null);
  const [clienteError, setClienteError] = useState("");
  const [emittedUID, setEmittedUID] = useState(null);
  const [cfdiMessage, setCfdiMessage] = useState("");
  const [validadoCorreo, setValidadoCorreo] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [formaPagoFromOrder, setFormaPagoFromOrder] = useState(null);
  const [metodoPagoFromOrder, setMetodoPagoFromOrder] = useState(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      customerId: '',
      items: [defaultConcepto],
      TipoDocumento: 'factura',
      Serie: '',
      FormaPago: '',
      MetodoPago: '',
      Moneda: 'MXN',
      UsoCFDI: '',
      InformacionGlobal: {
        Periodicidad: '',
        Meses: '',
        Año: new Date().getFullYear().toString(),
      },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    const fetchCatalogs = async () => {
      setLoadingCatalogs(true);
      try {
        const [prod, unidad, forma, metodo, moneda, uso, pais, regimen, relacion, impuesto] = await Promise.all([
          FacturaAPIService.getCatalog('ClaveProductServ'),
          FacturaAPIService.getCatalog('ClaveUnidad'),
          FacturaAPIService.getCatalog('FormaPago'),
          FacturaAPIService.getCatalog('MetodoPago'),
          FacturaAPIService.getCatalog('Moneda'),
          FacturaAPIService.getUsoCFDI(),
          FacturaAPIService.getCatalog('Pais'),
          FacturaAPIService.getCatalog('RegimenFiscal'),
          FacturaAPIService.getCatalog('Relacion'),
          FacturaAPIService.getCatalog('Impuesto'),
        ]);
        setCatalogs({
          ClaveProductServ: prod.data.data || [],
          ClaveUnidad: unidad.data.data || [],
          FormaPago: forma.data.data || [],
          MetodoPago: metodo.data.data || [],
          Moneda: moneda.data.data || [],
          UsoCFDI: uso.data || [],
          Pais: pais.data.data || [],
          RegimenFiscal: regimen.data.data || [],
          Relacion: relacion.data.data || [],
          Impuesto: impuesto.data.data || [],
        });
      } catch (err) {
        // Puedes mostrar error si lo deseas
      }
      setLoadingCatalogs(false);
    };
    fetchCatalogs();
  }, []);

  // Establecer valor por defecto para UsoCFDI cuando se carguen los catálogos
  useEffect(() => {
    if (catalogs.UsoCFDI && catalogs.UsoCFDI.length > 0 && !watch('UsoCFDI')) {
      setValue('UsoCFDI', catalogs.UsoCFDI[0].key || catalogs.UsoCFDI[0].value || '');
    }
  }, [catalogs.UsoCFDI, setValue, watch]);

  const onSubmit = async (data) => {
    const cfdiData = {
      Receptor: {
        UID: data.customerId,
      },
      TipoDocumento: data.TipoDocumento,
      Serie: data.Serie,
      FormaPago: data.FormaPago,
      MetodoPago: data.MetodoPago,
      Moneda: data.Moneda,
      UsoCFDI: data.UsoCFDI,
      Conceptos: data.items,
      InformacionGlobal: data.InformacionGlobal,
    };
    try {
      const response = await FacturaAPIService.createCFDI40(cfdiData);
      alert('CFDI Global creado: ' + JSON.stringify(response.data));
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleViewDraft = async (formData) => {
    // Forzar modo borrador
    const cfdiData = {
      Receptor: {
        UID: formData.customerId,
      },
      TipoDocumento: formData.TipoDocumento,
      Serie: formData.Serie,
      FormaPago: formData.FormaPago,
      MetodoPago: formData.MetodoPago,
      Moneda: formData.Moneda,
      UsoCFDI: formData.UsoCFDI,
      Conceptos: formData.items,
      InformacionGlobal: formData.InformacionGlobal,
      BorradorSiFalla: '1',
      Draft: '1',
    };
    try {
      const response = await FacturaAPIService.createCFDI40(cfdiData);
      setDraftData(response.data);
      setShowDraft(true);
    } catch (err) {
      alert('Error al crear borrador: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleEmitDraft = async () => {
    if (!draftData?.data?.UID) return;
    try {
      const response = await FacturaAPIService.stampDraft(draftData.data.UID);
      alert('CFDI emitido: ' + JSON.stringify(response.data));
      setShowDraft(false);
      setDraftData(null);
    } catch (err) {
      alert('Error al emitir CFDI: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleImportPedido = async () => {
    if (!pedidoInput) return;
    setLoadingPedido(true);
    try {
      const url = `${WOOCOMMERCE_URL}/wp-json/wc/v3/orders/${pedidoInput}?consumer_key=${WOOCOMMERCE_CONSUMER_KEY}&consumer_secret=${WOOCOMMERCE_CONSUMER_SECRET}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se encontró el pedido');
      const order = await res.json();
      
      // 🔥 LOG COMPLETO DEL PEDIDO WOOCOMMERCE (igual que en CFDIForm)
      console.log('==================================================');
      console.log('🛒 PEDIDO WOOCOMMERCE COMPLETO - DATOS DEL PAGO');
      console.log('==================================================');
      console.log('📋 ID del pedido:', order.id);
      console.log('💳 payment_method:', order.payment_method);
      console.log('💳 payment_method_title:', order.payment_method_title);
      console.log('💰 total:', order.total);
      console.log('📊 status:', order.status);
      console.log('💱 currency:', order.currency);
      
      // Logs específicos de métodos de pago
      console.log('');
      console.log('🔍 ANÁLISIS DETALLADO DEL MÉTODO DE PAGO:');
      console.log('   - Tipo de payment_method:', typeof order.payment_method);
      console.log('   - Valor exacto payment_method:', JSON.stringify(order.payment_method));
      console.log('   - Tipo de payment_method_title:', typeof order.payment_method_title);
      console.log('   - Valor exacto payment_method_title:', JSON.stringify(order.payment_method_title));
      
      // Obtener método de pago y mapear a códigos SAT
      const paymentMethod = order.payment_method || order.meta_data?.find(meta => meta.key === '_payment_method')?.value;
      const pagoMapeado = mapearMetodoPago(paymentMethod);
      
      console.log('🎯 Método de pago mapeado:', pagoMapeado);
      
      // Mostrar información del mapeo al usuario
      if (pagoMapeado.FormaPago !== '99') {
        console.log(`✅ Método de pago WooCommerce "${order.payment_method}" (${order.payment_method_title}) mapeado a FormaPago: ${pagoMapeado.FormaPago}, MetodoPago: ${pagoMapeado.MetodoPago}`);
      } else {
        console.log(`⚠️ Método de pago WooCommerce "${order.payment_method}" no tiene mapeo específico, usando valores por defecto`);
      }
      
      // Guardar los valores mapeados
      setFormaPagoFromOrder(pagoMapeado.FormaPago);
      setMetodoPagoFromOrder(pagoMapeado.MetodoPago);
      
      // Actualizar clienteData con los valores obtenidos
      if (clienteData) {
        setClienteData({ 
          ...clienteData, 
          FormaPago: pagoMapeado.FormaPago,
          MetodoPago: pagoMapeado.MetodoPago 
        });
      }
      
      console.log('==================================================');
      
      if (order.line_items && Array.isArray(order.line_items)) {
        let notFound = [];
        const conceptos = await Promise.all(order.line_items.map(async prod => {
          let wcProduct = null;
          if (prod.product_id) {
            try {
              const prodUrl = `${WOOCOMMERCE_URL}/wp-json/wc/v3/products/${prod.product_id}?consumer_key=${WOOCOMMERCE_CONSUMER_KEY}&consumer_secret=${WOOCOMMERCE_CONSUMER_SECRET}`;
              const prodRes = await fetch(prodUrl);
              if (prodRes.ok) {
                wcProduct = await prodRes.json();
              }
            } catch (err) {}
          }
          const getWooAttr = (name) => wcProduct?.attributes?.find(a => a.name === name)?.options?.[0] || '';
          const claveProdServ = getWooAttr('F_ClaveProdServ') || '01010101';
          const claveUnidad = getWooAttr('F_ClaveUnidad') || 'H87';
          const unidad = getWooAttr('F_Unidad') || 'Pieza';
          let descripcionFinal = prod.name || '';
          if (descripcionFinal.length > 1000) {
            descripcionFinal = descripcionFinal.substring(0, 1000);
          }
          return {
            ClaveProdServ: claveProdServ,
            NoIdentificacion: prod.sku || '',
            Cantidad: prod.quantity || 1,
            ClaveUnidad: claveUnidad,
            Unidad: unidad,
            ValorUnitario: prod.price || prod.total || '',
            Descripcion: descripcionFinal,
            Descuento: '0',
            ObjetoImp: '02',
            Impuestos: { Traslados: [], Retenidos: [], Locales: [] },
          };
        }));
        setProductosImportados(order.line_items);
        setValue('items', conceptos);
      } else {
        alert('No se encontraron productos para ese pedido');
        setProductosImportados([]);
      }
    } catch (err) {
      alert('Error al importar pedido: ' + (err.message));
      setProductosImportados([]);
    }
    setLoadingPedido(false);
  };

  const handleBuscarCliente = async (rfc) => {
    if (!rfc) return;
    setClienteError("");
    setClienteData(null);
    setFormaPagoFromOrder(null); // Reset forma de pago al buscar nuevo cliente
    setMetodoPagoFromOrder(null); // Reset método de pago al buscar nuevo cliente
    setProductosImportados([]); // Reset productos importados
    setPedidoInput(""); // Reset input de pedido
    try {
      const res = await FacturaAPIService.getClientByRFC(rfc);
      const data = res.data;
      if (data.status === 'success' && data.Data) {
        setClienteData(data.Data);
        setValue('customerId', data.Data.UID || '');
        
        // Auto-rellenar UsoCFDI si el cliente lo tiene configurado
        if (data.Data.UsoCFDI && catalogs.UsoCFDI && catalogs.UsoCFDI.length > 0) {
          const usoCFDIExists = catalogs.UsoCFDI.find(uso => 
            (uso.key && uso.key === data.Data.UsoCFDI) || 
            (uso.value && uso.value === data.Data.UsoCFDI)
          );
          if (usoCFDIExists) {
            setValue('UsoCFDI', String(data.Data.UsoCFDI), { shouldValidate: true });
            console.log('✅ UsoCFDI auto-rellenado desde cliente:', data.Data.UsoCFDI);
          }
        }
      } else {
        setClienteError('No se encontró el cliente para ese RFC');
        alert('El RFC no está dado de alta. Por favor registre el cliente.');
        setShowCustomerModal(true);
      }
    } catch (err) {
      setClienteError('Error consultando cliente: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-xl font-bold mb-4">DATOS DE FACTURA</h2>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <Input label="RFC*" {...register('RFC', { required: true })}
              onBlur={e => handleBuscarCliente(e.target.value)}
            />
          </div>

          {clienteError && (
            <div className="p-2 bg-red-100 text-red-700 rounded mt-2">{clienteError}</div>
          )}
          
          {clienteData && (
            <div className="mb-4">
              <Controller
                name="UsoCFDI"
                control={control}
                rules={{ required: 'Debes seleccionar un uso CFDI.' }}
                render={({ field, fieldState }) => {
                  const safeValue = field.value == null ? '' : String(field.value);
                  console.log('[Controller:UsoCFDI] value:', safeValue, 'options:', catalogs.UsoCFDI);
                  return (
                    <Select
                      label="Selecciona uso CFDI*"
                      options={Array.isArray(catalogs.UsoCFDI) ? catalogs.UsoCFDI.map((opt, idx) => ({
                        value: String(opt.key || opt.value),
                        label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}`,
                      })) : []}
                      value={safeValue}
                      onChange={val => {
                        const v = val == null ? '' : String(val);
                        field.onChange(v);
                        setValue('UsoCFDI', v, { shouldValidate: true, shouldDirty: true });
                        console.log('[Select:UsoCFDI] onChange value:', v);
                      }}
                      placeholder="Selecciona uso CFDI"
                      isLoading={loadingCatalogs}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  );
                }}
              />
            </div>
          )}
          
          {clienteData && (
            <CorreoValidador
              clienteCorreo={clienteData.Contacto?.Email}
              clienteData={clienteData}
              fields={fields}
              setEmittedUID={setEmittedUID}
              setCfdiMessage={setCfdiMessage}
              setValidadoCorreo={setValidadoCorreo}
            />
          )}
          {clienteData && validadoCorreo && (
            <div className="mb-8">
              {/* Mostrar productos importados primero */}
              {productosImportados.length > 0 && (
                <div className="space-y-4 mb-4">
                  {productosImportados.map((prod, idx) => (
                    <div key={idx} className="border border-blue-200 bg-blue-50 p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:gap-6">
                      <div className="font-bold text-blue-700 text-lg">{prod.name || 'Sin nombre'}</div>
                      <div className="text-sm text-gray-700">SKU: <span className="font-mono">{prod.sku}</span></div>
                      <div className="text-sm text-gray-700">Cantidad: <span className="font-mono">{prod.quantity}</span></div>
                      <div className="text-sm text-gray-700">Precio: <span className="font-mono">${prod.price || prod.total}</span></div>
                      <div className="text-sm text-gray-700">Descripción: <span className="font-mono">{prod.name}</span></div>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-2">Estos productos fueron importados del pedido #{pedidoInput}.</div>
                </div>
              )}
              {/* Input para importar pedido */}
              <div className="p-4 bg-blue-50 rounded-lg flex flex-col md:flex-row gap-4 items-center">
                <input
                  type="text"
                  placeholder="Número de pedido"
                  value={pedidoInput}
                  onChange={e => setPedidoInput(e.target.value)}
                  className="border border-blue-300 rounded-lg p-2 w-full md:w-64"
                />
                <Button type="button" onClick={handleImportPedido} disabled={loadingPedido || !pedidoInput} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow">
                  {loadingPedido ? 'Cargando...' : 'Importar pedido'}
                </Button>
              </div>
              {/* Botón de facturar solo si hay productos importados */}
              {productosImportados.length > 0 && (
                <Button type="button" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow text-lg mt-4" onClick={async () => {
                  // Construir el objeto CFDI con los datos del cliente y productos importados
                  const cfdiData = {
                    Receptor: {
                      UID: clienteData.UID,
                      ResidenciaFiscal: clienteData.ResidenciaFiscal || '',
                      RegimenFiscalR: clienteData.RegimenId || clienteData.RegimenFiscal || '',
                    },
                    TipoDocumento: 'factura',
                    Serie: 5483035, // Serie C, asignada automáticamente
                    FormaPago: clienteData.FormaPago || '03', // Obtenida automáticamente del pedido o valor por defecto
                    MetodoPago: clienteData.MetodoPago || 'PUE', // Obtenido automáticamente del pedido o valor por defecto
                    Moneda: 'MXN',
                    UsoCFDI: watch('UsoCFDI') || clienteData.UsoCFDI || 'G03',
                    Conceptos: fields.map(item => ({
                      ClaveProdServ: item.ClaveProdServ,
                      NoIdentificacion: item.NoIdentificacion,
                      Cantidad: item.Cantidad,
                      ClaveUnidad: item.ClaveUnidad,
                      Unidad: item.Unidad,
                      ValorUnitario: item.ValorUnitario,
                      Descripcion: item.Descripcion,
                      Descuento: item.Descuento,
                      ObjetoImp: item.ObjetoImp,
                      Impuestos: item.Impuestos,
                    })),
                  };
                  try {
                    const response = await FacturaAPIService.createCFDI40(cfdiData);
                    const uid = response.data?.UID || response.data?.UUID || response.data?.uid || response.data?.invoice_uid;
                    setEmittedUID(uid);
                    setCfdiMessage('CFDI creado correctamente.');
                  } catch (err) {
                    setCfdiMessage('Error al crear CFDI: ' + (err.response?.data?.message || err.message));
                  }
                }}>
                  Facturar automáticamente
                </Button>
              )}
            </div>
          )}
        </div>
        {Object.keys(errors).length > 0 && (
          <pre className="text-red-500 mt-2">{JSON.stringify(errors, null, 2)}</pre>
        )}
        {emittedUID && (
          <div className="mt-10 p-8 bg-green-50 rounded-2xl shadow-lg">
            <h3 className="text-lg font-bold mb-2 text-green-700">CFDI emitido</h3>
            {cfdiMessage && (
              <div className="mb-4 text-green-800 font-semibold">{cfdiMessage}</div>
            )}
            <div className="flex gap-4 mb-4">
              <Button type="button" onClick={async () => {
                try {
                  const res = await FacturaAPIService.getCFDIPDF(emittedUID);
                  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `CFDI_${emittedUID}.pdf`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (err) {
                  setCfdiMessage('Error al descargar PDF: ' + (err.response?.data?.message || err.message));
                }
              }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2">
                <span>📄</span> Descargar PDF
              </Button>
              <Button type="button" onClick={async () => {
                try {
                  const res = await FacturaAPIService.getCFDIXML(emittedUID);
                  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/xml' }));
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', `CFDI_${emittedUID}.xml`);
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                } catch (err) {
                  setCfdiMessage('Error al descargar XML: ' + (err.response?.data?.message || err.message));
                }
              }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2">
                <span>🗎</span> Descargar XML
              </Button>
            </div>
            <div className="text-xs text-green-700">UID: {emittedUID}</div>
          </div>
        )}
      </form>
      <CustomerModalForm open={showCustomerModal} onClose={() => setShowCustomerModal(false)} />
    </>
  );
};

// Validador de correo
function CorreoValidador({ clienteCorreo, clienteData, fields, setEmittedUID, setCfdiMessage, setValidadoCorreo }) {
  const [correoInput, setCorreoInput] = useState('');
  const [validado, setValidado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValidado(false);
    setError('');
    setCorreoInput('');
  }, [clienteCorreo]);

  const handleValidar = () => {
    if (correoInput.trim().toLowerCase() === (clienteCorreo || '').trim().toLowerCase()) {
      setValidado(true);
      setError('');
      setValidadoCorreo(true);
    } else {
      setValidado(false);
      setError('El correo no coincide con el registrado para este RFC.');
      setValidadoCorreo(false);
    }
  };

  return (
    <div className="mb-4 p-6 bg-yellow-50 border border-yellow-300 rounded-lg shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" /></svg>
        <label className="font-semibold text-gray-700 text-base">Valida tu correo para facturar</label>
      </div>
      <input
        type="email"
        value={correoInput}
        onChange={e => setCorreoInput(e.target.value)}
        className="border border-yellow-400 rounded-lg p-2 w-full mb-2 focus:ring-2 focus:ring-yellow-300 focus:outline-none transition"
        placeholder="Escribe el correo con el que facturas"
      />
      <Button type="button" onClick={handleValidar} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-6 rounded-lg shadow mt-1">Validar correo</Button>
      {error && <div className="text-red-600 mt-2 font-medium">{error}</div>}
      {/* Eliminar el botón de facturar aquí, solo debe aparecer después de importar pedido */}
    </div>
  );
}

export default CFDIGlobalForm;

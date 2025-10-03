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
    
    // 🔥 MÉTODOS ESPECÍFICOS DE TU WOOCOMMERCE
    'TarjetaCredito': { FormaPago: '04', MetodoPago: 'PUE' }, // Tarjeta de crédito específica
    'TarjetaDebito': { FormaPago: '28', MetodoPago: 'PUE' }, // Tarjeta de débito específica
    
    // Tarjetas de crédito/débito genéricas
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
  
  console.log('🔍 Mapeando payment_method:', wooPaymentMethod);
  
  // Buscar mapeo exacto primero (case-sensitive)
  if (mapeos[wooPaymentMethod]) {
    console.log('✅ Mapeo exacto encontrado:', mapeos[wooPaymentMethod]);
    return mapeos[wooPaymentMethod];
  }
  
  // Si no encuentra mapeo exacto, intentar mapeo por patrones
  const metodoBajo = wooPaymentMethod.toLowerCase();
  console.log('🔍 Intentando mapeo por patrones para:', metodoBajo);
  
  if (metodoBajo.includes('paypal')) return { FormaPago: '04', MetodoPago: 'PUE' };
  if (metodoBajo.includes('debito') || metodoBajo.includes('debit')) return { FormaPago: '28', MetodoPago: 'PUE' };
  if (metodoBajo.includes('credito') || metodoBajo.includes('credit') || metodoBajo.includes('tarjeta')) return { FormaPago: '04', MetodoPago: 'PUE' };
  if (metodoBajo.includes('stripe') || metodoBajo.includes('card')) return { FormaPago: '04', MetodoPago: 'PUE' };
  if (metodoBajo.includes('transfer') || metodoBajo.includes('spei') || metodoBajo.includes('bancari')) return { FormaPago: '03', MetodoPago: 'PUE' };
  if (metodoBajo.includes('oxxo') || metodoBajo.includes('cash') || metodoBajo.includes('efectivo')) return { FormaPago: '01', MetodoPago: 'PUE' };
  if (metodoBajo.includes('cheque')) return { FormaPago: '02', MetodoPago: 'PUE' };
  
  console.log('⚠️ No se encontró mapeo específico, usando valores por defecto');
  return { FormaPago: '99', MetodoPago: 'PUE' }; // Por defecto: Otros
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
  const [emailFromWooCommerce, setEmailFromWooCommerce] = useState(null);

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
    setValidadoCorreo(false); // Reset validación de correo al importar nuevo pedido
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
      console.log('📧 billing email:', order.billing?.email);
      
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
      
      // 📧 Capturar el email del billing de WooCommerce
      const emailWooCommerce = order.billing?.email || null;
      setEmailFromWooCommerce(emailWooCommerce);
      console.log('📧 Email capturado de WooCommerce billing:', emailWooCommerce);
      
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
    setEmailFromWooCommerce(null); // Reset email de WooCommerce
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

  // Función para recargar los datos del cliente después de actualizarlo
  const handleClienteUpdate = async (rfc) => {
    try {
      const res = await FacturaAPIService.getClientByRFC(rfc);
      const data = res.data;
      if (data.status === 'success' && data.Data) {
        setClienteData(data.Data);
        console.log('✅ Datos del cliente recargados después de la actualización');
      }
    } catch (err) {
      console.error('Error al recargar datos del cliente:', err);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700 mb-2">Facturación Automática</h2>
          <p className="text-gray-600">Sigue los pasos para generar tu factura automáticamente</p>
        </div>

        {/* Indicador de progreso */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-semibold ${clienteData ? 'text-green-600' : 'text-blue-600'}`}>
              1. RFC del Cliente
            </span>
            <span className={`text-sm font-semibold ${productosImportados.length > 0 ? 'text-green-600' : clienteData ? 'text-blue-600' : 'text-gray-400'}`}>
              2. Número de Pedido
            </span>
            <span className={`text-sm font-semibold ${validadoCorreo ? 'text-green-600' : productosImportados.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
              3. Validar Correo
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                validadoCorreo ? 'bg-green-500 w-full' : 
                productosImportados.length > 0 ? 'bg-blue-500 w-2/3' : 
                clienteData ? 'bg-blue-500 w-1/3' : 'bg-gray-400 w-0'
              }`}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* PASO 1: RFC del Cliente */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Paso 1: Ingresa el RFC del cliente</h3>
            <Input 
              label="RFC*" 
              {...register('RFC', { required: true })}
              onBlur={e => handleBuscarCliente(e.target.value)}
              className="text-lg"
            />
            {clienteData && (
              <div className="mt-2 p-2 bg-green-100 text-green-800 rounded text-sm">
                ✅ Cliente encontrado: <strong>{clienteData.RazonSocial}</strong>
              </div>
            )}
          </div>

          {clienteError && (
            <div className="p-2 bg-red-100 text-red-700 rounded mt-2">{clienteError}</div>
          )}
          
          {/* PASO 1.5: Seleccionar Uso CFDI - solo si hay cliente válido */}
          {clienteData && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Paso 1.5: Selecciona el uso de CFDI</h3>
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
          
          
          {/* PASO 2: Input para número de pedido - solo si hay cliente válido */}
          {clienteData && (
            <div className="mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-700 mb-3">Paso 2: Ingresa el número de pedido</h3>
                <div className="flex flex-col md:flex-row gap-4 items-center">
                  <input
                    type="text"
                    placeholder="Número de pedido de WooCommerce"
                    value={pedidoInput}
                    onChange={e => setPedidoInput(e.target.value)}
                    className="border border-blue-300 rounded-lg p-3 w-full md:w-64 text-lg"
                  />
                  <Button type="button" onClick={handleImportPedido} disabled={loadingPedido || !pedidoInput} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow">
                    {loadingPedido ? 'Cargando...' : 'Importar pedido'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* PASO 3: Mostrar productos importados */}
          {clienteData && productosImportados.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-3">Productos del pedido #{pedidoInput}:</h3>
              <div className="space-y-3">
                {productosImportados.map((prod, idx) => (
                  <div key={idx} className="border border-green-200 bg-green-50 p-4 rounded-lg shadow flex flex-col md:flex-row md:items-center md:gap-6">
                    <div className="font-bold text-green-700 text-lg">{prod.name || 'Sin nombre'}</div>
                    <div className="text-sm text-gray-700">SKU: <span className="font-mono">{prod.sku}</span></div>
                    <div className="text-sm text-gray-700">Cantidad: <span className="font-mono">{prod.quantity}</span></div>
                    <div className="text-sm text-gray-700">Precio: <span className="font-mono">${prod.price || prod.total}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PASO 4: Validar correo - solo si hay productos importados */}
          {clienteData && productosImportados.length > 0 && emailFromWooCommerce && (
            <CorreoValidador
              clienteCorreo={emailFromWooCommerce}
              clienteData={clienteData}
              fields={fields}
              setEmittedUID={setEmittedUID}
              setCfdiMessage={setCfdiMessage}
              setValidadoCorreo={setValidadoCorreo}
              emailFromWooCommerce={emailFromWooCommerce}
              productosImportados={productosImportados}
              pedidoInput={pedidoInput}
              watch={watch}
              onClienteUpdate={handleClienteUpdate}
            />
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
function CorreoValidador({ clienteCorreo, clienteData, fields, setEmittedUID, setCfdiMessage, setValidadoCorreo, emailFromWooCommerce, productosImportados, pedidoInput, watch, onClienteUpdate }) {
  const [correoInput, setCorreoInput] = useState('');
  const [validado, setValidado] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValidado(false);
    setError('');
    setCorreoInput(''); // Campo vacío para que el usuario ingrese su correo
  }, [clienteCorreo, emailFromWooCommerce]);

  const handleValidar = () => {
    if (correoInput.trim().toLowerCase() === (clienteCorreo || '').trim().toLowerCase()) {
      setValidado(true);
      setError('');
      setValidadoCorreo(true);
    } else {
      setValidado(false);
      setError('El correo no coincide con el usado en la compra. Verifica e intenta nuevamente.');
      setValidadoCorreo(false);
    }
  };

  return (
    <div className="mb-6">
      {/* Validación de correo */}
      <div className="p-6 bg-yellow-50 border border-yellow-300 rounded-lg shadow-sm mb-4">
        <h3 className="text-lg font-semibold text-yellow-700 mb-3">Paso 3: Valida tu correo electrónico</h3>
        <p className="text-sm text-gray-600 mb-4">
          Para confirmar que eres el propietario de este pedido, ingresa el correo electrónico que usaste al realizar la compra:
        </p>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Correo electrónico de la compra:
          </label>
          <input
            type="email"
            value={correoInput}
            onChange={e => setCorreoInput(e.target.value)}
            className="border border-yellow-400 rounded-lg p-3 w-full focus:ring-2 focus:ring-yellow-300 focus:outline-none transition text-lg"
            placeholder="ejemplo@correo.com"
          />
        </div>
        <Button 
          type="button" 
          onClick={handleValidar} 
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg shadow"
        >
          Validar correo
        </Button>
        {error && <div className="text-red-600 mt-3 font-medium">{error}</div>}
        {validado && <div className="text-green-600 mt-3 font-medium">✅ Correo validado correctamente</div>}
      </div>

      {/* Preview de datos del cliente y botón de facturar - solo aparece si el correo está validado */}
      {validado && (
        <PreviewCliente 
          clienteData={clienteData}
          watch={watch}
          fields={fields}
          setEmittedUID={setEmittedUID}
          setCfdiMessage={setCfdiMessage}
          onClienteUpdate={onClienteUpdate}
        />
      )}
    </div>
  );
}

// Componente Preview del Cliente
function PreviewCliente({ clienteData, watch, fields, setEmittedUID, setCfdiMessage, onClienteUpdate }) {
  const [editMode, setEditMode] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [catalogs, setCatalogs] = useState({ UsoCFDI: [], RegimenFiscal: [] });
  const [catalogLoading, setCatalogLoading] = useState(false);

  useEffect(() => {
    if (editMode && !editingData) {
      // Preparar datos para edición
      setEditingData({
        rfc: clienteData.RFC || '',
        razons: clienteData.RazonSocial || '',
        codpos: clienteData.CodigoPostal || '',
        email: clienteData.Contacto?.Email || '',
        usocfdi: clienteData.UsoCFDI || '',
        regimen: clienteData.RegimenId || '',
        calle: clienteData.Calle || '',
        numero_exterior: clienteData.Numero || '',
        numero_interior: clienteData.Interior || '',
        colonia: clienteData.Colonia || '',
        ciudad: clienteData.Ciudad || '',
        delegacion: clienteData.Delegacion || '',
        localidad: clienteData.Localidad || '',
        estado: clienteData.Estado || '',
        pais: clienteData.Pais || 'MEX',
        numregidtrib: clienteData.NumRegIdTrib || '',
        nombre: clienteData.Contacto?.Nombre || '',
        apellidos: clienteData.Contacto?.Apellidos || '',
        telefono: clienteData.Contacto?.Telefono || '',
        email2: clienteData.Contacto?.Email2 || '',
        email3: clienteData.Contacto?.Email3 || '',
      });

      // Cargar catálogos para la edición
      const fetchCatalogs = async () => {
        setCatalogLoading(true);
        try {
          const [uso, regimen] = await Promise.all([
            FacturaAPIService.getUsoCFDI(),
            FacturaAPIService.getCatalog('RegimenFiscal'),
          ]);
          setCatalogs({
            UsoCFDI: uso.data?.data || uso.data || [],
            RegimenFiscal: regimen.data?.data || regimen.data || [],
          });
        } catch (err) {
          console.error('Error al cargar catálogos:', err);
        }
        setCatalogLoading(false);
      };
      fetchCatalogs();
    }
  }, [editMode, editingData, clienteData]);

  const handleEditChange = (field, value) => {
    setEditingData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveClient = async () => {
    if (!editingData || !clienteData?.UID) return;
    setLoadingUpdate(true);
    try {
      const dataToUpdate = { 
        ...editingData, 
        codpos: Number(editingData.codpos) 
      };
      const response = await FacturaAPIService.updateClient(clienteData.UID, dataToUpdate);
      if (response.data?.status === 'success') {
        alert('Datos del cliente actualizados correctamente');
        setEditMode(false);
        setEditingData(null);
        
        // Recargar los datos del cliente para mostrar la información actualizada
        if (onClienteUpdate && clienteData?.RFC) {
          await onClienteUpdate(clienteData.RFC);
        }
      } else {
        throw new Error(response.data?.message || 'Error al actualizar');
      }
    } catch (err) {
      alert('Error al actualizar cliente: ' + (err.response?.data?.message || err.message));
    }
    setLoadingUpdate(false);
  };

  const handleFacturar = async () => {
    console.log('🎯 Iniciando proceso de facturación automática...');
    
    try {
      // Validar que tengamos los datos necesarios
      if (!clienteData?.UID) {
        console.error('❌ No hay UID del cliente');
        setCfdiMessage('Error: No se encontró el UID del cliente');
        alert('Error: No se encontró el UID del cliente');
        return;
      }

      if (!fields || fields.length === 0) {
        console.error('❌ No hay productos/conceptos para facturar');
        setCfdiMessage('Error: No hay productos para facturar');
        alert('Error: No hay productos para facturar');
        return;
      }

      const usoCFDI = watch('UsoCFDI') || clienteData.UsoCFDI || 'G03';
      console.log('📋 Datos para facturar:', {
        clienteUID: clienteData.UID,
        usoCFDI: usoCFDI,
        numConceptos: fields.length,
        formaPago: clienteData.FormaPago || '03',
        metodoPago: clienteData.MetodoPago || 'PUE'
      });

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
        UsoCFDI: usoCFDI,
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

      console.log('📤 Enviando CFDI con datos:', cfdiData);
      setCfdiMessage('Generando factura...');

      const response = await FacturaAPIService.createCFDI40(cfdiData);
      console.log('✅ Respuesta completa de la API:', response);
      console.log('📋 Estructura de response.data:', JSON.stringify(response.data, null, 2));

      // Intentar extraer el UID de diferentes ubicaciones posibles
      let uid = null;
      
      // Verificar todas las posibles ubicaciones del UID
      const possiblePaths = [
        response.data?.UID,
        response.data?.UUID, 
        response.data?.uid,
        response.data?.invoice_uid,
        response.data?.data?.UID,
        response.data?.data?.UUID,
        response.data?.data?.uid,
        response.data?.Data?.UID,
        response.data?.Data?.UUID,
        response.data?.response?.UID,
        response.data?.invoice?.UID,
        response.data?.cfdi?.UID,
        response.UID,
        response.UUID,
        response.uid
      ];

      console.log('🔍 Buscando UID en todas las ubicaciones posibles:', possiblePaths);

      for (const path of possiblePaths) {
        if (path && path !== '') {
          uid = path;
          console.log('✅ UID encontrado:', uid, 'en ubicación:', path);
          break;
        }
      }
      
      if (uid) {
        setEmittedUID(uid);
        setCfdiMessage('CFDI creado correctamente.');
        console.log('✅ CFDI creado con UID:', uid);
        alert('¡Factura generada exitosamente! UID: ' + uid);
      } else {
        console.error('❌ No se encontró UID en ninguna ubicación');
        console.error('📋 Respuesta completa:', JSON.stringify(response, null, 2));
        setCfdiMessage('Error: No se recibió el UID del CFDI');
        alert('Error: La factura se procesó pero no se recibió el UID. Revisa la consola para más detalles.');
      }
    } catch (err) {
      console.error('❌ Error al crear CFDI:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error desconocido';
      setCfdiMessage('Error al crear CFDI: ' + errorMessage);
      alert('Error al generar la factura: ' + errorMessage);
    }
  };

  if (editMode) {
    return (
      <div className="p-6 bg-blue-50 border border-blue-300 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-blue-700 mb-4">Editar datos del cliente</h3>
        <div className="space-y-6">
          {/* Información Fiscal */}
          <div>
            <h4 className="text-md font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Información Fiscal</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="RFC*" 
                value={editingData?.rfc || ''} 
                onChange={e => handleEditChange('rfc', e.target.value)}
                required 
              />
              <Input 
                label="Código Postal*" 
                value={editingData?.codpos || ''} 
                onChange={e => handleEditChange('codpos', e.target.value)}
                required 
                type="number" 
              />
              <div className="md:col-span-2">
                <Input 
                  label="Razón Social*" 
                  value={editingData?.razons || ''} 
                  onChange={e => handleEditChange('razons', e.target.value)}
                  required 
                />
              </div>
              <Input 
                label="Email Principal*" 
                value={editingData?.email || ''} 
                onChange={e => handleEditChange('email', e.target.value)}
                required 
                type="email" 
              />
              <Input 
                label="País*" 
                value={editingData?.pais || ''} 
                onChange={e => handleEditChange('pais', e.target.value)}
                required 
              />
            </div>
          </div>

          {/* Catálogos SAT */}
          <div>
            <h4 className="text-md font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Catálogos SAT</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select 
                label="Uso CFDI" 
                value={editingData?.usocfdi || ''} 
                onChange={val => handleEditChange('usocfdi', val)} 
                options={Array.isArray(catalogs.UsoCFDI) ? catalogs.UsoCFDI.map(opt => ({ 
                  value: opt.key || opt.value, 
                  label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` 
                })) : []} 
                isLoading={catalogLoading} 
                placeholder="Selecciona uso CFDI" 
              />
              <Select 
                label="Régimen Fiscal*" 
                value={editingData?.regimen || ''} 
                onChange={val => handleEditChange('regimen', val)} 
                options={Array.isArray(catalogs.RegimenFiscal) ? catalogs.RegimenFiscal.map(opt => ({ 
                  value: opt.key || opt.value, 
                  label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` 
                })) : []} 
                isLoading={catalogLoading} 
                placeholder="Selecciona régimen fiscal" 
                required 
              />
            </div>
          </div>

          {/* Dirección */}
          <div>
            <h4 className="text-md font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Dirección</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input label="Calle" value={editingData?.calle || ''} onChange={e => handleEditChange('calle', e.target.value)} />
              </div>
              <Input label="Número Exterior" value={editingData?.numero_exterior || ''} onChange={e => handleEditChange('numero_exterior', e.target.value)} />
              <Input label="Número Interior" value={editingData?.numero_interior || ''} onChange={e => handleEditChange('numero_interior', e.target.value)} />
              <Input label="Colonia" value={editingData?.colonia || ''} onChange={e => handleEditChange('colonia', e.target.value)} />
              <Input label="Ciudad" value={editingData?.ciudad || ''} onChange={e => handleEditChange('ciudad', e.target.value)} />
              <Input label="Estado" value={editingData?.estado || ''} onChange={e => handleEditChange('estado', e.target.value)} />
              <Input label="Delegación" value={editingData?.delegacion || ''} onChange={e => handleEditChange('delegacion', e.target.value)} />
            </div>
          </div>

          {/* Información de Contacto */}
          <div>
            <h4 className="text-md font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Información de Contacto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre" value={editingData?.nombre || ''} onChange={e => handleEditChange('nombre', e.target.value)} />
              <Input label="Apellidos" value={editingData?.apellidos || ''} onChange={e => handleEditChange('apellidos', e.target.value)} />
              <Input label="Teléfono" value={editingData?.telefono || ''} onChange={e => handleEditChange('telefono', e.target.value)} />
              <Input label="Email 2" value={editingData?.email2 || ''} onChange={e => handleEditChange('email2', e.target.value)} type="email" />
              <Input label="Email 3" value={editingData?.email3 || ''} onChange={e => handleEditChange('email3', e.target.value)} type="email" />
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button 
            type="button" 
            onClick={() => { setEditMode(false); setEditingData(null); }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg shadow"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSaveClient}
            disabled={loadingUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow"
          >
            {loadingUpdate ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Preview de datos del cliente */}
      <div className="p-6 bg-gray-50 border border-gray-300 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Datos del cliente</h3>
          <Button 
            type="button" 
            onClick={() => setEditMode(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow text-sm"
          >
             Editar datos
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>RFC:</strong> {clienteData.RFC}
          </div>
          <div>
            <strong>Razón Social:</strong> {clienteData.RazonSocial}
          </div>
          <div>
            <strong>Código Postal:</strong> {clienteData.CodigoPostal}
          </div>
          <div>
            <strong>Email:</strong> {clienteData.Contacto?.Email}
          </div>
          <div>
            <strong>Régimen:</strong> {clienteData.Regimen}
          </div>
          <div>
            <strong>Uso CFDI:</strong> {clienteData.UsoCFDI}
          </div>
          {clienteData.Calle && (
            <div className="md:col-span-2">
              <strong>Dirección:</strong> {[
                clienteData.Calle,
                clienteData.Numero,
                clienteData.Interior,
                clienteData.Colonia,
                clienteData.Ciudad,
                clienteData.Estado,
                clienteData.CodigoPostal
              ].filter(Boolean).join(', ')}
            </div>
          )}
          {(clienteData.Contacto?.Nombre || clienteData.Contacto?.Telefono) && (
            <>
              {clienteData.Contacto?.Nombre && (
                <div>
                  <strong>Contacto:</strong> {[clienteData.Contacto.Nombre, clienteData.Contacto.Apellidos].filter(Boolean).join(' ')}
                </div>
              )}
              {clienteData.Contacto?.Telefono && (
                <div>
                  <strong>Teléfono:</strong> {clienteData.Contacto.Telefono}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Botón de facturar */}
      <div className="p-6 bg-green-50 border border-green-300 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-green-700 mb-4">¡Listo para facturar!</h3>
        <p className="text-sm text-gray-600 mb-4">
          Verifica que los datos del cliente sean correctos y haz clic para generar la factura automáticamente.
        </p>
        <Button 
          type="button" 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-lg" 
          onClick={() => {
            console.log('🖱️ Click en botón Facturar automáticamente');
            handleFacturar();
          }}
        >
           Facturar automáticamente
        </Button>
      </div>
    </div>
  );
}

export default CFDIGlobalForm;

import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '../../utils/validationSchemas';
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

const CFDIForm = () => {
  const [catalogs, setCatalogs] = useState({
    ClaveProductServ: [],
    ClaveUnidad: [],
    FormaPago: [],
    MetodoPago: [],
    Moneda: [],
    UsoCFDI: [],
    Pais: [],
    RegimenFiscal: [],
    Relacion: [],
    Impuesto: [],
  });
  const [loadingCatalogs, setLoadingCatalogs] = useState(false);
  const [showDraft, setShowDraft] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [series, setSeries] = useState([]);
  const [isGlobal, setIsGlobal] = useState(false);
  const [showImportPedido, setShowImportPedido] = useState(false);
  const [pedidoInput, setPedidoInput] = useState("");
  const [loadingPedido, setLoadingPedido] = useState(false);
  const [productosImportados, setProductosImportados] = useState([]);
  const [emittedUID, setEmittedUID] = useState(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [selectedClientData, setSelectedClientData] = useState(null);
  const [loadingClientData, setLoadingClientData] = useState(false);

  const periodicidadOptions = [
    { value: '01', label: 'Diario' },
    { value: '02', label: 'Semanal' },
    { value: '03', label: 'Quincenal' },
    { value: '04', label: 'Mensual' },
    { value: '05', label: 'Bimestral' },
  ];
  const mesesOptions = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
    { value: '13', label: 'Enero-Febrero' },
    { value: '14', label: 'Marzo-Abril' },
    { value: '15', label: 'Mayo-Junio' },
    { value: '16', label: 'Julio-Agosto' },
    { value: '17', label: 'Septiembre-Octubre' },
    { value: '18', label: 'Noviembre-Diciembre' },
  ];

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      dueDate: '',
      TipoDocumento: 'factura',
      Serie: '',
      FormaPago: '',
      MetodoPago: '',
      Moneda: 'MXN',
      Pais: 'MEX',
      UsoCFDI: '',
      BorradorSiFalla: '0',
      Draft: '0',
      items: [],
    },
    resolver: zodResolver(invoiceSchema),
    shouldUnregister: false, // <-- Mantener valores de los selects aunque se desmonten
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  useEffect(() => {
    let mounted = true;
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
        if (mounted) {
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
        }
      } catch (err) {}
      setLoadingCatalogs(false);
    };
    const fetchProducts = async () => {
      try {
        const res = await FacturaAPIService.listProducts({ per_page: 100 });
        setProducts(res.data.data || []);
      } catch (err) {}
    };
    const fetchClients = async () => {
      try {
        const res = await FacturaAPIService.listClients();
        setClients(res.data.data || []);
      } catch (err) {}
    };
    const fetchSeries = async () => {
      try {
        const res = await FacturaAPIService.getSeries();
        setSeries(res.data.data || []);
      } catch (err) {}
    };
    fetchCatalogs();
    fetchProducts();
    fetchClients();
    fetchSeries();
    return () => { mounted = false; };
  }, []);

  // Refuerzo: sincronizar valores iniciales y cambios para Serie, Moneda y UsoCFDI
  useEffect(() => {
    // Serie
    if (series.length > 0 && !watch('Serie')) {
      setValue('Serie', series[0].SerieName || '');
    }
    // Moneda
    if (catalogs.Moneda.length > 0 && !watch('Moneda')) {
      setValue('Moneda', catalogs.Moneda[0].key || '');
    }
    // UsoCFDI
    if (catalogs.UsoCFDI.length > 0 && !watch('UsoCFDI')) {
      setValue('UsoCFDI', catalogs.UsoCFDI[0].key || catalogs.UsoCFDI[0].value || '');
    }
    // País: seleccionar MEX - México
    if (catalogs.Pais.length > 0) {
      const paisMexico = catalogs.Pais.find(p => p.key === 'MEX' && p.name && p.name.toLowerCase().includes('mexico'));
      if (paisMexico && watch('Pais') !== paisMexico.key) {
        setValue('Pais', paisMexico.key);
      }
    }
    // Quitar asignación automática de Método de Pago y Forma de Pago
    // No se asigna ningún valor por defecto, el usuario debe seleccionar
  }, [series, catalogs.Moneda, catalogs.UsoCFDI, catalogs.Pais, catalogs.MetodoPago, catalogs.FormaPago]);

  // Efecto para auto-rellenar datos cuando los catálogos se cargan después de seleccionar cliente
  useEffect(() => {
    if (selectedClientData && !loadingCatalogs && catalogs.UsoCFDI.length > 0 && catalogs.RegimenFiscal.length > 0) {
      console.log('🔄 Re-ejecutando auto-rellenado porque los catálogos ya están listos');
      const clientUID = watch('customerId');
      if (clientUID && selectedClientData.UID === clientUID) {
        // Solo re-ejecutar el auto-rellenado, no la petición completa
        setTimeout(() => {
          if (selectedClientData.UsoCFDI && !watch('UsoCFDI')) {
            const usoCFDIExists = catalogs.UsoCFDI.find(uso => 
              (uso.key && uso.key === selectedClientData.UsoCFDI) || 
              (uso.value && uso.value === selectedClientData.UsoCFDI)
            );
            if (usoCFDIExists) {
              setValue('UsoCFDI', String(selectedClientData.UsoCFDI), { shouldValidate: true });
              console.log('✅ UsoCFDI re-rellenado:', selectedClientData.UsoCFDI);
            }
          }

          if (selectedClientData.RegimenId && !watch('RegimenFiscal')) {
            const regimenExists = catalogs.RegimenFiscal.find(regimen => 
              regimen.key === selectedClientData.RegimenId
            );
            if (regimenExists) {
              setValue('RegimenFiscal', String(selectedClientData.RegimenId), { shouldValidate: true });
              console.log('✅ RegimenFiscal re-rellenado con RegimenId:', selectedClientData.RegimenId);
            }
          }
        }, 100);
      }
    }
  }, [selectedClientData, loadingCatalogs, catalogs.UsoCFDI, catalogs.RegimenFiscal]);

  const onSubmit = async (dataRaw) => {
    // Calcular la fecha real según la opción seleccionada
    let fechaCFDI = '';
    const hoy = new Date();
    switch (dataRaw.fechaCFDI) {
      case 'hoy':
        fechaCFDI = new Date().toISOString().split('T')[0];
        break;
      case 'ayer':
        hoy.setDate(hoy.getDate() - 1);
        fechaCFDI = hoy.toISOString().split('T')[0];
        break;
      case 'dosdias':
        hoy.setDate(hoy.getDate() - 2);
        fechaCFDI = hoy.toISOString().split('T')[0];
        break;
      case 'tresdias':
        hoy.setDate(hoy.getDate() - 3);
        fechaCFDI = hoy.toISOString().split('T')[0];
        break;
      default:
        fechaCFDI = '';
    }
    // Construir los datos corregidos para validar y enviar
    const data = { ...dataRaw, dueDate: fechaCFDI };
    
    // Debug detallado del UsoCFDI
    console.log('🚀 Valores del formulario RAW (dataRaw):', dataRaw);
    console.log('🚀 Valores del formulario procesados (data):', data);
    console.log('� DEBUG UsoCFDI detallado:');
    console.log('   - dataRaw.UsoCFDI:', dataRaw.UsoCFDI);
    console.log('   - data.UsoCFDI:', data.UsoCFDI);
    console.log('   - Tipo de UsoCFDI:', typeof data.UsoCFDI);
    console.log('   - UsoCFDI está vacío?:', !data.UsoCFDI);
    console.log('   - UsoCFDI es string vacío?:', data.UsoCFDI === '');
    console.log('   - Valor watch actual:', watch('UsoCFDI'));
    
    console.log('🚀 FormaPago específico:', data.FormaPago);
    console.log('🚀 MetodoPago específico:', data.MetodoPago);
    console.log('🚀 RegimenFiscal específico:', data.RegimenFiscal);
    // Mapear los campos del formulario a los nombres esperados por la API
    const items = data.items.map(item => ({
      ClaveProdServ: String(item.ClaveProdServ || '').trim(),
      NoIdentificacion: String(item.NoIdentificacion || '').trim(),
      Cantidad: item.Cantidad ? Number(item.Cantidad) : 1,
      ClaveUnidad: String(item.ClaveUnidad || '').trim(),
      Unidad: String(item.Unidad || 'Pieza').trim(),
      ValorUnitario: item.ValorUnitario ? Number(item.ValorUnitario) : 0,
      Descripcion: String(item.Descripcion || '').trim(),
      Descuento: item.Descuento !== undefined ? String(item.Descuento) : '0',
      ObjetoImp: String(item.ObjetoImp || '02').trim(),
      Impuestos: item.Impuestos || { Traslados: [], Retenidos: [], Locales: [] },
    }));
    // Enviar UsoCFDI solo en la raíz, como indica la documentación oficial  
    let usoCFDIValue = data.UsoCFDI || '';
    
    // Validación adicional para UsoCFDI - MÁS DETALLADA
    console.log('🔍 Validando UsoCFDI:');
    console.log('   - usoCFDIValue inicial:', usoCFDIValue);
    console.log('   - usoCFDIValue length:', usoCFDIValue.length);
    console.log('   - usoCFDIValue trimmed:', usoCFDIValue.trim());
    
    if (!usoCFDIValue || usoCFDIValue.trim() === '') {
      console.error('❌ ERROR: UsoCFDI está vacío o es solo espacios!');
      console.log('🔍 Datos disponibles en form:', data);
      console.log('🔍 Valor directo del watch:', watch('UsoCFDI'));
      
      // Intentar obtener el valor directamente del watch
      const watchValue = watch('UsoCFDI');
      if (watchValue && watchValue.trim() !== '') {
        console.log('⚠️ Usando valor del watch en su lugar:', watchValue);
        usoCFDIValue = watchValue.trim();
      } else {
        alert('Error: No se ha seleccionado un Uso CFDI. Por favor selecciona uno antes de enviar.');
        return;
      }
    }
    
    console.log('✅ UsoCFDI final que se usará:', usoCFDIValue);
    
    // 🔍 DEBUG CRÍTICO: FormaPago y MetodoPago
    console.log('🚨 DEBUG CRÍTICO - FormaPago y MetodoPago:');
    console.log('   - data.FormaPago:', data.FormaPago);
    console.log('   - data.MetodoPago:', data.MetodoPago);
    console.log('   - Tipo FormaPago:', typeof data.FormaPago);
    console.log('   - Tipo MetodoPago:', typeof data.MetodoPago);
    console.log('   - FormaPago está vacío?:', !data.FormaPago);
    console.log('   - MetodoPago está vacío?:', !data.MetodoPago);
    console.log('   - Watch FormaPago:', watch('FormaPago'));
    console.log('   - Watch MetodoPago:', watch('MetodoPago'));
    
    // 🔧 SOLUCION: Usar valores del watch si data está vacío
    let formaPagoFinal = data.FormaPago || watch('FormaPago') || '';
    let metodoPagoFinal = data.MetodoPago || watch('MetodoPago') || '';
    
    console.log('🔧 SOLUCION FormaPago:');
    console.log('   - data.FormaPago:', data.FormaPago);
    console.log('   - watch FormaPago:', watch('FormaPago'));
    console.log('   - formaPagoFinal:', formaPagoFinal);
    
    console.log('🔧 SOLUCION MetodoPago:');
    console.log('   - data.MetodoPago:', data.MetodoPago);
    console.log('   - watch MetodoPago:', watch('MetodoPago'));
    console.log('   - metodoPagoFinal:', metodoPagoFinal);
    
    // Validar que FormaPago y MetodoPago no estén vacíos
    if (!formaPagoFinal || formaPagoFinal.trim() === '') {
      console.error('❌ ERROR: FormaPago está vacío o no seleccionado!');
      console.log('🔍 Valores disponibles en FormaPago:', catalogs.FormaPago.slice(0, 3));
      alert('Error: Debes seleccionar una Forma de Pago antes de crear el CFDI.');
      return;
    }
    
    if (!metodoPagoFinal || metodoPagoFinal.trim() === '') {
      console.error('❌ ERROR: MetodoPago está vacío o no seleccionado!');
      console.log('🔍 Valores disponibles en MetodoPago:', catalogs.MetodoPago.slice(0, 3));
      alert('Error: Debes seleccionar un Método de Pago antes de crear el CFDI.');
      return;
    }
    
    const cfdiData = {
      Receptor: {
        UID: String(data.customerId || '').trim(),
      },
      TipoDocumento: data.TipoDocumento || 'factura',
      Serie: Number(data.Serie) || (series[0]?.id || series[0]?.ID || series[0]?.SerieID || undefined),
      FormaPago: String(formaPagoFinal).trim(), // <-- Usar el valor final corregido
      MetodoPago: String(metodoPagoFinal).trim(), // <-- Usar el valor final corregido
      Moneda: data.Moneda || 'MXN',
      UsoCFDI: String(usoCFDIValue).trim(), // <-- Asegurar que sea string y sin espacios
      Conceptos: items,
      BorradorSiFalla: String(data.BorradorSiFalla || '0'),
      Draft: String(data.Draft || '0'),
      dueDate: fechaCFDI,
    };
    
    console.log('📤 Objeto final enviado a la API:', cfdiData);
    console.log('📤 UsoCFDI que se envía:', cfdiData.UsoCFDI);
    
    // Validación final antes del envío
    if (!cfdiData.UsoCFDI || cfdiData.UsoCFDI.trim() === '') {
      console.error('❌ ERROR FINAL: UsoCFDI en cfdiData está vacío!');
      alert('Error crítico: UsoCFDI se perdió en el procesamiento. Contacta al desarrollador.');
      return;
    }
    
    if (isGlobal) {
      cfdiData.InformacionGlobal = {
        Periodicidad: data.Periodicidad,
        Meses: data.Meses,
        Año: data.Año,
      };
    }
    try {
      const response = await FacturaAPIService.createCFDI40(cfdiData);
      alert('CFDI creado: ' + JSON.stringify(response.data));
      // Guardar UID emitido para mostrar botones de descarga
      const uid = response.data?.UID || response.data?.UUID || response.data?.uid || response.data?.invoice_uid;
      setEmittedUID(uid);
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleImportPedido = async () => {
    if (!pedidoInput) return;
    setLoadingPedido(true);
    try {
      // Petición directa a WooCommerce para obtener el pedido
      const url = `${WOOCOMMERCE_URL}/wp-json/wc/v3/orders/${pedidoInput}?consumer_key=${WOOCOMMERCE_CONSUMER_KEY}&consumer_secret=${WOOCOMMERCE_CONSUMER_SECRET}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('No se encontró el pedido');
      const order = await res.json();
      
      // 🔥 LOG COMPLETO DEL PEDIDO WOOCOMMERCE
      console.log('==================================================');
      console.log('🛒 PEDIDO WOOCOMMERCE COMPLETO - DATOS DEL PAGO');
      console.log('==================================================');
      console.log('📋 ID del pedido:', order.id);
      console.log('💳 payment_method:', order.payment_method);
      console.log('💳 payment_method_title:', order.payment_method_title);
      console.log('💰 total:', order.total);
      console.log('📊 status:', order.status);
      console.log('� currency:', order.currency);
      
      // Logs específicos de métodos de pago
      console.log('');
      console.log('🔍 ANÁLISIS DETALLADO DEL MÉTODO DE PAGO:');
      console.log('   - Tipo de payment_method:', typeof order.payment_method);
      console.log('   - Valor exacto payment_method:', JSON.stringify(order.payment_method));
      console.log('   - Tipo de payment_method_title:', typeof order.payment_method_title);
      console.log('   - Valor exacto payment_method_title:', JSON.stringify(order.payment_method_title));
      
      // Buscar otros campos relacionados con pago
      console.log('');
      console.log('🔎 OTROS CAMPOS RELACIONADOS CON PAGO:');
      if (order.meta_data && Array.isArray(order.meta_data)) {
        const paymentMetas = order.meta_data.filter(meta => 
          meta.key && (
            meta.key.includes('payment') || 
            meta.key.includes('_payment') ||
            meta.key.includes('billing') ||
            meta.key === '_payment_method' ||
            meta.key === '_payment_method_title'
          )
        );
        
        if (paymentMetas.length > 0) {
          console.log('   📋 Meta datos de pago encontrados:');
          paymentMetas.forEach(meta => {
            console.log(`      • ${meta.key}: ${JSON.stringify(meta.value)}`);
          });
        } else {
          console.log('   ❌ No se encontraron meta datos de pago');
        }
      }
      
      // Buscar en billing info
      if (order.billing) {
        console.log('');
        console.log('🏦 INFORMACIÓN DE FACTURACIÓN:');
        console.log('   - billing completo:', JSON.stringify(order.billing, null, 2));
      }
      
      // Buscar campos de transacción
      const transactionFields = ['transaction_id', '_transaction_id', 'payment_url', '_payment_url'];
      console.log('');
      console.log('💳 CAMPOS DE TRANSACCIÓN:');
      transactionFields.forEach(field => {
        if (order[field]) {
          console.log(`   - ${field}:`, order[field]);
        }
      });
      
      // Log del objeto completo (solo las claves principales)
      console.log('');
      console.log('🗂️ ESTRUCTURA COMPLETA DEL PEDIDO (claves principales):');
      console.log('   Claves disponibles:', Object.keys(order));
      
      console.log('==================================================');
      
      // Mapear método de pago de WooCommerce a catálogos SAT
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
      
      const pagoMapeado = mapearMetodoPago(order.payment_method);
      console.log('🎯 Método de pago mapeado:', pagoMapeado);
      
      // Mostrar información del mapeo al usuario
      if (pagoMapeado.FormaPago !== '99') {
        console.log(`✅ Método de pago WooCommerce "${order.payment_method}" (${order.payment_method_title}) mapeado a FormaPago: ${pagoMapeado.FormaPago}, MetodoPago: ${pagoMapeado.MetodoPago}`);
      } else {
        console.log(`⚠️ Método de pago WooCommerce "${order.payment_method}" no tiene mapeo específico, usando valores por defecto`);
      }
      
      // Auto-rellenar FormaPago y MetodoPago si están disponibles en los catálogos
      if (pagoMapeado.FormaPago && catalogs.FormaPago.length > 0) {
        const formaPagoExists = catalogs.FormaPago.find(forma => forma.key === pagoMapeado.FormaPago);
        if (formaPagoExists) {
          // 🔧 Forzar el registro del valor usando múltiples métodos
          setValue('FormaPago', pagoMapeado.FormaPago, { 
            shouldValidate: true, 
            shouldDirty: true, 
            shouldTouch: true 
          });
          
          // 🔧 Verificación inmediata
          setTimeout(() => {
            const valorVerificacion = watch('FormaPago');
            console.log('✅ FormaPago auto-rellenado desde pedido WooCommerce:', pagoMapeado.FormaPago);
            console.log('🔍 Verificación inmediata FormaPago:', valorVerificacion);
            if (valorVerificacion !== pagoMapeado.FormaPago) {
              console.log('⚠️ Reintentando setValue para FormaPago...');
              setValue('FormaPago', pagoMapeado.FormaPago, { shouldValidate: true });
            }
          }, 100);
        } else {
          console.log('⚠️ FormaPago no encontrado en catálogo:', pagoMapeado.FormaPago);
          console.log('🔍 Catálogo FormaPago disponible:', catalogs.FormaPago.slice(0, 3));
        }
      }
      
      if (pagoMapeado.MetodoPago && catalogs.MetodoPago.length > 0) {
        const metodoPagoExists = catalogs.MetodoPago.find(metodo => metodo.key === pagoMapeado.MetodoPago);
        if (metodoPagoExists) {
          // 🔧 Forzar el registro del valor usando múltiples métodos
          setValue('MetodoPago', pagoMapeado.MetodoPago, { 
            shouldValidate: true, 
            shouldDirty: true, 
            shouldTouch: true 
          });
          
          // 🔧 Verificación inmediata
          setTimeout(() => {
            const valorVerificacion = watch('MetodoPago');
            console.log('✅ MetodoPago auto-rellenado desde pedido WooCommerce:', pagoMapeado.MetodoPago);
            console.log('🔍 Verificación inmediata MetodoPago:', valorVerificacion);
            if (valorVerificacion !== pagoMapeado.MetodoPago) {
              console.log('⚠️ Reintentando setValue para MetodoPago...');
              setValue('MetodoPago', pagoMapeado.MetodoPago, { shouldValidate: true });
            }
          }, 100);
        } else {
          console.log('⚠️ MetodoPago no encontrado en catálogo:', pagoMapeado.MetodoPago);
          console.log('🔍 Catálogo MetodoPago disponible:', catalogs.MetodoPago.slice(0, 3));
        }
      }

      if (order.line_items && Array.isArray(order.line_items)) {
        let notFound = [];
        // Consultar cada producto directamente en WooCommerce
        const conceptos = await Promise.all(order.line_items.map(async prod => {
          // Mostrar todos los atributos del producto importado
          console.log('Atributos completos del producto importado:', JSON.stringify(prod, null, 2));
          console.log('product_id del pedido:', prod.product_id);
          let atributos = '';
          if (Array.isArray(prod.meta_data) && prod.meta_data.length > 0) {
            atributos = prod.meta_data.map(meta => `${meta.key}: ${JSON.stringify(meta.value)}`).join(', ');
          }
          // Consulta directa al producto en WooCommerce
          let wcProduct = null;
          if (prod.product_id) {
            try {
              const prodUrl = `${WOOCOMMERCE_URL}/wp-json/wc/v3/products/${prod.product_id}?consumer_key=${WOOCOMMERCE_CONSUMER_KEY}&consumer_secret=${WOOCOMMERCE_CONSUMER_SECRET}`;
              const prodRes = await fetch(prodUrl);
              if (prodRes.ok) {
                wcProduct = await prodRes.json();
                console.log('Producto WooCommerce consultado:', wcProduct);
              } else {
                console.log('No se encontró el producto en WooCommerce:', prod.product_id);
              }
            } catch (err) {
              console.log('Error consultando producto WooCommerce:', err);
            }
          }
          // Extraer atributos SAT desde el array attributes del producto WooCommerce
          const getWooAttr = (name) => wcProduct?.attributes?.find(a => a.name === name)?.options?.[0] || '';
          const claveProdServ = getWooAttr('F_ClaveProdServ') || '01010101';
          const claveUnidad = getWooAttr('F_ClaveUnidad') || 'H87';
          const unidad = getWooAttr('F_Unidad') || 'Pieza';
          // Usar solo el nombre del producto como descripción
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
        setProductosImportados(order.line_items.map(prod => ({
          ...prod,
          Cantidad: prod.quantity || 1 
        })));
        setValue('items', conceptos);
        
        // Notificar al usuario sobre el auto-rellenado del método de pago
        if (pagoMapeado.FormaPago !== '99') {
          setTimeout(() => {
            alert(`✅ Pedido importado exitosamente!\n\n💳 Método de pago detectado: "${order.payment_method_title || order.payment_method}"\n📋 Se auto-rellenaron:\n• Forma de Pago: ${pagoMapeado.FormaPago}\n• Método de Pago: ${pagoMapeado.MetodoPago}\n\n¡Revisa la consola para ver todos los detalles del pedido!\n¡Revisa que los datos sean correctos antes de crear el CFDI!`);
          }, 500);
        }
        
        // 🧪 Log adicional para debugging completo
        console.log('');
        console.log('🧪 DEBUG: PEDIDO COMPLETO PARA ANÁLISIS');
        console.log('=====================================');
        console.log('Para ver el pedido completo, ejecuta en la consola:');
        console.log('window.lastWooCommerceOrder');
        console.log('=====================================');
        
        // Guardar el pedido en una variable global para debugging
        window.lastWooCommerceOrder = order;
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

  function cleanForJson(obj) {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return undefined;
        seen.add(value);
        if (value instanceof HTMLElement) return undefined;
        if (typeof value.type === 'function' || typeof value.render === 'function') return undefined;
      }
      if (typeof value === 'function') return undefined;
      return value;
    }));
  }

  // Refrescar clientes después de crear uno nuevo desde el modal
  const fetchClients = async () => {
    try {
      const res = await FacturaAPIService.listClients();
      setClients(res.data.data || []);
    } catch (err) {}
  };

  const handleCustomerCreated = async () => {
    await fetchClients();
    setShowCustomerModal(false);
  };

  // Función para obtener los datos completos del cliente seleccionado
  const handleClientSelection = async (clientUID) => {
    if (!clientUID) {
      setSelectedClientData(null);
      return;
    }

    setLoadingClientData(true);
    try {
      console.log('🔍 Obteniendo datos del cliente con UID:', clientUID);
      
      // MÉTODO 1: Intentar buscar en la lista de clientes ya cargada
      console.log('🔍 Buscando cliente en lista local...');
      const localClient = clients.find(client => String(client.UID) === String(clientUID));
      if (localClient) {
        console.log('✅ Cliente encontrado en lista local:', JSON.stringify(localClient, null, 2));
        setSelectedClientData(localClient);
        
        // Procesar auto-rellenado con datos locales
        setTimeout(() => {
          console.log('🔄 Iniciando auto-rellenado con datos locales...');
          
          if (localClient.UsoCFDI) {
            console.log('🎯 UsoCFDI encontrado en datos locales:', localClient.UsoCFDI);
            if (catalogs.UsoCFDI.length > 0) {
              const usoCFDIExists = catalogs.UsoCFDI.find(uso => 
                (uso.key && uso.key === localClient.UsoCFDI) || 
                (uso.value && uso.value === localClient.UsoCFDI)
              );
              if (usoCFDIExists) {
                setValue('UsoCFDI', String(localClient.UsoCFDI), { 
                  shouldValidate: true, 
                  shouldDirty: true, 
                  shouldTouch: true 
                });
                console.log('✅ UsoCFDI auto-rellenado desde datos locales:', localClient.UsoCFDI);
              }
            }
          }
          
          if (localClient.RegimenId) {
            console.log('🎯 RegimenId encontrado en datos locales:', localClient.RegimenId);
            if (catalogs.RegimenFiscal.length > 0) {
              const regimenExists = catalogs.RegimenFiscal.find(regimen => 
                regimen.key === localClient.RegimenId
              );
              if (regimenExists) {
                setValue('RegimenFiscal', String(localClient.RegimenId), { 
                  shouldValidate: true, 
                  shouldDirty: true, 
                  shouldTouch: true 
                });
                console.log('✅ RegimenFiscal auto-rellenado desde datos locales:', localClient.RegimenId);
              }
            }
          }

          // 🔥 NUEVO: Auto-rellenar FormaPago y MetodoPago
          if (localClient.FormaPago) {
            console.log('🎯 FormaPago encontrado en datos locales:', localClient.FormaPago);
            if (catalogs.FormaPago.length > 0) {
              const formaPagoExists = catalogs.FormaPago.find(forma => 
                forma.key === localClient.FormaPago
              );
              if (formaPagoExists) {
                setValue('FormaPago', String(localClient.FormaPago), { 
                  shouldValidate: true, 
                  shouldDirty: true, 
                  shouldTouch: true 
                });
                console.log('✅ FormaPago auto-rellenado desde datos locales:', localClient.FormaPago);
              } else {
                console.log('⚠️ FormaPago del cliente no existe en catálogo:', localClient.FormaPago);
              }
            }
          }

          if (localClient.MetodoPago) {
            console.log('🎯 MetodoPago encontrado en datos locales:', localClient.MetodoPago);
            if (catalogs.MetodoPago.length > 0) {
              const metodoPagoExists = catalogs.MetodoPago.find(metodo => 
                metodo.key === localClient.MetodoPago
              );
              if (metodoPagoExists) {
                setValue('MetodoPago', String(localClient.MetodoPago), { 
                  shouldValidate: true, 
                  shouldDirty: true, 
                  shouldTouch: true 
                });
                console.log('✅ MetodoPago auto-rellenado desde datos locales:', localClient.MetodoPago);
              } else {
                console.log('⚠️ MetodoPago del cliente no existe en catálogo:', localClient.MetodoPago);
              }
            }
          }
          
          console.log('🏁 Auto-rellenado desde datos locales completado');
        }, 100);
        
        setLoadingClientData(false);
        return;
      }
      
      // MÉTODO 2: Consultar cliente individual por UID
      console.log('🔍 Cliente no encontrado en lista local, consultando API individual...');
      const response = await FacturaAPIService.getClientByUID(clientUID);
      
      // Debug completo de la respuesta
      console.log('🔍 Respuesta RAW completa de la API:', JSON.stringify(response, null, 2));
      console.log('🔍 response.data:', JSON.stringify(response.data, null, 2));
      console.log('🔍 response.data.data:', JSON.stringify(response.data.data, null, 2));
      
      const clientData = response.data.data || response.data;
      
      console.log('📋 Datos del cliente procesados:', JSON.stringify(clientData, null, 2));
      console.log('📋 Campos específicos del cliente:');
      console.log('   - UID:', clientData.UID);
      console.log('   - RazonSocial:', clientData.RazonSocial);
      console.log('   - RFC:', clientData.RFC);
      console.log('   - UsoCFDI:', clientData.UsoCFDI);
      console.log('   - RegimenId:', clientData.RegimenId);
      console.log('   - Regimen:', clientData.Regimen);
      console.log('   - FormaPago:', clientData.FormaPago);
      console.log('   - MetodoPago:', clientData.MetodoPago);
      
      setSelectedClientData(clientData);

      // Esperar un poco para asegurar que los catálogos estén cargados
      setTimeout(() => {
        console.log('🔄 Iniciando auto-rellenado de campos...');
        
        // Auto-rellenar UsoCFDI
        if (clientData.UsoCFDI) {
          console.log('🎯 Intentando auto-rellenar UsoCFDI con valor:', clientData.UsoCFDI);
          console.log('📚 Catálogo UsoCFDI disponible:', catalogs.UsoCFDI.length, 'elementos');
          
          if (catalogs.UsoCFDI.length > 0) {
            const usoCFDIExists = catalogs.UsoCFDI.find(uso => 
              (uso.key && uso.key === clientData.UsoCFDI) || 
              (uso.value && uso.value === clientData.UsoCFDI)
            );
            
            if (usoCFDIExists) {
              setValue('UsoCFDI', String(clientData.UsoCFDI), { 
                shouldValidate: true, 
                shouldDirty: true,
                shouldTouch: true 
              });
              console.log('✅ UsoCFDI auto-rellenado exitosamente:', clientData.UsoCFDI);
            } else {
              console.log('❌ UsoCFDI no encontrado en catálogo:', clientData.UsoCFDI);
            }
          } else {
            console.log('⚠️ Catálogo UsoCFDI aún no está cargado');
          }
        } else {
          console.log('ℹ️ Cliente no tiene UsoCFDI definido');
        }

        // Auto-rellenar RegimenFiscal - CORREGIDO: usar RegimenId de la API
        if (clientData.RegimenId) {
          console.log('🎯 Intentando auto-rellenar RegimenFiscal con valor RegimenId:', clientData.RegimenId);
          console.log('📚 Catálogo RegimenFiscal disponible:', catalogs.RegimenFiscal.length, 'elementos');
          
          if (catalogs.RegimenFiscal.length > 0) {
            const regimenExists = catalogs.RegimenFiscal.find(regimen => 
              regimen.key === clientData.RegimenId
            );
            
            if (regimenExists) {
              setValue('RegimenFiscal', String(clientData.RegimenId), { 
                shouldValidate: true, 
                shouldDirty: true,
                shouldTouch: true 
              });
              console.log('✅ RegimenFiscal auto-rellenado exitosamente con RegimenId:', clientData.RegimenId);
            } else {
              console.log('❌ RegimenId no encontrado en catálogo:', clientData.RegimenId);
              console.log('🔍 Valores disponibles en catálogo:', catalogs.RegimenFiscal.map(r => r.key));
            }
          } else {
            console.log('⚠️ Catálogo RegimenFiscal aún no está cargado');
          }
        } else {
          console.log('ℹ️ Cliente no tiene RegimenId definido');
        }

        // Auto-rellenar FormaPago
        if (clientData.FormaPago && catalogs.FormaPago.length > 0) {
          const formaPagoExists = catalogs.FormaPago.find(forma => 
            forma.key === clientData.FormaPago
          );
          if (formaPagoExists) {
            setValue('FormaPago', String(clientData.FormaPago), { 
              shouldValidate: true, 
              shouldDirty: true,
              shouldTouch: true 
            });
            console.log('✅ FormaPago auto-rellenado:', clientData.FormaPago);
          }
        }

        // Auto-rellenar MetodoPago
        if (clientData.MetodoPago && catalogs.MetodoPago.length > 0) {
          const metodoPagoExists = catalogs.MetodoPago.find(metodo => 
            metodo.key === clientData.MetodoPago
          );
          if (metodoPagoExists) {
            setValue('MetodoPago', String(clientData.MetodoPago), { 
              shouldValidate: true, 
              shouldDirty: true,
              shouldTouch: true 
            });
            console.log('✅ MetodoPago auto-rellenado:', clientData.MetodoPago);
          }
        }

        console.log('🏁 Auto-rellenado completado');
      }, 100); // Pequeño delay para asegurar que todo esté listo

    } catch (error) {
      console.error('❌ Error al obtener datos del cliente:', error);
      alert('Error al cargar los datos del cliente: ' + (error.response?.data?.message || error.message));
    }
    setLoadingClientData(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Generar CFDI </h2>
        <Button type="button" onClick={() => setShowImportPedido(v => !v)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow">
          importar pedido
        </Button>
      </div>
      {showImportPedido && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg">
          <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
            <input
              type="text"
              placeholder="Número de pedido"
              value={pedidoInput}
              onChange={e => setPedidoInput(e.target.value)}
              className="border border-blue-300 rounded-lg p-2 w-full md:w-64"
            />
            <Button type="button" onClick={handleImportPedido} disabled={loadingPedido} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow">
              {loadingPedido ? 'Cargando...' : 'Cargar pedido'}
            </Button>
          </div>
          
          {/* Botón de debug para el último pedido */}
          <div className="border-t border-blue-200 pt-3">
            <Button 
              type="button" 
              onClick={() => {
                if (window.lastWooCommerceOrder) {
                  console.log('🧪 ÚLTIMO PEDIDO WOOCOMMERCE IMPORTADO:');
                  console.log('=====================================');
                  console.log(JSON.stringify(window.lastWooCommerceOrder, null, 2));
                  console.log('=====================================');
                  console.log('💳 Método de pago específico:', window.lastWooCommerceOrder.payment_method);
                  console.log('💳 Título del método:', window.lastWooCommerceOrder.payment_method_title);
                  alert('Revisa la consola para ver los detalles completos del último pedido importado');
                } else {
                  alert('No hay ningún pedido importado aún. Importa un pedido primero.');
                }
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm py-2 px-4 rounded-lg shadow"
            >
              🧪 Ver último pedido en consola
            </Button>
            <p className="text-xs text-gray-600 mt-2">
              Este botón te mostrará todos los datos del último pedido importado en la consola del navegador
            </p>
          </div>
        </div>
      )}
      <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Datos del Cliente
          {loadingClientData && (
            <span className="ml-2 text-sm text-blue-600 animate-pulse">
              🔄 Cargando datos del cliente...
            </span>
          )}
        </h3>
        {selectedClientData && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <p className="text-sm text-blue-700 font-semibold mb-2">
              ✅ Cliente seleccionado: <strong>{selectedClientData.RazonSocial || 'Sin nombre'}</strong> ({selectedClientData.RFC || 'Sin RFC'})
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• UsoCFDI del cliente: <code className="bg-white px-1 rounded">{selectedClientData.UsoCFDI || 'No definido'}</code></div>
              <div>• RegimenId del cliente: <code className="bg-white px-1 rounded">{selectedClientData.RegimenId || 'No definido'}</code></div>
              <div>• Regimen (descripción): <code className="bg-white px-1 rounded text-xs">{selectedClientData.Regimen || 'No definido'}</code></div>
              <div>• FormaPago del cliente: <code className="bg-white px-1 rounded">{selectedClientData.FormaPago || 'No definido'}</code></div>
              <div>• MetodoPago del cliente: <code className="bg-white px-1 rounded">{selectedClientData.MetodoPago || 'No definido'}</code></div>
              
              {/* Botón de debug para ver todos los datos */}
              <div className="mt-3 pt-2 border-t border-gray-300">
                <button 
                  type="button"
                  onClick={() => {
                    console.log('🧪 DEBUG - Todos los datos del cliente:', selectedClientData);
                    console.log('🧪 DEBUG - Claves disponibles en el cliente:', Object.keys(selectedClientData));
                    console.log('🧪 DEBUG - Catálogos UsoCFDI:', catalogs.UsoCFDI.slice(0, 5));
                    console.log('🧪 DEBUG - Catálogos RegimenFiscal:', catalogs.RegimenFiscal.slice(0, 5));
                    alert('Revisa la consola para ver todos los datos del cliente');
                  }}
                  className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded"
                >
                  🧪 Ver datos completos en consola
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center gap-2">
            <Select
              label="Selecciona un cliente"
              options={clients.map(client => ({
                value: String(client.UID || ''),
                label: `${client.RazonSocial || (client.Contacto?.Nombre + ' ' + client.Contacto?.Apellidos) || 'Sin nombre'} (${client.RFC || ''})`,
              }))}
              value={String(watch('customerId') || '')}
              onChange={value => {
                setValue('customerId', String(value || ''));
                handleClientSelection(String(value || ''));
              }}
              placeholder="Buscar cliente..."
              isLoading={loadingClientData}
            />
            <Button
              type="button"
              onClick={() => setShowCustomerModal(true)}
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow flex items-center justify-center text-xl w-10 h-10"
              title="Agregar cliente"
            >
              +
            </Button>
          </div>
          <div>
            <Select
              label="Selecciona una serie"
              options={series.map(s => ({
                value: String(s.id || s.ID || s.SerieID || ''),
                label: `${s.SerieName} - ${s.SerieDescription || ''}`,
              }))}
              value={String(watch('Serie') || '')}
              onChange={value => setValue('Serie', String(value || ''))}
              placeholder="Buscar serie..."
              isLoading={false}
              error={!watch('Serie')}
              helperText={!watch('Serie') ? 'Debes seleccionar una serie.' : ''}
            />
          </div>
        </div>
      </div>
      <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Datos de la Factura</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Tipo de Documento</label>
            <select
              {...register('TipoDocumento', { required: true })}
              value={watch('TipoDocumento') || 'factura'}
              onChange={e => setValue('TipoDocumento', e.target.value)}
              className="w-full border rounded-lg p-2"
            >
              <option value="factura">Factura (Ingreso)</option>
              <option value="egreso">Egreso</option>
              <option value="pago">Pago</option>
            </select>
            {!watch('TipoDocumento') && <span className="text-red-500 text-xs">Debes seleccionar el tipo de documento.</span>}
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Forma de Pago</label>
            <Controller
              name="FormaPago"
              control={control}
              rules={{ required: 'Debes seleccionar una forma de pago.' }}
              render={({ field, fieldState }) => {
                const safeValue = field.value == null ? '' : String(field.value);
                console.log('[Controller:FormaPago] value:', safeValue, 'options:', catalogs.FormaPago);
                return (
                  <Select
                    label="Forma de Pago"
                    options={catalogs.FormaPago.map((opt, idx) => ({
                      value: String(opt.key),
                      label: `${opt.key} - ${opt.name}`,
                    }))}
                    value={safeValue}
                    onChange={field.onChange}
                    placeholder="Selecciona una forma de pago"
                    isLoading={loadingCatalogs}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Método de Pago</label>
            <Controller
              name="MetodoPago"
              control={control}
              rules={{ required: 'Debes seleccionar un método de pago.' }}
              render={({ field, fieldState }) => {
                const safeValue = field.value == null ? '' : String(field.value);
                console.log('[Controller:MetodoPago] value:', safeValue, 'options:', catalogs.MetodoPago);
                return (
                  <Select
                    label="Método de Pago"
                    options={catalogs.MetodoPago.map((opt, idx) => ({
                      value: String(opt.key),
                      label: `${opt.key} - ${opt.name}`,
                    }))}
                    value={safeValue}
                    onChange={field.onChange}
                    placeholder="Selecciona un método de pago"
                    isLoading={loadingCatalogs}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Moneda</label>
            <Select
              label="Selecciona una moneda"
              options={catalogs.Moneda.map((opt, idx) => ({
                value: String(opt.key),
                label: `${opt.key} - ${opt.name}`,
              }))}
              value={String(watch('Moneda') || '')}
              onChange={value => setValue('Moneda', String(value || ''))}
              placeholder="Selecciona una moneda"
              isLoading={false}
              error={!watch('Moneda')}
              helperText={!watch('Moneda') ? 'Debes seleccionar una moneda.' : ''}
            />
          </div>
          <div>
            {/* Debug visual para UsoCFDI */}
            <div className="mb-2 text-xs text-blue-700">
              Valor actual UsoCFDI: {JSON.stringify(watch('UsoCFDI'))}<br />
              Error UsoCFDI: {errors?.UsoCFDI?.message || 'Sin error'}
            </div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Uso CFDI</label>
            <Controller
              name="UsoCFDI"
              control={control}
              rules={{ required: 'Debes seleccionar un uso CFDI.' }}
              render={({ field, fieldState }) => {
                const safeValue = field.value == null ? '' : String(field.value);
                console.log('[Controller:UsoCFDI] value:', safeValue, 'options:', catalogs.UsoCFDI);
                return (
                  <Select
                    label="Selecciona uso CFDI"
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
                    isLoading={false}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">País</label>
            <select {...register('Pais')} className="w-full border rounded-lg p-2" value={watch('Pais') || 'MEX'} onChange={e => setValue('Pais', e.target.value)}>
              {catalogs.Pais && catalogs.Pais.filter(opt => opt.key === 'MEX' && opt.name && opt.name.toLowerCase().includes('mexico')).length > 0
                ? catalogs.Pais.filter(opt => opt.key === 'MEX' && opt.name && opt.name.toLowerCase().includes('mexico')).map((opt, idx) => (
                    <option key={opt.key + '-' + idx} value={opt.key}>{opt.key} - {opt.name}</option>
                  ))
                : <option value="MEX">MEX - México</option>
              }
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Régimen Fiscal</label>
            <Controller
              name="RegimenFiscal"
              control={control}
              render={({ field, fieldState }) => {
                const safeValue = field.value == null ? '' : String(field.value);
                console.log('[Controller:RegimenFiscal] value:', safeValue, 'options:', catalogs.RegimenFiscal);
                return (
                  <Select
                    label="Régimen Fiscal"
                    options={catalogs.RegimenFiscal.map((opt, idx) => ({
                      value: String(opt.key),
                      label: `${opt.key} - ${opt.name}`,
                    }))}
                    value={safeValue}
                    onChange={field.onChange}
                    placeholder="Selecciona un régimen fiscal"
                    isLoading={loadingCatalogs}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Fecha de CFDI *</label>
            {(() => {
              const hoy = new Date();
              const maxDate = hoy.toISOString().split('T')[0];
              const minDateObj = new Date();
              minDateObj.setDate(hoy.getDate() - 3);
              const minDate = minDateObj.toISOString().split('T')[0];
              // Si no hay valor, poner el día actual
              const value = watch('dueDate') || maxDate;
              if (!watch('dueDate')) setValue('dueDate', maxDate);
              return (
                <input
                  type="date"
                  {...register('dueDate', { required: true })}
                  min={minDate}
                  max={maxDate}
                  value={value}
                  onChange={e => setValue('dueDate', e.target.value)}
                  className="w-full border rounded-lg p-2"
                />
              );
            })()}
            {!watch('dueDate') && <span className="text-red-500 text-xs">Debes seleccionar una fecha para el CFDI.</span>}
          </div>
        </div>
        {isGlobal && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h4 className="font-semibold text-yellow-700 mb-2">Datos de Factura Global</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="RFC*" placeholder="Ej: CAGS890306QG4" {...register('RFC', { required: true })} />
              <Input label="Nombre / Razón Social*" placeholder="Ej: SINAR ADRIAN CASANOVA GARCIA" {...register('RazonSocial', { required: true })} />
              <Input label="Correo*" placeholder="Ej: facturacion@sieeg.com.mx" {...register('Correo', { required: true })} />
              <Input label="Número De Pedido*" placeholder="Número De Pedido" {...register('Pedido', { required: true })} />
              <Input label="Codigo Postal*" placeholder="Ej: 29038" {...register('CodigoPostal', { required: true })} />
              <Input label="Regimen Fiscal*" placeholder="Ej: (612) - Personas Físicas con Actividades Empresariales y Profesionales" {...register('RegimenFiscal', { required: true })} />
              <Select label="C.F.D.I.*" options={catalogs.UsoCFDI.map(opt => ({ value: String(opt.key || opt.value), label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` }))} value={String(watch('CFDI') || '')} onChange={value => setValue('CFDI', String(value || ''))} placeholder="Selecciona CFDI" />
              <Select label="Forma de Pago*" options={catalogs.FormaPago.map(opt => ({ value: String(opt.key), label: `${opt.key} - ${opt.name}` }))} value={String(watch('FormaPago') || '')} onChange={value => setValue('FormaPago', String(value || ''))} placeholder="Selecciona una forma de pago" />
            </div>
          </div>
        )}
      </div>
      <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Productos / Conceptos</h3>
        {productosImportados.length > 0 ? (
          <div className="space-y-4">
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
        ) : (
          <div className="space-y-6">
            {fields.map((item, idx) => (
              <div key={item.id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Controller
                      name={`items.${idx}.ClaveProdServ`}
                      control={control}
                      rules={{ required: 'Debes seleccionar un producto o servicio.' }}
                      render={({ field, fieldState }) => (
                        <Select
                          {...field}
                          label="Producto/Servicio"
                          options={products.map((prod) => ({
                            value: prod.claveprodserv || '',
                            label: `${prod.name || 'Sin nombre'} (${prod.claveprodserv || 'Sin clave'})`,
                            sku: prod.sku || '',
                            claveunidad: prod.claveunidad || '',
                            unidad: prod.unidad || '',
                            price: prod.price || 0,
                            descripcion: prod.name || '',
                          }))}
                          placeholder="Selecciona un producto"
                          isLoading={loadingCatalogs}
                          onChange={(value) => {
                            field.onChange(value);
                            const selected = products.find(p => p.claveprodserv === value);
                            if (selected) {
                              setValue(`items.${idx}.ClaveProdServ`, selected.claveprodserv || '');
                              setValue(`items.${idx}.NoIdentificacion`, selected.sku || '');
                              setValue(`items.${idx}.ClaveUnidad`, selected.claveunidad || '');
                              setValue(`items.${idx}.Unidad`, selected.unidad || 'Pieza');
                              setValue(`items.${idx}.ValorUnitario`, selected.price || 0);
                              setValue(`items.${idx}.Descripcion`, selected.name || '');
                            } else {
                              setValue(`items.${idx}.ClaveProdServ`, '');
                              setValue(`items.${idx}.NoIdentificacion`, '');
                              setValue(`items.${idx}.ClaveUnidad`, '');
                              setValue(`items.${idx}.Unidad`, '');
                              setValue(`items.${idx}.ValorUnitario`, 0);
                              setValue(`items.${idx}.Descripcion`, '');
                            }
                          }}
                          value={field.value}
                          error={!!fieldState.error || !field.value}
                          helperText={fieldState.error?.message || (!field.value ? 'Debes seleccionar un producto.' : '')}
                        />
                      )}
                    />
                  </div>
                  <Input label="NoIdentificacion" {...register(`items.${idx}.NoIdentificacion`, { required: true })} />
                  <Input label="Cantidad" type="number" {...register(`items.${idx}.quantity`, { valueAsNumber: true, required: true })} />
                  <div>
                    <label className="block mb-1 text-sm font-medium text-gray-700">ClaveUnidad</label>
                    <select {...register(`items.${idx}.ClaveUnidad`, { required: true })} className="w-full border rounded-lg p-2">
                      <option value="">Selecciona</option>
                      {catalogs.ClaveUnidad.map((opt, cidx) => (
                        <option key={opt.key + '-' + cidx} value={opt.key}>{opt.key} - {opt.name}</option>
                      ))}
                    </select>
                    {!watch(`items.${idx}.ClaveUnidad`) && <span className="text-red-500 text-xs">Debes seleccionar una clave unidad.</span>}
                  </div>
                  <Input label="Unidad" {...register(`items.${idx}.Unidad`, { required: true })} />
                  <Input label="ValorUnitario" type="number" {...register(`items.${idx}.ValorUnitario`, { valueAsNumber: true, required: true })} />
                  <Input label="Descripcion" {...register(`items.${idx}.Descripcion`, { required: true })} />
                  <Input label="Descuento" type="number" {...register(`items.${idx}.Descuento`)} />
                  <Input label="ObjetoImp" {...register(`items.${idx}.ObjetoImp`)} />
                </div>
                <div className="flex justify-end mt-4">
                  <Button type="button" onClick={() => remove(idx)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg shadow">
                    <span>🗑️</span> Eliminar concepto
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" onClick={() => append(defaultConcepto)} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow flex items-center gap-2">
              <span>➕</span> Agregar concepto
            </Button>
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-8 flex-wrap">
        <Button 
          type="button" 
          onClick={() => {
            const currentValues = watch();
            console.log('🧪 DEBUG - Valores actuales del formulario:', currentValues);
            console.log('🧪 DEBUG - UsoCFDI actual:', currentValues.UsoCFDI);
            console.log('🧪 DEBUG - FormaPago actual:', currentValues.FormaPago);
            console.log('🧪 DEBUG - MetodoPago actual:', currentValues.MetodoPago);
            console.log('🧪 DEBUG - RegimenFiscal actual:', currentValues.RegimenFiscal);
            alert('Revisa la consola para ver los valores actuales del formulario');
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-lg shadow text-sm"
        >
          🧪 Debug Formulario
        </Button>
        
        <Button 
          type="button" 
          onClick={() => {
            const formaPago = watch('FormaPago');
            const metodoPago = watch('MetodoPago');
            console.log('💳 DEBUG ESPECÍFICO - Métodos de Pago:');
            console.log('   - FormaPago watch:', formaPago);
            console.log('   - MetodoPago watch:', metodoPago);
            console.log('   - FormaPago tipo:', typeof formaPago);
            console.log('   - MetodoPago tipo:', typeof metodoPago);
            console.log('   - FormaPago vacío?:', !formaPago);
            console.log('   - MetodoPago vacío?:', !metodoPago);
            
            // Intentar forzar valores si están vacíos
            if (!formaPago && catalogs.FormaPago.length > 0) {
              console.log('⚠️ Intentando establecer FormaPago por defecto');
              setValue('FormaPago', catalogs.FormaPago[0].key, { shouldValidate: true });
            }
            if (!metodoPago && catalogs.MetodoPago.length > 0) {
              console.log('⚠️ Intentando establecer MetodoPago por defecto');
              setValue('MetodoPago', catalogs.MetodoPago[0].key, { shouldValidate: true });
            }
            
            alert(`FormaPago: ${formaPago || 'VACÍO'}\nMetodoPago: ${metodoPago || 'VACÍO'}\n\nRevisa la consola para más detalles.`);
          }}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-lg shadow text-sm"
        >
          💳 Debug Pagos
        </Button>
        
        <Button type="submit" disabled={isSubmitting} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow text-lg">Crear CFDI</Button>
      </div>
      {emittedUID && (
        <div className="mt-10 p-8 bg-green-50 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold mb-2 text-green-700">CFDI emitido</h3>
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
                alert('Error al descargar PDF: ' + (err.response?.data?.message || err.message));
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
                alert('Error al descargar XML: ' + (err.response?.data?.message || err.message));
              }
            }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2">
              <span>🗎</span> Descargar XML
            </Button>
          </div>
          <div className="text-xs text-green-700">UID: {emittedUID}</div>
        </div>
      )}
      {errors && Object.keys(errors).length > 0 && (
        <pre className="text-red-500 mt-6">{JSON.stringify(cleanForJson(errors), null, 2)}</pre>
      )}
      <CustomerModalForm open={showCustomerModal} onClose={() => setShowCustomerModal(false)} onCreated={handleCustomerCreated} />
    </form>
  );
};

export default CFDIForm;

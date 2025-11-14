import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema } from '../../utils/validationSchemas';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';
import Select from '../common/Select/Select';
import CustomerModalForm from './CustomerModalForm';
import ProductModalForm from './ProductModalForm';

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
  const [shippingInfo, setShippingInfo] = useState(null);
  const [orderTotals, setOrderTotals] = useState(null);
  // Helper para actualizar el estado del pedido en WooCommerce
  const updateOrderStatus = async (orderId, status = 'invoiced') => {
    if (!orderId) return;
    try {
      const updateUrl = `${WOOCOMMERCE_URL}/wp-json/wc/v3/orders/${orderId}`;
      const basicAuth = 'Basic ' + btoa(`${WOOCOMMERCE_CONSUMER_KEY}:${WOOCOMMERCE_CONSUMER_SECRET}`);
      console.log('🟡 Actualizando estado del pedido en WooCommerce:', { orderId, status, auth: '[Basic ***masked***]' });
      const res = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': basicAuth
        },
        body: JSON.stringify({ status })
      });
      const responseText = await res.text();
      console.log('🟢 Respuesta de WooCommerce al actualizar pedido:', responseText);
      if (res.ok) {
        console.log(`✅ Pedido #${orderId} actualizado a '${status}'`);
      } else {
        console.error(`❌ Error actualizando pedido #${orderId}:`, responseText);
      }
    } catch (err) {
      console.error(`❌ Error en fetch al actualizar pedido #${orderId}:`, err);
    }
  };
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
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
      NumeroPedido: '', // Nuevo campo para el número de pedido
      items: [],
    },
    resolver: zodResolver(invoiceSchema),
    shouldUnregister: false, // <-- Mantener valores de los selects aunque se desmonten
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  // 🔥 NUEVA FUNCIONALIDAD: Recalcular impuestos automáticamente cuando cambien cantidad o precio
  const recalcularImpuestosItem = (index, valorUnitario, cantidad, tipoImpuesto = 'con_iva') => {
    const impuestosRecalculados = calcularImpuestos(valorUnitario, cantidad, tipoImpuesto);
    setValue(`items.${index}.Impuestos`, impuestosRecalculados, {
      shouldValidate: true,
      shouldDirty: true
    });
    console.log(`🔄 Impuestos recalculados para item ${index} (${tipoImpuesto}):`, impuestosRecalculados);
  };

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
    // Serie - CORREGIDO: usar ID en lugar de SerieName y registrar con Controller
    if (series.length > 0 && !watch('Serie')) {
      // Buscar la serie de tipo 'factura' por defecto
      const serieFactura = series.find(s => s.SerieType === 'factura') || series[0];
      const serieID = serieFactura.SerieID || serieFactura.id || serieFactura.ID || '';
      setValue('Serie', String(serieID), { 
        shouldValidate: true, 
        shouldDirty: true, 
        shouldTouch: true 
      });
      console.log('🔧 Serie inicial auto-configurada:', serieID, 'para serie:', serieFactura);
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
    // 🔍 DEBUG INICIAL: Verificar todos los valores del formulario
    console.log('🔥 === INICIO onSubmit DEBUG ===');
    console.log('📋 dataRaw completo:', JSON.stringify(dataRaw, null, 2));
    console.log('📋 dataRaw.Serie específicamente:', dataRaw.Serie);
    console.log('📋 watch("Serie") para comparar:', watch('Serie'));
    console.log('📋 Tipo de dataRaw.Serie:', typeof dataRaw.Serie);
    
    // 🔍 DEBUG ESPECÍFICO: NumeroPedido
    console.log('🔥 === DEBUG NÚMERO DE PEDIDO ===');
    console.log('📋 dataRaw.NumeroPedido:', dataRaw.NumeroPedido);
    console.log('📋 watch("NumeroPedido"):', watch('NumeroPedido'));
    console.log('📋 Tipo de dataRaw.NumeroPedido:', typeof dataRaw.NumeroPedido);
    console.log('📋 NumeroPedido está vacío?:', !dataRaw.NumeroPedido);
    console.log('📋 NumeroPedido length:', String(dataRaw.NumeroPedido || '').length);
    
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
    console.log('🚀 FormaPago específico:', data.FormaPago);
    console.log('🚀 MetodoPago específico:', data.MetodoPago);
    console.log('🚀 RegimenFiscal específico:', data.RegimenFiscal);
    // Mapear los campos del formulario a los nombres esperados por la API
    const items = data.items.map((item, index) => {
      const itemMapeado = {
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
      };
      
      // 🔥 DEBUG: Log detallado de cada item y sus impuestos
      console.log(`📊 Item ${index + 1} - ${itemMapeado.Descripcion}:`);
      console.log('   - Cantidad:', itemMapeado.Cantidad);
      console.log('   - ValorUnitario:', itemMapeado.ValorUnitario);
      console.log('   - Base calculada:', itemMapeado.Cantidad * itemMapeado.ValorUnitario);
      console.log('   - Impuestos:', JSON.stringify(itemMapeado.Impuestos, null, 2));
      
      if (itemMapeado.Impuestos.Traslados && itemMapeado.Impuestos.Traslados.length > 0) {
        itemMapeado.Impuestos.Traslados.forEach((traslado, tIdx) => {
          console.log(`      Traslado ${tIdx + 1}:`, traslado);
        });
      }
      
      return itemMapeado;
    });
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
    
    // 🔍 DEBUG: Analizar valor de Serie seleccionada
    console.log('🔍 DEBUG Serie - data.Serie del formulario:', data.Serie);
    console.log('🔍 DEBUG Serie - series array:', series);
    console.log('🔍 DEBUG Serie - watch("Serie"):', watch('Serie'));
    
    // 🔧 SOLUCION: Si data.Serie está vacío, usar el valor del watch
    const serieValue = data.Serie || watch('Serie');
    console.log('🔧 SOLUCION Serie - serieValue final a usar:', serieValue);
    
    // Encontrar la serie seleccionada por ID
    let serieSeleccionada = null;
    if (serieValue) {
      serieSeleccionada = series.find(s => 
        String(s.SerieID || s.id || s.ID) === String(serieValue)
      );
      console.log('🔍 DEBUG Serie - serieSeleccionada encontrada:', serieSeleccionada);
    }
    
    // Si no se encuentra, usar la serie de tipo 'factura' como fallback
    if (!serieSeleccionada && series.length > 0) {
      serieSeleccionada = series.find(s => s.SerieType === 'factura') || series[0];
      console.log('⚠️ FALLBACK: Usando serie de factura disponible:', serieSeleccionada);
    }
    
    const serieID = serieSeleccionada ? (serieSeleccionada.SerieID || serieSeleccionada.id || serieSeleccionada.ID) : undefined;
    console.log('📤 Serie ID que se enviará a la API:', serieID);
    
    const cfdiData = {
      Receptor: {
        UID: String(data.customerId || '').trim(),
      },
      TipoDocumento: data.TipoDocumento || 'factura',
      Serie: Number(serieID),
      FormaPago: String(formaPagoFinal).trim(), // <-- Usar el valor final corregido
      MetodoPago: String(metodoPagoFinal).trim(), // <-- Usar el valor final corregido
      Moneda: data.Moneda || 'MXN',
      UsoCFDI: String(usoCFDIValue).trim(), // <-- Asegurar que sea string y sin espacios
      Conceptos: items,
      BorradorSiFalla: String(data.BorradorSiFalla || '0'),
      Draft: String(data.Draft || '0'),
      dueDate: fechaCFDI,
      NumOrder: String(data.NumeroPedido || '').trim(), // 🔥 NUEVO: Número de pedido/orden para el PDF
    };
    
    console.log('📤 Objeto final enviado a la API:', cfdiData);
    console.log('📤 UsoCFDI que se envía:', cfdiData.UsoCFDI);
    console.log('📤 Serie que se envía:', cfdiData.Serie);
    console.log('📤 Serie seleccionada completa:', serieSeleccionada);
    console.log('📤 NumOrder (Número de Pedido) que se envía:', cfdiData.NumOrder);
    
    // 🔥 DEBUG ADICIONAL: Verificar construcción del NumOrder
    console.log('🔍 === DEBUG CONSTRUCCIÓN NUMORDER ===');
    console.log('📋 data.NumeroPedido antes de procesar:', data.NumeroPedido);
    console.log('📋 String(data.NumeroPedido || ""):', String(data.NumeroPedido || ''));
    console.log('📋 String(data.NumeroPedido || "").trim():', String(data.NumeroPedido || '').trim());
    console.log('📋 cfdiData.NumOrder final:', cfdiData.NumOrder);
    console.log('📋 cfdiData.NumOrder length:', cfdiData.NumOrder.length);
    console.log('📋 cfdiData.NumOrder está vacío?:', !cfdiData.NumOrder || cfdiData.NumOrder.trim() === '');
    
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

      // 🔥 ACTUALIZAR ESTADO DEL PEDIDO EN WOOCOMMERCE SI SE FACTURÓ UN PEDIDO
      if (cfdiData.NumOrder && cfdiData.NumOrder.trim() !== '') {
        const orderId = cfdiData.NumOrder.trim();
        await updateOrderStatus(orderId, 'invoiced');
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // 🔥 NUEVA FUNCIÓN: Calcular impuestos automáticamente
  const calcularImpuestos = (valorUnitario, cantidad, tipoImpuesto = 'con_iva') => {
    const base = Number(valorUnitario) * Number(cantidad);
    const baseFormatted = base.toFixed(6);
    
    let impuestos = {
      Traslados: [],
      Retenidos: [],
      Locales: []
    };
    
    switch (tipoImpuesto) {
      case 'con_iva':
        // IVA 16% (impuesto 002)
        const importeIVA = base * 0.16;
        impuestos.Traslados.push({
          Base: baseFormatted,
          Impuesto: "002", // IVA
          TipoFactor: "Tasa",
          TasaOCuota: "0.160000",
          Importe: importeIVA.toFixed(6)
        });
        break;
        
      case 'exento':
        // IVA Exento
        impuestos.Traslados.push({
          Base: baseFormatted,
          Impuesto: "002", // IVA
          TipoFactor: "Exento",
          TasaOCuota: "0.000000",
          Importe: "0.000000"
        });
        break;
        
      case 'sin_iva':
        // Sin impuestos (array vacío pero estructura presente)
        break;
        
      default:
        // Por defecto IVA 16%
        const importeIVADefault = base * 0.16;
        impuestos.Traslados.push({
          Base: baseFormatted,
          Impuesto: "002",
          TipoFactor: "Tasa", 
          TasaOCuota: "0.160000",
          Importe: importeIVADefault.toFixed(6)
        });
    }
    
    return impuestos;
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
        
        console.log('🔍 Mapeando payment_method en CFDIForm:', wooPaymentMethod);
        
        // Buscar mapeo exacto primero (case-sensitive)
        if (mapeos[wooPaymentMethod]) {
          console.log('✅ Mapeo exacto encontrado en CFDIForm:', mapeos[wooPaymentMethod]);
          return mapeos[wooPaymentMethod];
        }
        
        // Si no encuentra mapeo exacto, intentar mapeo por patrones
        const metodoBajo = wooPaymentMethod.toLowerCase();
        console.log('🔍 Intentando mapeo por patrones en CFDIForm para:', metodoBajo);
        
        // ⚠️ ORDEN IMPORTANTE: Verificar específicos antes que genéricos
        if (metodoBajo.includes('paypal')) {
          console.log('✅ Mapeo por patrón en CFDIForm: paypal → FormaPago: 04');
          return { FormaPago: '04', MetodoPago: 'PUE' };
        }
        if (metodoBajo.includes('debito') || metodoBajo.includes('debit')) {
          console.log('✅ Mapeo por patrón en CFDIForm: débito → FormaPago: 28');
          return { FormaPago: '28', MetodoPago: 'PUE' };
        }
        if (metodoBajo.includes('credito') || metodoBajo.includes('credit')) {
          console.log('✅ Mapeo por patrón en CFDIForm: crédito → FormaPago: 04');
          return { FormaPago: '04', MetodoPago: 'PUE' };
        }
        // Solo "tarjeta" genérica después de verificar débito/crédito específicos
        if (metodoBajo.includes('tarjeta')) {
          console.log('✅ Mapeo por patrón en CFDIForm: tarjeta genérica → FormaPago: 04');
          return { FormaPago: '04', MetodoPago: 'PUE' };
        }
        if (metodoBajo.includes('stripe') || metodoBajo.includes('card')) {
          console.log('✅ Mapeo por patrón en CFDIForm: stripe/card → FormaPago: 04');
          return { FormaPago: '04', MetodoPago: 'PUE' };
        }
        if (metodoBajo.includes('transfer') || metodoBajo.includes('spei') || metodoBajo.includes('bancari')) {
          console.log('✅ Mapeo por patrón en CFDIForm: transferencia → FormaPago: 03');
          return { FormaPago: '03', MetodoPago: 'PUE' };
        }
        if (metodoBajo.includes('oxxo') || metodoBajo.includes('cash') || metodoBajo.includes('efectivo')) {
          console.log('✅ Mapeo por patrón en CFDIForm: efectivo → FormaPago: 01');
          return { FormaPago: '01', MetodoPago: 'PUE' };
        }
        if (metodoBajo.includes('cheque')) {
          console.log('✅ Mapeo por patrón en CFDIForm: cheque → FormaPago: 02');
          return { FormaPago: '02', MetodoPago: 'PUE' };
        }
        
        console.log('⚠️ No se encontró mapeo específico en CFDIForm, usando valores por defecto');
        return { FormaPago: '99', MetodoPago: 'PUE' }; // Por defecto: Otros
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
          // 🔥 CALCULAR IMPUESTOS AUTOMÁTICAMENTE
          const valorUnitario = Number(prod.price || prod.total || 0);
          const cantidad = Number(prod.quantity || 1);
          const impuestosCalculados = calcularImpuestos(valorUnitario, cantidad, 'con_iva');
          
          console.log(`📊 Impuestos calculados para ${prod.name}:`, impuestosCalculados);
          
          return {
            ClaveProdServ: claveProdServ,
            NoIdentificacion: prod.sku || '',
            Cantidad: cantidad,
            ClaveUnidad: claveUnidad,
            Unidad: unidad,
            ValorUnitario: valorUnitario,
            Descripcion: descripcionFinal,
            Descuento: '0',
            ObjetoImp: '02', // Sí objeto de impuestos
            Impuestos: impuestosCalculados, // 🔥 USAR IMPUESTOS CALCULADOS
          };
        }));
        // --- DETECCIÓN Y AGREGADO DEL ENVÍO COMO CONCEPTO ---
        try {
          const shippingTotal = Number(order.shipping_total || 0);
          const shippingTax = Number(order.shipping_tax || 0) || Number(order.shipping_lines?.[0]?.total_tax || 0);
          if ((order.shipping_lines && order.shipping_lines.length > 0) || shippingTotal > 0) {
            const shippingLine = order.shipping_lines?.[0] || null;
            const shippingDescription = shippingLine?.method_title || 'Gasto de envío';
            const tasa = shippingTotal > 0 ? (shippingTax / shippingTotal) : 0;
            const shippingConcept = {
              ClaveProdServ: '78121600',
              NoIdentificacion: '',
              Cantidad: 1,
              ClaveUnidad: 'H87',
              Unidad: 'Servicio',
              ValorUnitario: Number(shippingTotal),
              Descripcion: shippingDescription,
              Descuento: '0',
              ObjetoImp: shippingTax > 0 ? '02' : '01',
              Impuestos: {
                Traslados: shippingTax > 0 && shippingTotal > 0 ? (() => {
                  const baseStr = Number(shippingTotal).toFixed(6);
                  const tasaStr = "0.160000"; // Asumimos IVA 16% para envíos
                  const importeCalc = (Number(shippingTotal) * Number(tasaStr)).toFixed(6);
                  return [{
                    Base: baseStr,
                    Impuesto: "002",
                    TipoFactor: "Tasa",
                    TasaOCuota: tasaStr,
                    Importe: importeCalc
                  }];
                })() : [],
                Retenidos: [],
                Locales: []
              }
            };
            console.log('🚚 Envío detectado en pedido (CFDIForm). Agregando concepto de envío:', { shippingTotal, shippingTax, shippingLine });
            conceptos.push(shippingConcept);
            setShippingInfo({ total: shippingTotal, tax: shippingTax, method: shippingDescription, line: shippingLine });
          } else {
            setShippingInfo(null);
          }
        } catch (err) {
          console.error('Error al procesar shipping del pedido (CFDIForm):', err);
        }

        setProductosImportados(order.line_items.map(prod => ({
          ...prod,
          Cantidad: prod.quantity || 1 
        })));
        setValue('items', conceptos);

        // Calcular totales del pedido
        try {
          const subtotalItems = order.line_items.reduce((s, it) => s + (Number(it.total) || (Number(it.price) * Number(it.quantity)) || 0), 0);
          const itemsTaxSum = order.line_items.reduce((s, it) => s + (Number(it.total_tax) || 0), 0);
          const shippingTotal = Number(order.shipping_total || 0);
          const shippingTax = Number(order.shipping_tax || 0) || Number(order.shipping_lines?.[0]?.total_tax || 0);
          const total = Number(order.total || subtotalItems + shippingTotal + itemsTaxSum + shippingTax);
          setOrderTotals({ subtotalItems, itemsTaxSum, shippingTotal, shippingTax, total });
        } catch (err) {
          console.error('Error calculando totales del pedido (CFDIForm):', err);
          setOrderTotals(null);
        }
        
        // 🔥 NUEVO: Guardar el número de pedido automáticamente
        setValue('NumeroPedido', String(pedidoInput), { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
        console.log('✅ Número de pedido guardado:', pedidoInput);
        
        // 🔍 Verificación inmediata
        setTimeout(() => {
          const valorVerificado = watch('NumeroPedido');
          console.log('🔍 Verificación NumeroPedido después de setValue:', valorVerificado);
        }, 100);
        
        // Notificar al usuario sobre el auto-rellenado del método de pago
        if (pagoMapeado.FormaPago !== '99') {
          setTimeout(() => {
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

  // Refrescar productos después de crear uno nuevo desde el modal
  const fetchProducts = async () => {
    try {
      const res = await FacturaAPIService.listProducts({ per_page: 100 });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Error cargando productos:', err);
    }
  };

  const handleProductCreated = async () => {
    await fetchProducts();
    setShowProductModal(false);
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

  const handleAddProductManual = (producto) => {
    // Calcular impuestos automáticamente al agregar producto manual
    const impuestos = calcularImpuestos(producto.ValorUnitario, producto.Cantidad, 'con_iva');
    const concepto = {
      ...producto,
      Impuestos: impuestos,
      ObjetoImp: '02', // Asegurar que sea objeto de impuesto
    };
    append(concepto);
    console.log('✅ Producto manual agregado con impuestos:', concepto);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-6xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
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
          
        </div>
      )}
      <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow">

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
            <Controller
              name="Serie"
              control={control}
              rules={{ required: 'Debes seleccionar una serie.' }}
              render={({ field, fieldState }) => {
                const safeValue = field.value == null ? '' : String(field.value);
                console.log('[Controller:Serie] value:', safeValue, 'options:', series.length, 'series');
                return (
                  <Select
                    label="Selecciona una serie"
                    options={series.map(s => ({
                      value: String(s.SerieID || s.id || s.ID || ''),
                      label: `${s.SerieName} - ${s.SerieDescription || ''}`,
                    }))}
                    value={safeValue}
                    onChange={(value) => {
                      console.log('[Controller:Serie] onChange value:', value);
                      field.onChange(value);
                    }}
                    placeholder="Buscar serie..."
                    isLoading={false}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                );
              }}
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
                    onChange={(value) => {
                      field.onChange(value);
                      
                      // 🔥 NUEVA FUNCIONALIDAD: Si selecciona PPD, cambiar FormaPago a 99
                      if (value === 'PPD') {
                        console.log('🎯 MetodoPago PPD seleccionado, cambiando FormaPago a 99 - Por definir');
                        setValue('FormaPago', '99', { 
                          shouldValidate: true, 
                          shouldDirty: true, 
                          shouldTouch: true 
                        });
                      }
                    }}
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
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Número de Pedido</label>
            <Controller
              name="NumeroPedido"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <input
                  type="text"
                  placeholder="Ej: 12345 (opcional)"
                  value={field.value || ''}
                  onChange={field.onChange}
                  className="w-full border rounded-lg p-2"
                />
              )}
            />
            <span className="text-xs text-gray-500">Se auto-rellena al importar un pedido. Aparecerá en el PDF.</span>
            {/* DEBUG: Mostrar valor actual */}
            <div className="text-xs text-blue-500 mt-1">
              Debug - Valor actual: "{watch('NumeroPedido') || 'vacío'}"
            </div>
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
        <div className="w-full overflow-x-auto">
          <div className="border border-gray-200 rounded-lg" style={{ minWidth: '1200px', maxWidth: '100%' }}>
            {/* Header horizontal alineado */}
            <div className="bg-gray-100 border-b border-gray-200 grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-2 px-3 py-3 font-semibold text-gray-800 uppercase tracking-wide text-center text-[15px]">
              <div className="text-left">Producto</div>
              <div>Cant.</div>
              <div>Precio</div>
              <div>IVA</div>
              <div>Tipo</div>
              <div>Desc.</div>
              <div>Unidad</div>
              <div>Clave Unidad</div>
            </div>
            {/* Fila de inputs para agregar/editar producto (siempre visible arriba) */}
            <div className="grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-2 px-3 py-3 items-center bg-white border-b border-gray-100 text-[15px]">
              {/* Producto/Servicio */}
              <Controller
                name="nuevoProducto.ClaveProdServ"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <select
                    className="border rounded px-2 py-1 text-[15px] w-full"
                    style={{ whiteSpace: 'normal' }}
                    value={field.value || ''}
                    onChange={e => {
                      const clave = e.target.value;
                      field.onChange(clave);
                      // Buscar producto seleccionado
                      const prod = products.find(p => p.claveprodserv === clave);
                      if (prod) {
                        setValue('nuevoProducto.Descripcion', prod.name || '');
                        setValue('nuevoProducto.ValorUnitario', prod.price || '');
                        setValue('nuevoProducto.Unidad', prod.unidad || 'Pieza');
                        setValue('nuevoProducto.ClaveUnidad', prod.claveunidad || 'H87');
                        setValue('nuevoProducto.NoIdentificacion', prod.sku || '');
                        setValue('nuevoProducto.Cantidad', 1);
                        setValue('nuevoProducto.Descuento', '0');
                        setValue('nuevoProducto.TipoImpuesto', 'con_iva');
                        // Recalcular impuestos y actualizar el campo
                        const impuestos = calcularImpuestos(prod.price || 0, 1, 'con_iva');
                        setValue('nuevoProducto.Impuestos', impuestos);
                      }
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {products.map((prod) => (
                      <option key={prod.claveprodserv} value={prod.claveprodserv || ''} title={prod.name || 'Sin nombre'}>
                        {prod.name || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                )}
              />
              {/* Cantidad */}
              <Controller
                name="nuevoProducto.Cantidad"
                control={control}
                defaultValue={1}
                render={({ field }) => (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 text-[15px] w-full text-center"
                    placeholder="1"
                    min="1"
                    step="1"
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e.target.value);
                      const impuestos = calcularImpuestos(watch('nuevoProducto.ValorUnitario'), e.target.value, watch('nuevoProducto.TipoImpuesto'));
                      setValue('nuevoProducto.Impuestos', impuestos);
                    }}
                  />
                )}
              />
              {/* Precio */}
              <Controller
                name="nuevoProducto.ValorUnitario"
                control={control}
                defaultValue={''}
                render={({ field }) => (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 text-[15px] w-full text-center"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    value={field.value || ''}
                    onChange={e => {
                      field.onChange(e.target.value);
                      const impuestos = calcularImpuestos(e.target.value, watch('nuevoProducto.Cantidad'), watch('nuevoProducto.TipoImpuesto'));
                      setValue('nuevoProducto.Impuestos', impuestos);
                    }}
                  />
                )}
              />
              {/* IVA en la fila de alta (nuevoProducto) */}
              <div className="text-center text-green-600 font-medium">
                ${
                  watch('nuevoProducto.Impuestos') && watch('nuevoProducto.Impuestos').Traslados && watch('nuevoProducto.Impuestos').Traslados.length > 0
                    ? watch('nuevoProducto.Impuestos').Traslados[0].Importe
                    : '0.00'
                }
              </div>
              {/* Tipo */}
              <Controller
                name="nuevoProducto.TipoImpuesto"
                control={control}
                defaultValue="con_iva"
                render={({ field }) => (
                  <select
                    className="border rounded px-2 py-1 text-[15px] w-full"
                    value={field.value || 'con_iva'}
                    onChange={e => {
                      field.onChange(e.target.value);
                      const impuestos = calcularImpuestos(watch('nuevoProducto.ValorUnitario'), watch('nuevoProducto.Cantidad'), e.target.value);
                      setValue('nuevoProducto.Impuestos', impuestos);
                    }}
                  >
                    <option value="con_iva">16%</option>
                    <option value="exento">Exento</option>
                    <option value="sin_iva">Sin IVA</option>
                  </select>
                )}
              />
              {/* Desc. */}
              <Controller
                name="nuevoProducto.Descuento"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <input
                    type="number"
                    className="border rounded px-2 py-1 text-[15px] w-full text-center"
                    placeholder="0"
                    min="0"
                    step="0.01"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {/* Unidad */}
              <Controller
                name="nuevoProducto.Unidad"
                control={control}
                defaultValue={''}
                render={({ field }) => (
                  <input
                    type="text"
                    className="border rounded px-2 py-1 text-[15px] w-full"
                    style={{ whiteSpace: 'normal' }}
                    placeholder="Pieza"
                    value={field.value || ''}
                    onChange={field.onChange}
                  />
                )}
              />
              {/* Clave Unidad */}
              <Controller
                name="nuevoProducto.ClaveUnidad"
                control={control}
                defaultValue={''}
                render={({ field }) => (
                  <select
                    className="border rounded px-2 py-1 text-[15px] w-full"
                    style={{ whiteSpace: 'normal' }}
                    value={field.value || ''}
                    onChange={field.onChange}
                  >
                    <option value="">Clave...</option>
                    {catalogs.ClaveUnidad.map((opt, cidx) => (
                      <option key={opt.key + '-' + cidx} value={opt.key}>{opt.key}</option>
                    ))}
                  </select>
                )}
              />
            </div>
            {/* Filas de la tabla existentes */}
            {fields.length > 0 && fields.map((item, idx) => (
              <div key={item.id} className={`grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-2 px-3 py-3 items-center ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100 text-[15px]`}>
                <div className="font-bold text-left" style={{ whiteSpace: 'normal' }}>{item.Descripcion || 'Sin nombre'}</div>
                <div className="text-center">{item.Cantidad}</div>
                <div className="text-center">${item.ValorUnitario}</div>
                <div className="text-center text-green-600 font-bold">${item.Impuestos && item.Impuestos.Traslados && item.Impuestos.Traslados.length > 0 ? item.Impuestos.Traslados[0].Importe : '0.00'}</div>
                <div className="text-center">{item.TipoImpuesto || '16%'}</div>
                <div className="text-center">{item.Descuento || 0}</div>
                <div className="text-center font-bold" style={{ whiteSpace: 'normal' }}>{item.Unidad || ''}</div>
                <div className="text-center font-bold" style={{ whiteSpace: 'normal' }}>{item.ClaveUnidad || ''}</div>
              </div>
            ))}
            {/* Fila de envío si aplica */}
            {shippingInfo && (
              <div className={`grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1fr_1.5fr_1.5fr] gap-2 px-3 py-3 items-center bg-white border-b border-gray-100 text-[15px]`}>
                <div className="font-bold text-left">🚚 {shippingInfo.method || 'Envío'}</div>
                <div className="text-center">1</div>
                <div className="text-center">${(Number(shippingInfo.total) || 0).toFixed(2)}</div>
                <div className="text-center text-green-600 font-bold">${(Number(shippingInfo.tax) || 0).toFixed(2)}</div>
                <div className="text-center">—</div>
                <div className="text-center">0</div>
                <div className="text-center font-bold">Servicio</div>
                <div className="text-center font-bold">H87</div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Totales resumen */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
        <div className="flex flex-col md:flex-row md:justify-end gap-2">
          <div className="flex justify-between w-full md:w-96">
            <div className="text-gray-600">Subtotal:</div>
            <div className="font-mono">${orderTotals ? orderTotals.subtotalItems.toFixed(2) : '0.00'}</div>
          </div>
          <div className="flex justify-between w-full md:w-96">
            <div className="text-gray-600">Envío:</div>
            <div className="font-mono">${orderTotals ? orderTotals.shippingTotal.toFixed(2) : (shippingInfo ? (Number(shippingInfo.total)||0).toFixed(2) : '0.00')}</div>
          </div>
          <div className="flex justify-between w-full md:w-96">
            <div className="text-gray-600">IVA:</div>
            <div className="font-mono">${orderTotals ? ((orderTotals.itemsTaxSum || 0) + (orderTotals.shippingTax || 0)).toFixed(2) : (shippingInfo ? (Number(shippingInfo.tax)||0).toFixed(2) : '0.00')}</div>
          </div>
          <div className="flex justify-between w-full md:w-96 font-bold">
            <div className="text-gray-800">Total:</div>
            <div className="font-mono">${orderTotals ? Number(orderTotals.total).toFixed(2) : '0.00'}</div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-8 flex-wrap">

        

        
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
      <ProductModalForm open={showProductModal} onClose={() => setShowProductModal(false)} onCreated={handleProductCreated} />
    </form>
  );
};

export default CFDIForm;

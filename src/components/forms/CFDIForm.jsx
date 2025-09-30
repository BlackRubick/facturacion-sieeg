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
    // Método de Pago: seleccionar PPD
    if (catalogs.MetodoPago.length > 0) {
      const metodoPPD = catalogs.MetodoPago.find(m => m.key === 'PPD' || m.name?.toUpperCase().includes('PPD'));
      if (metodoPPD && watch('MetodoPago') !== metodoPPD.key) {
        setValue('MetodoPago', metodoPPD.key);
      }
    }
    // Forma de Pago: seleccionar 99
    if (catalogs.FormaPago.length > 0) {
      const forma99 = catalogs.FormaPago.find(f => f.key === '99');
      if (forma99 && watch('FormaPago') !== forma99.key) {
        setValue('FormaPago', forma99.key);
      }
    }
  }, [series, catalogs.Moneda, catalogs.UsoCFDI, catalogs.Pais, catalogs.MetodoPago, catalogs.FormaPago]);

  const onSubmit = async (data) => {
    // Forzar sincronización de campos obligatorios usando watch
    const tipoDocumento = watch('TipoDocumento') || 'factura';
    const moneda = watch('Moneda') || 'MXN';
    const formaPago = watch('FormaPago') || '';
    const metodoPago = watch('MetodoPago') || '';
    const serieId = Number(watch('Serie')) || (series[0]?.id || series[0]?.ID || series[0]?.SerieID || undefined);
    // Usar el valor seleccionado por el usuario para UsoCFDI
    let usoCFDI = watch('UsoCFDI') || '';
    if (!usoCFDI && Array.isArray(catalogs.UsoCFDI) && catalogs.UsoCFDI.length > 0) {
      usoCFDI = catalogs.UusoCFDI[0].key || catalogs.UsoCFDI[0].value || '';
      setValue('UsoCFDI', usoCFDI);
    }
    // Mostrar en consola los valores antes de enviar
    console.log('Valores del formulario (forzados):', data);
    // Mapear los campos del formulario a los nombres esperados por la API
    const items = data.items.map(item => ({
      ClaveProdServ: String(item.ClaveProdServ || '').trim(),
      NoIdentificacion: String(item.NoIdentificacion || '').trim(),
      Cantidad: item.Cantidad ? Number(item.Cantidad) : 1, // <-- Usar Cantidad
      ClaveUnidad: String(item.ClaveUnidad || '').trim(),
      Unidad: String(item.Unidad || 'Pieza').trim(),
      ValorUnitario: item.ValorUnitario ? Number(item.ValorUnitario) : 0,
      Descripcion: String(item.Descripcion || '').trim(),
      Descuento: item.Descuento !== undefined ? String(item.Descuento) : '0',
      ObjetoImp: String(item.ObjetoImp || '02').trim(),
      Impuestos: item.Impuestos || { Traslados: [], Retenidos: [], Locales: [] },
    }));
    const formattedDueDate = data.dueDate ? new Date(data.dueDate).toISOString().split('T')[0] : undefined;
    const cfdiData = {
      Receptor: {
        UID: String(data.customerId || '').trim(),
      },
      TipoDocumento: tipoDocumento,
      Serie: serieId,
      FormaPago: formaPago,
      MetodoPago: metodoPago,
      Moneda: moneda,
      UsoCFDI: usoCFDI,
      Conceptos: items,
      BorradorSiFalla: String(data.BorradorSiFalla || '0'),
      Draft: String(data.Draft || '0'),
      dueDate: formattedDueDate,
    };
    console.log('Objeto enviado a la API:', cfdiData);
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
            Cantidad: prod.quantity || 1, // <-- Usar Cantidad para el formulario y la factura
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
          Cantidad: prod.quantity || 1 // <-- Agregar Cantidad para mostrar correctamente
        })));
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Generar CFDI 4.0</h2>
        <Button type="button" onClick={() => setShowImportPedido(v => !v)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg shadow">
          importar pedido
        </Button>
      </div>
      {showImportPedido && (
        <div className="mb-8 p-4 bg-blue-50 rounded-lg flex flex-col md:flex-row gap-4 items-center">
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
      )}
      <div className="mb-8 p-6 bg-gray-50 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Datos del Cliente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="flex items-center gap-2">
            <label className="block mb-1 text-sm font-medium text-gray-700">UID Cliente</label>
            <Select
              label="Selecciona un cliente"
              options={clients.map(client => ({
                value: client.UID || '',
                label: `${client.RazonSocial || (client.Contacto?.Nombre + ' ' + client.Contacto?.Apellidos) || 'Sin nombre'} (${client.RFC || ''})`,
              }))}
              value={watch('customerId')}
              onChange={value => setValue('customerId', value)}
              placeholder="Buscar cliente..."
              isLoading={false}
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
            <label className="block mb-1 text-sm font-medium text-gray-700">Serie</label>
            <Select
              label="Selecciona una serie"
              options={series.map(s => ({
                value: s.id || s.ID || s.SerieID || '',
                label: `${s.SerieName} - ${s.SerieDescription || ''}`,
              }))}
              value={watch('Serie')}
              onChange={value => setValue('Serie', value || '')}
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
            <select {...register('FormaPago')} className="w-full border rounded-lg p-2">
              <option value="">Selecciona</option>
              {catalogs.FormaPago.map((opt, idx) => (
                <option key={opt.key + '-' + idx} value={opt.key}>{opt.key} - {opt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Método de Pago</label>
            <select {...register('MetodoPago')} className="w-full border rounded-lg p-2">
              <option value="">Selecciona</option>
              {catalogs.MetodoPago.map((opt, idx) => (
                <option key={opt.key + '-' + idx} value={opt.key}>{opt.key} - {opt.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Moneda</label>
            <Select
              label="Selecciona una moneda"
              options={catalogs.Moneda.map((opt, idx) => ({
                value: opt.key,
                label: `${opt.key} - ${opt.name}`,
              }))}
              value={watch('Moneda')}
              onChange={value => setValue('Moneda', value || '')}
              placeholder="Selecciona una moneda"
              isLoading={false}
              error={!watch('Moneda')}
              helperText={!watch('Moneda') ? 'Debes seleccionar una moneda.' : ''}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Uso CFDI</label>
            <Select
              label="Selecciona uso CFDI"
              options={Array.isArray(catalogs.UsoCFDI) ? catalogs.UsoCFDI.map((opt, idx) => ({
                value: opt.key || opt.value,
                label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}`,
              })) : []}
              value={watch('UsoCFDI')}
              onChange={value => setValue('UsoCFDI', value || '')}
              placeholder="Selecciona uso CFDI"
              isLoading={false}
              error={!watch('UsoCFDI')}
              helperText={!watch('UsoCFDI') ? 'Debes seleccionar un uso CFDI.' : ''}
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
            <select {...register('RegimenFiscal')} className="w-full border rounded-lg p-2">
              <option value="">Selecciona</option>
              {catalogs.RegimenFiscal && catalogs.RegimenFiscal.map((opt, idx) => {
                  return (
                      <option key={opt.key + '-' + idx} value={opt.key}>{opt.key} - {opt.name}</option>
                  );
              })}
            </select>
          </div>
          <div>
            <Input label="Fecha de Vencimiento" type="date" {...register('dueDate', { valueAsDate: true })} className="w-full" />
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
              <Select label="C.F.D.I.*" options={catalogs.UsoCFDI.map(opt => ({ value: opt.key || opt.value, label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` }))} value={watch('CFDI')} onChange={value => setValue('CFDI', value)} placeholder="Selecciona CFDI" />
              <Select label="Forma de Pago*" options={catalogs.FormaPago.map(opt => ({ value: opt.key, label: `${opt.key} - ${opt.name}` }))} value={watch('FormaPago')} onChange={value => setValue('FormaPago', value)} placeholder="Selecciona una forma de pago" />
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
      <div className="flex gap-4 mt-8">
        <Button type="submit" disabled={isSubmitting} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg shadow text-lg">Crear CFDI</Button>
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
      <CustomerModalForm open={showCustomerModal} onClose={() => setShowCustomerModal(false)} />
    </form>
  );
};

export default CFDIForm;

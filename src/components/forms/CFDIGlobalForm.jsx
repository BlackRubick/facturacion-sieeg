import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../common/Button/Button';
import Input from '../common/Input/Input';

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

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
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
    try {
      const res = await FacturaAPIService.getClientByRFC(rfc);
      const data = res.data;
      if (data.status === 'success' && data.Data) {
        setClienteData(data.Data);
        setValue('customerId', data.Data.UID || '');
      } else {
        setClienteError('No se encontró el cliente para ese RFC');
      }
    } catch (err) {
      setClienteError('Error consultando cliente: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
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
          <div className="p-4 bg-green-100 border border-green-300 rounded-lg mt-2 flex items-center gap-3 shadow-sm">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span className="font-semibold text-green-700 text-base">Cliente encontrado</span>
          </div>
        )}
        {clienteData && (
          <div className="mb-4">
            <label className="block mb-1 text-sm font-semibold text-gray-700">Forma de Pago</label>
            <select
              value={clienteData?.FormaPago || ''}
              onChange={e => setClienteData({ ...clienteData, FormaPago: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            >
              <option value="">Selecciona</option>
              {catalogs.FormaPago && catalogs.FormaPago.map((opt, idx) => (
                <option key={opt.key + '-' + idx} value={opt.key}>{opt.key} - {opt.name}</option>
              ))}
            </select>
          </div>
        )}
        {clienteData && clienteData.FormaPago !== '' && (
          <CorreoValidador
            clienteCorreo={clienteData.Contacto?.Email}
            clienteData={clienteData}
            fields={fields}
            setEmittedUID={setEmittedUID}
            setCfdiMessage={setCfdiMessage}
            setValidadoCorreo={setValidadoCorreo}
          />
        )}
        {clienteData && clienteData.FormaPago !== '' && validadoCorreo && (
          <div className="mb-8 p-4 bg-blue-50 rounded-lg flex flex-col md:flex-row gap-4 items-center">
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
        )}
        {/* Mostrar botón de facturar solo si hay productos importados */}
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
              FormaPago: clienteData.FormaPago || '03', // Seleccionada por el usuario
              MetodoPago: 'PUE', // Asignada automáticamente
              Moneda: 'MXN',
              UsoCFDI: clienteData.UsoCFDI || 'G03',
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
      {productosImportados.length > 0 && (
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
      )}
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
      {validado && clienteData && (
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
            FormaPago: clienteData.FormaPago || '03', // Seleccionada por el usuario
            MetodoPago: 'PUE', // Asignada automáticamente
            Moneda: 'MXN',
            UsoCFDI: clienteData.UsoCFDI || 'G03',
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
  );
}

export default CFDIGlobalForm;

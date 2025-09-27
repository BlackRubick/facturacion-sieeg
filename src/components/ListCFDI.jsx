import React, { useEffect, useState } from 'react';
import FacturaAPIService from '../services/facturaApi';
import Button from '../components/common/Button/Button';
import axios from 'axios';

const API_HOST = '';
const API_KEY = import.meta.env.VITE_FACTURA_API_KEY;
const SECRET_KEY = import.meta.env.VITE_FACTURA_SECRET_KEY;
const PLUGIN_KEY = import.meta.env.VITE_FACTURA_PLUGIN_KEY;

const ListCFDI = () => {
  const [cfdiList, setCfdiList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    month: '',
    year: '',
    rfc: '',
    status: 'all',
    page: 1,
    per_page: 100,
  });
  const [error, setError] = useState(null);

  const fetchCFDIs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FacturaAPIService.listCFDI(filters);
      setCfdiList(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setCfdiList([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCFDIs();
    // eslint-disable-next-line
  }, []);

  const handleChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = e => {
    e.preventDefault();
    fetchCFDIs();
  };

  const downloadCFDI = async (uid, type = 'pdf') => {
    try {
      const url = `/v4/cfdi40/${uid}/${type}`;
      const response = await axios.get(url, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json',
          'F-PLUGIN': PLUGIN_KEY,
          'F-Api-Key': API_KEY,
          'F-Secret-Key': SECRET_KEY,
        },
      });
      const blob = new Blob([response.data], { type: type === 'pdf' ? 'application/pdf' : 'application/xml' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `cfdi_${uid}.${type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Error al descargar el CFDI: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-lg mt-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Listar CFDI's</h2>
      <form className="flex flex-wrap gap-4 mb-6" onSubmit={handleSearch}>
        <input name="month" type="text" maxLength={2} placeholder="Mes (01-12)" value={filters.month} onChange={handleChange} className="border rounded p-2 w-24" />
        <input name="year" type="text" maxLength={4} placeholder="Año" value={filters.year} onChange={handleChange} className="border rounded p-2 w-24" />
        <input name="rfc" type="text" placeholder="RFC" value={filters.rfc} onChange={handleChange} className="border rounded p-2 w-40" />
        <input name="page" type="number" min={1} placeholder="Página" value={filters.page} onChange={handleChange} className="border rounded p-2 w-24" />
        <input name="per_page" type="number" min={1} max={100} placeholder="Por página" value={filters.per_page} onChange={handleChange} className="border rounded p-2 w-24" />
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">Buscar</Button>
      </form>
      {loading && <div className="text-gray-500">Cargando CFDI's...</div>}
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 border">Fecha Timbrado</th>
              <th className="px-3 py-2 border">Receptor</th>
              <th className="px-3 py-2 border">Razón Social</th>
              <th className="px-3 py-2 border">Total</th>
              <th className="px-3 py-2 border">Estatus</th>
              <th className="px-3 py-2 border">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cfdiList.length === 0 && !loading ? (
              <tr><td colSpan={6} className="text-center py-4 text-gray-500">No hay CFDI's para los filtros seleccionados.</td></tr>
            ) : (
              cfdiList.map((cfdi, idx) => (
                <tr key={cfdi.UUID + '-' + idx} className="border-b">
                  <td className="px-3 py-2 border">{cfdi.FechaTimbrado}</td>
                  <td className="px-3 py-2 border font-mono text-xs">{cfdi.Receptor}</td>
                  <td className="px-3 py-2 border">{cfdi.RazonSocialReceptor}</td>
                  <td className="px-3 py-2 border">${cfdi.Total}</td>
                  <td className="px-3 py-2 border">{cfdi.Status}</td>
                  <td className="px-3 py-2 border">
                    {/*<Button type="button" onClick={() => window.open(`/cfdi/${cfdi.UID}`, '_blank')} className="bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded text-xs mr-2">Ver</Button>*/}
                    <Button type="button" onClick={() => downloadCFDI(cfdi.UID, 'pdf')} className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs mr-2">PDF</Button>
                    <Button type="button" onClick={() => downloadCFDI(cfdi.UID, 'xml')} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs">XML</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ListCFDI;

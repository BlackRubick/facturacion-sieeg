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
    <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 text-center">CFDI emitidos</h2>
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4 items-center justify-center">
        <input name="month" type="text" maxLength={2} placeholder="Mes (01-12)" value={filters.month} onChange={handleChange} className="border rounded p-2 w-24" />
        <input name="year" type="text" maxLength={4} placeholder="Año" value={filters.year} onChange={handleChange} className="border rounded p-2 w-24" />
        <input name="rfc" type="text" placeholder="RFC" value={filters.rfc} onChange={handleChange} className="border rounded p-2 w-40" />
        <input name="page" type="number" min={1} placeholder="Página" value={filters.page} onChange={handleChange} className="border rounded p-2 w-24" />
        <input name="per_page" type="number" min={1} max={100} placeholder="Por página" value={filters.per_page} onChange={handleChange} className="border rounded p-2 w-24" />
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow">Buscar</Button>
      </form>
      <table className="w-full border border-blue-100 rounded-xl overflow-hidden mb-6 text-sm">
        <thead>
          <tr className="bg-blue-50 text-blue-700">
            <th className="p-2 font-semibold">Folio</th>
            <th className="p-2 font-semibold">RFC</th>
            <th className="p-2 font-semibold">Nombre</th>
            <th className="p-2 font-semibold">Fecha</th>
            <th className="p-2 font-semibold">Total</th>
            <th className="p-2 font-semibold">Estatus</th>
            <th className="p-2 font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {cfdiList.map(c => (
            <tr key={c.UID} className="border-b border-blue-50 hover:bg-blue-50">
              <td className="p-2">{c.Folio}</td>
              <td className="p-2">{c.RFC || c.ReceptorRFC || '-'}</td>
              <td className="p-2">{c.Nombre || c.ReceptorNombre || '-'}</td>
              <td className="p-2">{c.Fecha || c.FechaEmision || '-'}</td>
              <td className="p-2">${c.Total}</td>
              <td className="p-2">{c.Status}</td>
              <td className="p-2">
                <button onClick={() => downloadCFDI(c.UID, 'pdf')} className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-800">PDF</button>
                <button onClick={() => downloadCFDI(c.UID, 'xml')} className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-800">XML</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {loading && <div className="text-blue-500 text-center">Cargando...</div>}
      {error && <div className="text-red-500 text-center">{error}</div>}
    </div>
  );
};

export default ListCFDI;

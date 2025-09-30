import React, { useState } from 'react';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';

const initialForm = {
  rfc: '', razons: '', codpos: '', email: '', usocfdi: '', regimen: '', calle: '', numero_exterior: '', numero_interior: '', colonia: '', ciudad: '', delegacion: '', localidad: '', estado: '', pais: 'MEX', numregidtrib: '', nombre: '', apellidos: '', telefono: '', email2: '', email3: ''
};

const CustomerModalForm = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(initialForm);
  const [catalogs, setCatalogs] = useState({ UsoCFDI: [], RegimenFiscal: [] });
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (open) {
      setForm(initialForm);
      fetchCatalogs();
    }
  }, [open]);

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
      alert('Error al cargar catálogos SAT');
    }
    setCatalogLoading(false);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    const dataToSend = { ...form, codpos: Number(form.codpos) };
    try {
      const res = await FacturaAPIService.createClient(dataToSend);
      if (res.data?.status === 'success') {
        alert('Cliente creado. Por favor vuelve a ingresar tu RFC para continuar.');
        window.location.reload();
      } else {
        throw new Error(JSON.stringify(res.data?.message || 'Error al crear'));
      }
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl relative overflow-y-auto max-h-[90vh]">
        <button onClick={onClose} className="sticky top-4 right-4 float-right text-gray-500 hover:text-red-500 text-xl">×</button>
        <h3 className="text-xl font-bold mb-6 text-blue-700 text-center">Agregar Cliente</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="RFC" name="rfc" value={form.rfc} onChange={handleChange} required />
            <Input label="Razón Social" name="razons" value={form.razons} onChange={handleChange} required />
            <Input label="Código Postal" name="codpos" value={form.codpos} onChange={handleChange} required type="number" />
            <Input label="Email" name="email" value={form.email} onChange={handleChange} required type="email" />
            <Select label="Uso CFDI" name="usocfdi" value={form.usocfdi} onChange={val => setForm(f => ({ ...f, usocfdi: val }))} options={Array.isArray(catalogs.UsoCFDI) ? catalogs.UsoCFDI.map(opt => ({ value: opt.key || opt.value, label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` })) : []} isLoading={catalogLoading} placeholder="Selecciona uso CFDI" />
            <Select label="Régimen Fiscal" name="regimen" value={form.regimen} onChange={val => setForm(f => ({ ...f, regimen: val }))} options={Array.isArray(catalogs.RegimenFiscal) ? catalogs.RegimenFiscal.map(opt => ({ value: opt.key || opt.value, label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` })) : []} isLoading={catalogLoading} placeholder="Selecciona régimen fiscal" required />
            <Input label="Calle" name="calle" value={form.calle} onChange={handleChange} />
            <Input label="Número Exterior" name="numero_exterior" value={form.numero_exterior} onChange={handleChange} />
            <Input label="Número Interior" name="numero_interior" value={form.numero_interior} onChange={handleChange} />
            <Input label="Colonia" name="colonia" value={form.colonia} onChange={handleChange} />
            <Input label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} />
            <Input label="Delegación" name="delegacion" value={form.delegacion} onChange={handleChange} />
            <Input label="Localidad" name="localidad" value={form.localidad} onChange={handleChange} />
            <Input label="Estado" name="estado" value={form.estado} onChange={handleChange} />
            <Input label="País (ej: MEX)" name="pais" value={form.pais} onChange={handleChange} required />
            <Input label="Num. Reg. Id. Trib." name="numregidtrib" value={form.numregidtrib} onChange={handleChange} />
            <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
            <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
            <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
            <Input label="Email 2" name="email2" value={form.email2} onChange={handleChange} type="email" />
            <Input label="Email 3" name="email3" value={form.email3} onChange={handleChange} type="email" />
          </div>
          <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
            <Button type="button" onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded shadow w-full sm:w-auto">Cancelar</Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded shadow w-full sm:w-auto" disabled={loading}>{loading ? 'Creando...' : 'Crear'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModalForm;

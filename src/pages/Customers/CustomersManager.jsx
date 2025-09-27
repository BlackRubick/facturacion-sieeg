import React, { useEffect, useState } from 'react';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';

const initialForm = {
  rfc: '', razons: '', codpos: '', email: '', usocfdi: '', regimen: '', calle: '', numero_exterior: '', numero_interior: '', colonia: '', ciudad: '', delegacion: '', localidad: '', estado: '', pais: 'MEX', numregidtrib: '', nombre: '', apellidos: '', telefono: '', email2: '', email3: ''
};

const CustomersManager = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [selectedUID, setSelectedUID] = useState(null);
  const [catalogs, setCatalogs] = useState({ UsoCFDI: [], RegimenFiscal: [] });
  const [catalogLoading, setCatalogLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await FacturaAPIService.listClients();
      setCustomers(res.data.data || []);
    } catch (err) {
      alert('Error al cargar clientes');
    }
    setLoading(false);
  };

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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    fetchCatalogs();
    if (customer) {
      setEditMode(true);
      setForm({
        rfc: customer.RFC || '',
        razons: customer.RazonSocial || '',
        codpos: customer.CodigoPostal || '',
        email: customer.Contacto?.Email || '',
        usocfdi: customer.UsoCFDI || '',
        regimen: customer.RegimenId || '',
        calle: customer.Calle || '',
        numero_exterior: customer.Numero || '',
        numero_interior: customer.Interior || '',
        colonia: customer.Colonia || '',
        ciudad: customer.Ciudad || '',
        delegacion: customer.Delegacion || '',
        localidad: customer.Localidad || '',
        estado: customer.Estado || '',
        pais: customer.Pais || 'MEX',
        numregidtrib: customer.NumRegIdTrib || '',
        nombre: customer.Contacto?.Nombre || '',
        apellidos: customer.Contacto?.Apellidos || '',
        telefono: customer.Contacto?.Telefono || '',
        email2: customer.Contacto?.Email2 || '',
        email3: customer.Contacto?.Email3 || '',
      });
      setSelectedUID(customer.UID);
    } else {
      setEditMode(false);
      setForm(initialForm);
      setSelectedUID(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(initialForm);
    setSelectedUID(null);
    setEditMode(false);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const dataToSend = { ...form, codpos: Number(form.codpos) };
    try {
      let res;
      if (editMode && selectedUID) {
        res = await FacturaAPIService.updateClient(selectedUID, dataToSend);
        if (res.data?.status === 'success') {
          alert('Cliente actualizado');
        } else {
          throw new Error(res.data?.message || 'Error al actualizar');
        }
      } else {
        res = await FacturaAPIService.createClient(dataToSend);
        if (res.data?.status === 'success') {
          alert('Cliente creado');
        } else {
          throw new Error(JSON.stringify(res.data?.message || 'Error al crear'));
        }
      }
      fetchCustomers();
      handleCloseModal();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async uid => {
    if (!window.confirm('¿Eliminar cliente?')) return;
    try {
      await FacturaAPIService.deleteClient(uid);
      alert('Cliente eliminado');
      fetchCustomers();
    } catch (err) {
      alert('No se pudo eliminar: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-extrabold text-blue-700 text-center sm:text-left">Gestión de Clientes</h2>
        <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded shadow hover:scale-105 transition-transform w-full sm:w-auto">+ Agregar Cliente</Button>
      </div>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border rounded-xl shadow-sm bg-gray-50 text-xs sm:text-sm">
            <thead>
              <tr className="bg-blue-100 text-blue-800">
                <th className="py-2 px-4">Razón Social</th>
                <th className="py-2 px-4">RFC</th>
                <th className="py-2 px-4">Email</th>
                <th className="py-2 px-4">Teléfono</th>
                <th className="py-2 px-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.UID} className="border-b hover:bg-blue-50 transition-colors">
                  <td className="py-2 px-4 font-semibold">{c.RazonSocial}</td>
                  <td className="py-2 px-4">{c.RFC}</td>
                  <td className="py-2 px-4">{c.Contacto?.Email}</td>
                  <td className="py-2 px-4">{c.Contacto?.Telefono}</td>
                  <td className="py-2 px-4 flex gap-2">
                    <Button onClick={() => handleOpenModal(c)} className="bg-yellow-400 text-white px-3 py-1 rounded shadow hover:bg-yellow-500">Editar</Button>
                    <Button onClick={() => handleDelete(c.UID)} className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600">Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={handleCloseModal} className="sticky top-4 right-4 float-right text-gray-500 hover:text-red-500 text-xl">×</button>
            <h3 className="text-xl font-bold mb-6 text-blue-700 text-center">{editMode ? 'Editar Cliente' : 'Agregar Cliente'}</h3>
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
                <Button type="button" onClick={handleCloseModal} className="bg-gray-400 text-white px-4 py-2 rounded shadow w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded shadow w-full sm:w-auto">{editMode ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersManager;

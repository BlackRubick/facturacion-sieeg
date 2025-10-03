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
      console.log('Datos del cliente:', customer); // Para depuración
      setEditMode(true);
      setForm({
        rfc: customer.RFC || customer.rfc || '',
        razons: customer.RazonSocial || customer.razons || customer.razon_social || '',
        codpos: customer.CodigoPostal || customer.codpos || customer.codigo_postal || '',
        email: customer.Email || customer.Contacto?.Email || customer.email || '',
        usocfdi: customer.UsoCFDI || customer.usocfdi || customer.uso_cfdi || '',
        regimen: customer.RegimenId || customer.regimen || customer.regimen_id || '',
        calle: customer.Calle || customer.calle || '',
        numero_exterior: customer.Numero || customer.numero_exterior || customer.numero || '',
        numero_interior: customer.Interior || customer.numero_interior || customer.interior || '',
        colonia: customer.Colonia || customer.colonia || '',
        ciudad: customer.Ciudad || customer.ciudad || '',
        delegacion: customer.Delegacion || customer.delegacion || '',
        localidad: customer.Localidad || customer.localidad || '',
        estado: customer.Estado || customer.estado || '',
        pais: customer.Pais || customer.pais || 'MEX',
        numregidtrib: customer.NumRegIdTrib || customer.numregidtrib || customer.num_reg_id_trib || '',
        nombre: customer.Nombre || customer.Contacto?.Nombre || customer.nombre || '',
        apellidos: customer.Apellidos || customer.Contacto?.Apellidos || customer.apellidos || '',
        telefono: customer.Telefono || customer.Contacto?.Telefono || customer.telefono || '',
        email2: customer.Email2 || customer.Contacto?.Email2 || customer.email2 || '',
        email3: customer.Email3 || customer.Contacto?.Email3 || customer.email3 || '',
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
    <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">Gestión de clientes</h2>
          <Button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-green-500 to-green-700 text-white px-4 py-2 rounded shadow">
            Agregar Cliente
          </Button>
        </div>
        {/* Tabla de clientes */}
        {loading ? (
          <div className="text-center py-8">
            <p className="text-blue-600">Cargando clientes...</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto rounded-xl mb-6">
            <table className="min-w-full border border-blue-100 rounded-xl text-sm">
            <thead>
              <tr className="bg-blue-50 text-blue-700">
                <th className="p-2 font-semibold">RFC</th>
                <th className="p-2 font-semibold">Razón Social</th>
                <th className="p-2 font-semibold">Correo</th>
                <th className="p-2 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.UID} className="border-b border-blue-50 hover:bg-blue-50">
                  <td className="p-2">{c.RFC}</td>
                  <td className="p-2">{c.RazonSocial}</td>
                  <td className="p-2">
                    {[c.Email, c.Contacto?.Email, c.Contacto?.Email2, c.Contacto?.Email3]
                      .filter(Boolean)
                      .join(', ')}
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleOpenModal(c)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs mr-2 hover:bg-blue-800">Editar</button>
                    <button onClick={() => handleDelete(c.UID)} className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-800">Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
        {/* Modal de edición/agregado */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-blue-100 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
              <button type="button" onClick={() => setModalOpen(false)} className="absolute top-2 right-2 text-gray-500">✕</button>
              <h3 className="text-xl font-bold mb-4 text-blue-700 text-center">{editMode ? 'Editar cliente' : 'Agregar cliente'}</h3>
              <div className="space-y-6">
                {/* Información fiscal básica */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Información Fiscal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="RFC" name="rfc" value={form.rfc} onChange={handleChange} required />
                    <Input label="Código Postal" name="codpos" value={form.codpos} onChange={handleChange} required type="number" />
                    <div className="md:col-span-2">
                      <Input label="Razón Social" name="razons" value={form.razons} onChange={handleChange} required />
                    </div>
                    <Input label="Email Principal" name="email" value={form.email} onChange={handleChange} required type="email" />
                    <Input label="País (ej: MEX)" name="pais" value={form.pais} onChange={handleChange} required />
                  </div>
                </div>

                {/* Catálogos SAT */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Catálogos SAT</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Uso CFDI" name="usocfdi" value={form.usocfdi} onChange={val => setForm(f => ({ ...f, usocfdi: val }))} options={Array.isArray(catalogs.UsoCFDI) ? catalogs.UsoCFDI.map(opt => ({ value: opt.key || opt.value, label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` })) : []} isLoading={catalogLoading} placeholder="Selecciona uso CFDI" />
                    <Select label="Régimen Fiscal" name="regimen" value={form.regimen} onChange={val => setForm(f => ({ ...f, regimen: val }))} options={Array.isArray(catalogs.RegimenFiscal) ? catalogs.RegimenFiscal.map(opt => ({ value: opt.key || opt.value, label: `${opt.key || opt.value} - ${opt.name || opt.label || opt.descripcion || ''}` })) : []} isLoading={catalogLoading} placeholder="Selecciona régimen fiscal" required />
                  </div>
                </div>
                
                {/* Dirección */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Dirección</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input label="Calle" name="calle" value={form.calle} onChange={handleChange} />
                    </div>
                    <Input label="Número Exterior" name="numero_exterior" value={form.numero_exterior} onChange={handleChange} />
                    <Input label="Número Interior" name="numero_interior" value={form.numero_interior} onChange={handleChange} />
                    <Input label="Colonia" name="colonia" value={form.colonia} onChange={handleChange} />
                    <Input label="Ciudad" name="ciudad" value={form.ciudad} onChange={handleChange} />
                    <Input label="Delegación" name="delegacion" value={form.delegacion} onChange={handleChange} />
                    <Input label="Localidad" name="localidad" value={form.localidad} onChange={handleChange} />
                    <Input label="Estado" name="estado" value={form.estado} onChange={handleChange} />
                    <Input label="Num. Reg. Id. Trib." name="numregidtrib" value={form.numregidtrib} onChange={handleChange} />
                  </div>
                </div>
                
                {/* Información de contacto */}
                <div>
                  <h4 className="text-lg font-semibold text-blue-600 mb-3 border-b border-blue-200 pb-1">Información de Contacto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} />
                    <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
                    <Input label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
                    <Input label="Email 2" name="email2" value={form.email2} onChange={handleChange} type="email" />
                    <Input label="Email 3" name="email3" value={form.email3} onChange={handleChange} type="email" />
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end mt-6 gap-2">
                <Button type="button" onClick={handleCloseModal} className="bg-gray-400 text-white px-4 py-2 rounded shadow w-full sm:w-auto">Cancelar</Button>
                <Button type="submit" className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded shadow w-full sm:w-auto">{editMode ? 'Actualizar' : 'Crear'}</Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersManager;

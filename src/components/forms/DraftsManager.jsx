import React, { useEffect, useState } from 'react';
import FacturaAPIService from '../../services/facturaApi';
import Button from '../common/Button/Button';
import Table from '../common/Table/Table';
import Modal from '../common/Modal/Modal';

const DraftsManager = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [timbrando, setTimbrando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState(null);
  const [catalogData, setCatalogData] = useState([]);
  const [catalogName, setCatalogName] = useState('');
  const [catalogModalOpen, setCatalogModalOpen] = useState(false);

  useEffect(() => {
    fetchDrafts();
  }, [page]);

  const fetchDrafts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await FacturaAPIService.getDrafts({ perPage, page });
      setDrafts(res.data.data || []);
    } catch (err) {
      setError('Error al cargar borradores');
    }
    setLoading(false);
  };

  const handleView = async (uid) => {
    setLoading(true);
    try {
      const res = await FacturaAPIService.getDraftByUID(uid);
      setSelectedDraft(res.data.data);
      setModalOpen(true);
    } catch (err) {
      setError('Error al cargar borrador');
    }
    setLoading(false);
  };

  const handleDelete = async (uid) => {
    if (!window.confirm('¿Eliminar este borrador?')) return;
    setLoading(true);
    try {
      await FacturaAPIService.deleteDraft(uid);
      fetchDrafts();
    } catch (err) {
      setError('Error al eliminar borrador');
    }
    setLoading(false);
  };

  const handleStamp = async (uid) => {
    setTimbrando(true);
    try {
      const res = await FacturaAPIService.stampDraft(uid);
      alert('Timbrado exitoso: ' + JSON.stringify(res.data));
      fetchDrafts();
    } catch (err) {
      alert('Error al timbrar: ' + (err.response?.data?.message || err.message));
    }
    setTimbrando(false);
  };

  const handleSend = async (uid) => {
    setEnviando(true);
    try {
      const res = await FacturaAPIService.sendCFDI(uid);
      alert('CFDI enviado: ' + (res.data.message || JSON.stringify(res.data)));
    } catch (err) {
      alert('Error al enviar: ' + (err.response?.data?.message || err.message));
    }
    setEnviando(false);
  };

  const handleCatalogFetch = async (name) => {
    setCatalogLoading(true);
    setCatalogError(null);
    setCatalogName(name);
    try {
      const res = await FacturaAPIService.getCatalog(name);
      setCatalogData(res.data.data || []);
      setCatalogModalOpen(true);
    } catch (err) {
      setCatalogError('Error al cargar catálogo');
    }
    setCatalogLoading(false);
  };

  const columns = [
    { Header: 'UID', accessor: 'UUID' },
    { Header: 'Serie', accessor: 'Serie' },
    { Header: 'Folio', accessor: 'Folio' },
    { Header: 'Versión', accessor: 'Version' },
    { Header: 'Acciones', accessor: 'actions' },
  ];

  const data = drafts.map(draft => ({
    ...draft,
    actions: (
      <div className="flex gap-2">
        <Button onClick={() => handleView(draft.UUID)} className="bg-blue-500">Ver</Button>
        <Button onClick={() => handleStamp(draft.UUID)} className="bg-green-500" disabled={timbrando}>Timbrar</Button>
        <Button onClick={() => handleSend(draft.UUID)} className="bg-yellow-500" disabled={enviando}>Enviar</Button>
        <Button onClick={() => handleDelete(draft.UUID)} className="bg-red-500">Eliminar</Button>
      </div>
    ),
  }));

  return (
    <div className="my-8">

      {catalogError && <p className="text-red-500">{catalogError}</p>}
      <Modal isOpen={catalogModalOpen} onClose={() => setCatalogModalOpen(false)}>
        <h3 className="font-bold mb-2">Catálogo: {catalogName}</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded max-h-96 overflow-auto">{JSON.stringify(catalogData, null, 2)}</pre>
      </Modal>
      {loading && <p>Cargando...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Table columns={columns} data={data} />
      <div className="flex justify-between mt-4">
        <Button onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
        <span>Página {page}</span>
        <Button onClick={() => setPage(p => p + 1)}>Siguiente</Button>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h3 className="font-bold mb-2">Detalle borrador</h3>
        <pre className="text-xs bg-gray-100 p-2 rounded max-h-96 overflow-auto">{JSON.stringify(selectedDraft, null, 2)}</pre>
      </Modal>
    </div>
  );
};

export default DraftsManager;

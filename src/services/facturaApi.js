import httpClient from './httpClient';

class FacturaAPIService {
  // NOTA: Estas rutas son para APIs genéricas, no son específicas de Factura.com
  // Si las necesitas, cambia por los endpoints correctos de Factura.com
  async getInvoices(params) {
    // Usar endpoint correcto de Factura.com para listar facturas
    return this.listCFDI(params);
  }
  async createInvoice(invoiceData) {
    // Usar endpoint correcto de Factura.com para crear CFDI
    return this.createCFDI40(invoiceData);
  }
  async updateInvoice(id, invoiceData) {
    // Factura.com no permite modificar CFDIs timbrados, solo borradores
    return this.updateDraft(id, invoiceData);
  }
  async deleteInvoice(id) {
    // Factura.com no permite eliminar CFDIs timbrados, solo borradores
    return this.deleteDraft(id);
  }
  async getInvoicePDF(id) {
    // Usar endpoint correcto de Factura.com para obtener PDF
    return this.getCFDIPDF(id);
  }
  async getCustomers(params) {
    // Usar endpoint correcto de Factura.com para listar clientes
    return this.listClients(params);
  }
  async createCustomer(customerData) {
    // Usar endpoint correcto de Factura.com para crear cliente
    return this.createClient(customerData);
  }
  async updateCustomer(id, customerData) {
    // Usar endpoint correcto de Factura.com para actualizar cliente
    return this.updateClient(id, customerData);
  }
  async deleteCustomer(id) {
    // Usar endpoint correcto de Factura.com para eliminar cliente
    return this.deleteClient(id);
  }
  async createCFDI40(cfdiData) {
    // Endpoint para crear CFDI 4.0 o borrador
    return httpClient.post('/v4/cfdi40/create', cfdiData);
  }
  async getDrafts({ perPage = 25, page = 1 }) {
    // Recuperar borradores paginados
    return httpClient.get('/v4/drafts', { params: { perPage, page } });
  }
  async getDraftByUID(uid) {
    // Recuperar borrador por UID
    return httpClient.get(`/v4/drafts/${uid}`);
  }
  async updateDraft(uid, cfdiData) {
    // Modificar borrador por UID
    return httpClient.post(`/v4/cfdi40/create/${uid}`, cfdiData);
  }
  async stampDraft(uid) {
    // Timbrar borrador por UID
    return httpClient.post(`/v4/cfdi40/${uid}/timbrarborrador`);
  }
  async deleteDraft(uid) {
    // Eliminar borrador por UID
    return httpClient.post(`/v4/drafts/${uid}/drop`);
  }
  async sendCFDI(uid) {
    // Enviar CFDI por email
    return httpClient.get(`/v4/cfdi40/${uid}/email`);
  }
  async getCatalog(catalogName) {
    // Consulta cualquier catálogo SAT por nombre
    return httpClient.get(`/v3/catalogo/${catalogName}`);
  }
  async getUsoCFDI() {
    // Consulta catálogo de UsoCFDI
    return httpClient.get('/v4/catalogo/UsoCfdi');
  }
  async getRetencionClave() {
    // Consulta catálogo de clave de retención
    return httpClient.get('/v4/catalogos/retenciones/claveRetencion');
  }
  async getPayrollCatalog(catalogName) {
    // Consulta cualquier catálogo de nómina
    return httpClient.get(`/payroll/catalogos/${catalogName}`);
  }
  async listClients() {
    // Listar todos los clientes
    return httpClient.get('/v1/clients');
  }
  async getClientByRFC(rfc) {
    // Consultar cliente por RFC
    return httpClient.get(`/v1/clients/${rfc}`);
  }
  async getClientByUID(uid) {
    // Consultar cliente por UID
    return httpClient.get(`/v1/clients/${uid}`);
  }
  async getClientsByRepeatedRFC(rfc) {
    // Consultar RFC repetido (varios clientes con mismo RFC)
    return httpClient.get(`/v1/clients/rfc/${rfc}`);
  }
  async createClient(clientData) {
    // Crear nuevo cliente
    return httpClient.post('/v1/clients/create', clientData);
  }
  async updateClient(uid, clientData) {
    // Actualizar cliente por UID
    return httpClient.post(`/v1/clients/${uid}/update`, clientData);
  }
  async deleteClient(uid) {
    // Eliminar cliente por UID
    return httpClient.post(`/v1/clients/destroy/${uid}`);
  }
  async listProducts({ page = 1, per_page = 100 } = {}) {
    // Listar productos propios
    return httpClient.get('/v3/products/list', { params: { page, per_page } });
  }
  async createProduct(productData) {
    // Crear nuevo producto
    return httpClient.post('/v3/products/create', productData);
  }
  async getSeries() {
    // Listar todas las series
    return httpClient.get('/v4/series');
  }
  async getCFDIPDF(uid) {
    // Descargar PDF de CFDI 4.0 por UID
    return httpClient.get(`/v4/cfdi40/${uid}/pdf`, { responseType: 'blob' });
  }
  async getCFDIXML(uid) {
    // Descargar XML de CFDI 4.0 por UID
    return httpClient.get(`/v4/cfdi40/${uid}/xml`, { responseType: 'blob' });
  }
  async listCFDI(filters) {
    // Listar CFDI's timbrados con filtros
    return httpClient.post('/v4/cfdi/list', filters);
  }
}

export default new FacturaAPIService();
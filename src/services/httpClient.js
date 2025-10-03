import axios from 'axios';

const isProd = import.meta.env.VITE_FACTURA_API_ENV === 'produccion';
const isDevelopment = import.meta.env.MODE === 'development';

const config = {
  // En desarrollo usa rutas relativas (proxy), en producción usa la URL base configurada
  baseURL: isDevelopment ? '/' : (import.meta.env.VITE_FACTURA_API_URL || '/'),
  headers: {
    'Content-Type': 'application/json',
    'F-PLUGIN': import.meta.env.VITE_FACTURA_PLUGIN,
    'F-Api-Key': import.meta.env.VITE_FACTURA_API_KEY,
    'F-Secret-Key': import.meta.env.VITE_FACTURA_SECRET_KEY,
    'F-Api-Env': import.meta.env.VITE_FACTURA_API_ENV,
  },
};

const httpClient = axios.create(config);

export default httpClient;

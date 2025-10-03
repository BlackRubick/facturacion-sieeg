import axios from 'axios';

const isProd = import.meta.env.VITE_FACTURA_API_ENV === 'produccion';

const config = {
  baseURL: isProd ? 'https://factura.com/api' : 'https://sandbox.factura.com/api',
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

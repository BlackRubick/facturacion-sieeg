import axios from 'axios';

const isProd = import.meta.env.MODE === 'production';

const config = {
  baseURL: isProd ? '/' : 'https://sandbox.factura.com/api',
  headers: {
    'Content-Type': 'application/json',
    'F-PLUGIN': import.meta.env.VITE_FACTURA_PLUGIN,
    'F-Api-Key': import.meta.env.VITE_FACTURA_API_KEY,
    'F-Secret-Key': import.meta.env.VITE_FACTURA_SECRET_KEY,
    'F-Api-Env': 'sandbox',
  },
};

const httpClient = axios.create(config);

export default httpClient;

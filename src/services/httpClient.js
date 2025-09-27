import axios from 'axios';

const mode = window.localStorage.getItem('factura_mode') || 'sandbox';

const sandboxConfig = {
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
    'F-PLUGIN': import.meta.env.VITE_FACTURA_PLUGIN,
    'F-Api-Key': import.meta.env.VITE_FACTURA_API_KEY,
    'F-Secret-Key': import.meta.env.VITE_FACTURA_SECRET_KEY,
    'F-Api-Env': 'sandbox',
  },
};

const productionConfig = {
  baseURL: '/', // Cambia aquí si tienes una URL diferente para producción
  headers: {
    'Content-Type': 'application/json',
    'F-PLUGIN': import.meta.env.VITE_FACTURA_PLUGIN,
    'F-Api-Key': import.meta.env.VITE_FACTURA_API_KEY,
    'F-Secret-Key': import.meta.env.VITE_FACTURA_SECRET_KEY,
    'F-Api-Env': 'production',
  },
};

const httpClient = axios.create(mode === 'sandbox' ? sandboxConfig : productionConfig);

export default httpClient;

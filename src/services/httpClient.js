import axios from 'axios';

const isProd = import.meta.env.VITE_FACTURA_API_ENV === 'produccion';
// Usar URLs directas - Producción: https://api.factura.com, Sandbox: https://sandbox.factura.com/api
const baseURL = isProd ? 'https://api.factura.com' : 'https://sandbox.factura.com/api';

console.log('🔧 HttpClient Config:', {
  entorno: isProd ? 'Producción' : 'Sandbox',
  baseURL,
  apiKey: import.meta.env.VITE_FACTURA_API_KEY?.substring(0, 20) + '...',
  secretKey: import.meta.env.VITE_FACTURA_SECRET_KEY?.substring(0, 20) + '...',
  plugin: import.meta.env.VITE_FACTURA_PLUGIN,
  apiEnv: import.meta.env.VITE_FACTURA_API_ENV
});

const config = {
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    'F-PLUGIN': import.meta.env.VITE_FACTURA_PLUGIN,
    'F-Api-Key': import.meta.env.VITE_FACTURA_API_KEY,
    'F-Secret-Key': import.meta.env.VITE_FACTURA_SECRET_KEY,
    'F-Api-Env': import.meta.env.VITE_FACTURA_API_ENV,
  },
};

const httpClient = axios.create(config);

// Interceptor para debug (solo en desarrollo)
if (import.meta.env.MODE === 'development') {
  httpClient.interceptors.request.use(request => {
    console.log('🚀 API Request:', {
      method: request.method?.toUpperCase(),
      url: request.url,
      baseURL: request.baseURL,
      headers: {
        'F-Api-Key': request.headers['F-Api-Key'] ? request.headers['F-Api-Key'].substring(0, 20) + '...' : 'Missing',
        'F-Secret-Key': request.headers['F-Secret-Key'] ? request.headers['F-Secret-Key'].substring(0, 20) + '...' : 'Missing',
        'F-PLUGIN': request.headers['F-PLUGIN'] || 'Missing',
        'F-Api-Env': request.headers['F-Api-Env'] || 'Missing'
      }
    });
    return request;
  });

  httpClient.interceptors.response.use(
    response => {
      console.log('✅ API Response:', response.status, response.data);
      return response;
    },
    error => {
      console.error('❌ API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      return Promise.reject(error);
    }
  );
}

export default httpClient;

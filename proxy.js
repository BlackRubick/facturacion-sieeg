const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PROXY_PORT || 4000;

// Determinar el entorno basado en la variable de entorno
const isProduction = process.env.VITE_FACTURA_API_ENV === 'produccion';
const apiBaseUrl = isProduction ? 'https://factura.com/api' : 'https://sandbox.factura.com/api';

const facturaApiProxy = createProxyMiddleware(['/v1', '/v3', '/v4', '/payroll'], {
  target: apiBaseUrl,
  changeOrigin: true,
  secure: true,
  pathRewrite: {
    '^/v1': '/v1',
    '^/v3': '/v3',
    '^/v4': '/v4',
    '^/payroll': '/payroll',
  },
  onProxyReq: (proxyReq, req, res) => {
    // Puedes agregar aquí headers de autenticación si usas API KEY
    if (process.env.FACTURA_API_KEY) {
      proxyReq.setHeader('Authorization', `Bearer ${process.env.FACTURA_API_KEY}`);
    }
  },
});

app.use(facturaApiProxy);

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PROXY_PORT || 4000;

const facturaApiProxy = createProxyMiddleware(['/v1', '/v3', '/v4', '/payroll'], {
  target: 'https://sandbox.factura.com/api',
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

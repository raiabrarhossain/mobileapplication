// proxy.js
const http = require('http');
const https = require('https');

// Bypass SSL certificate name mismatch verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const PORT = 3000;
const TARGET_HOST = 'www.pinum.org.pk';
const TARGET_PORT = 443;

const server = http.createServer((req, res) => {
  console.log(`[Proxy] ${req.method} ${req.url}`);
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Rewrite /api/ prefix if needed, or forward directly
  const options = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${TARGET_HOST}:${TARGET_PORT}`,
    },
    rejectUnauthorized: false,
  };

  req.on('error', (err) => {
    console.error('[Request Error]', err);
  });

  res.on('error', (err) => {
    console.error('[Response Error]', err);
  });

  const proxyReq = https.request(options, (proxyRes) => {
    proxyRes.on('error', (err) => {
      console.error('[Proxy Response Error]', err);
    });

    // Forward headers and status
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  req.pipe(proxyReq, { end: true });

  proxyReq.on('error', (err) => {
    console.error('[Proxy Error]', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
    }
    res.end('Proxy Error: ' + err.message);
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[Proxy Warning] Port ${PORT} is already in use. Assuming proxy is already running.`);
  } else {
    console.error('[Proxy Server Error]', err);
  }
});

server.listen(PORT, () => {
  console.log(`Local PINUM API Proxy Server running at http://localhost:${PORT}`);
  console.log(`Forwarding requests to https://${TARGET_HOST}:${TARGET_PORT} with SSL verification disabled.`);
});

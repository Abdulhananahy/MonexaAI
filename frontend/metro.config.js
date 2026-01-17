// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const path = require('path');
const { FileStore } = require('metro-cache');
const http = require('http');

const config = getDefaultConfig(__dirname);

// Use a stable on-disk store (shared across web/android)
const root = process.env.METRO_CACHE_ROOT || path.join(__dirname, '.metro-cache');
config.cacheStores = [
  new FileStore({ root: path.join(root, 'cache') }),
];

// Configure web server for Replit environment
config.server = {
  ...config.server,
  port: 5000,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      
      // Proxy /api requests to the backend on port 8000
      if (req.url && req.url.startsWith('/api')) {
        const options = {
          hostname: 'localhost',
          port: 8000,
          path: req.url,
          method: req.method,
          headers: { ...req.headers, host: 'localhost:8000' },
        };
        
        const proxyReq = http.request(options, (proxyRes) => {
          res.writeHead(proxyRes.statusCode, proxyRes.headers);
          proxyRes.pipe(res);
        });
        
        proxyReq.on('error', (err) => {
          console.error('Proxy error:', err);
          res.writeHead(502);
          res.end('Backend unavailable');
        });
        
        req.pipe(proxyReq);
        return;
      }
      
      return middleware(req, res, next);
    };
  },
};

// Reduce the number of workers to decrease resource usage
config.maxWorkers = 2;

module.exports = config;

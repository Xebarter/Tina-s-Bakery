// Vercel Serverless Function entry point
import { createServer } from '../server/index.js';

export default async function handler(req, res) {
  // Create a server instance
  const server = createServer();
  
  // Forward the request to the Express server
  return new Promise((resolve, reject) => {
    server.attach(req, res, (err) => {
      if (err) {
        console.error('Server attach error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
        return resolve();
      }
      
      // Handle the request
      const { method, url, headers, body } = req;
      const mockReq = {
        ...req,
        method,
        url,
        headers,
        body,
      };
      
      const mockRes = {
        ...res,
        json: (data) => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          resolve();
        },
        status: (statusCode) => ({
          json: (data) => {
            res.statusCode = statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
            resolve();
          },
          send: (data) => {
            res.statusCode = statusCode;
            res.end(data);
            resolve();
          },
        }),
        send: (data) => {
          res.end(data);
          resolve();
        },
      };
      
      // Handle the request
      server.emit('request', mockReq, mockRes);
    });
  });
}

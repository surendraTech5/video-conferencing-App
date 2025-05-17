// assembly-proxy.js
require('dotenv').config();
const WebSocket = require('ws');
const axios = require('axios');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

const AAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

wss.on('connection', (clientSocket) => {
  console.log('Client connected to proxy');

  axios
    .post(
      'https://api.assemblyai.com/v2/realtime/token',
      {},
      {
        headers: { authorization: AAI_API_KEY },
      }
    )
    .then((response) => {
      const { token } = response.data;

      const assemblySocket = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?token=${token}`
      );

      assemblySocket.on('open', () => {
        console.log('Connected to AssemblyAI');
      });

      assemblySocket.on('message', (msg) => {
        clientSocket.send(msg); // send transcription to frontend
      });

      clientSocket.on('message', (msg) => {
        assemblySocket.send(msg); // send audio to AssemblyAI
      });

      clientSocket.on('close', () => {
        assemblySocket.close();
      });

      assemblySocket.on('close', () => {
        console.log('AssemblyAI connection closed');
      });

      assemblySocket.on('error', (err) => {
        console.error('AssemblyAI error:', err);
      });
    })
    .catch((err) => {
      console.error('Token error:', err.response?.data || err.message);
    });
});

server.listen(8080, () => {
  console.log('Proxy server running on ws://localhost:8080');
});

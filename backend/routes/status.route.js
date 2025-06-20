import express from 'express';
import mongoose from 'mongoose';
const router = express.Router();

router.get('/', async (req, res) => {
  let dbStatus = 'Disconnected';
  let dbStatusColor = 'red';

  try {
    await mongoose.connection.db.admin().ping();
    dbStatus = 'Connected';
    dbStatusColor = 'green';
  } catch {
    dbStatus = 'Disconnected';
    dbStatusColor = 'red';
  }

  const uptime = process.uptime();
  const timestamp = new Date().toLocaleString();

  res.send(`
    <html>
      <head>
        <title>Server Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: #f8f9fa;
            padding: 2rem;
            color: #212529;
          }
          .container {
            max-width: 600px;
            margin: auto;
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.05);
          }
          h1 {
            color: #2c7be5;
          }
          .status {
            font-size: 1.2rem;
            margin: 1rem 0;
          }
          .status span {
            font-weight: bold;
          }
          .green { color: green; }
          .red { color: red; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 Server Status</h1>
          <div class="status">Server: <span class="green">Running</span></div>
          <div class="status">MongoDB: <span class="${dbStatusColor}">${dbStatus}</span></div>
          <div class="status">Uptime: <span>${Math.floor(uptime)} seconds</span></div>
          <div class="status">Timestamp: <span>${timestamp}</span></div>
        </div>
      </body>
    </html>
  `);
});

export default router;

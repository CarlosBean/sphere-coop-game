import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData,
} from '@sphere-coop/shared';
import { setupSocketHandler } from './socket/SocketHandler.js';

const PORT = process.env.PORT ?? 3001;

const app = express();
app.use(express.json());

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  httpServer,
  {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  },
);

setupSocketHandler(io);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

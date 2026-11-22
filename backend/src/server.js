const http = require('http');
const app = require('./app');
const { env } = require('./config/env');
const { connectDB, disconnectDB } = require('./config/db');
const { initSocket } = require('./socket');

let server;

async function start() {
  try {
    await connectDB();

    server = http.createServer(app);
    initSocket(server);

    server.listen(env.port, () => {
      console.log(`\n🐛 BugTrack API running at http://localhost:${env.port}`);
      console.log(`   Health check: http://localhost:${env.port}/api/health`);
      console.log(`   Allowed client(s): ${env.clientUrls.join(', ')}\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error.message);
    process.exit(1);
  }
}

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down gracefully...`);
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  await disconnectDB();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

start();

module.exports = { start };

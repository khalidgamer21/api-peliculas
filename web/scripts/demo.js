import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { createApp } from '../../server.js';
import { seedDemo } from './seed-demo.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const api = createApp(':memory:');
api.listen(0, '127.0.0.1');
await once(api, 'listening');

let web;
try {
  const apiUrl = 'http://127.0.0.1:' + api.address().port;
  web = await createServer({
    root,
    mode: 'demo',
    server: {
      port: Number(process.env.DEMO_PORT ?? 5174),
      proxy: { '/api': { target: apiUrl } },
    },
  });
  await web.listen();
  const webUrl = 'http://127.0.0.1:' + web.httpServer.address().port;
  await seedDemo(apiUrl, webUrl);
  console.log('Demo disponible en ' + webUrl);
} catch (error) {
  await web?.close();
  api.close();
  throw error;
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    await web.close();
    api.close();
  });
}

import { createServer } from 'node:http';
import { access, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url);

export async function startPreview(port = 5501) {
  const html = new URL('preview.html', root);
  const bundle = new URL('dist/weather-chart-card-ha.js', root);
  await Promise.all([access(html), access(bundle)]);
  const server = createServer(async (request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    const file = path === '/' || path === '/preview.html' ? html
      : path === '/dist/weather-chart-card-ha.js' ? bundle : null;
    if (!file) {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Not found');
      return;
    }
    try {
      const content = await readFile(file);
      response.writeHead(200, {
        'Content-Type': file === html ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      response.end(content);
    } catch (error) {
      console.error(`Unable to read preview file ${file.pathname}`, error);
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Unable to read preview file');
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen({ host: '127.0.0.1', port, exclusive: true }, resolveListen);
  });
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const server = await startPreview();
    console.log(`Preview: http://127.0.0.1:${server.address().port}/preview.html`);
  } catch (error) {
    console.error('Unable to start preview. Build the bundle and check whether port 5501 is already in use.', error);
    process.exitCode = 1;
  }
}

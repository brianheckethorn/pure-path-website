import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
// Local preview only. No request logging: questionnaire answers must never reach URLs.
export function createPreviewServer() {
  return http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end('Local preview accepts read requests only.');
    return;
  }
  try {
    const url = new URL(request.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname);
    let target = path.resolve(root, `.${pathname}`);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error('Outside project');
    if ((await stat(target)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        response.writeHead(308, { Location: `${url.pathname}/` });
        response.end();
        return;
      }
      target = path.join(target, 'index.html');
    }
    const data = await readFile(target);
    response.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : data);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Page not found.');
  }
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createPreviewServer().listen(4173, '127.0.0.1', () => console.log('Local preview: http://127.0.0.1:4173/'));
}

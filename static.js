import { readFile } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';

const pages = new Set(['/', '/media', '/generos', '/directores', '/productoras', '/tipos']);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

export async function serveStatic(req, res, url, directory) {
  if (!['GET', 'HEAD'].includes(req.method)) return false;
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return false;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    return false;
  }
  if (pathname.includes('\\') || pathname.includes('\0')) return false;
  const root = resolve(directory);
  const name = pages.has(pathname.replace(/\/$/, '') || '/') ? 'index.html' : pathname.slice(1);
  const filename = resolve(root, name);
  const withinRoot = relative(root, filename);
  if (!withinRoot || withinRoot.startsWith('..')) return false;
  if (withinRoot.split(sep).some((part) => part.startsWith('.'))) return false;
  const contentType = contentTypes[extname(filename).toLowerCase()];
  if (!contentType) return false;

  let content;
  try {
    content = await readFile(filename);
  } catch (error) {
    if (['ENOENT', 'EISDIR', 'ENOTDIR'].includes(error.code)) return false;
    throw error;
  }
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': content.length,
    'Cache-Control': pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(req.method === 'HEAD' ? undefined : content);
  return true;
}

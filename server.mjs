import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/app.mjs', ['app.mjs', 'text/javascript; charset=utf-8']],
  ['/numbers.mjs', ['numbers.mjs', 'text/javascript; charset=utf-8']],
  ['/model.mjs', ['model.mjs', 'text/javascript; charset=utf-8']],
  ['/quota.mjs', ['quota.mjs', 'text/javascript; charset=utf-8']],
  ['/history-client.mjs', ['history-client.mjs', 'text/javascript; charset=utf-8']],
  ['/release-config.mjs', ['release-config.mjs', 'text/javascript; charset=utf-8']],
  ['/logo.png', ['logo.png', 'image/png']],
  ['/toss-ads.mjs', ['toss-ads.mjs', 'text/javascript; charset=utf-8']],
  ['/statistics.mjs', ['statistics.mjs', 'text/javascript; charset=utf-8']],
  ['/stats-ui.mjs', ['stats-ui.mjs', 'text/javascript; charset=utf-8']],
  ['/history.json', ['history.json', 'application/json; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
]);
http.createServer(async (req, res) => {
  const file = files.get(new URL(req.url, 'http://localhost').pathname);
  if (!file || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(404); res.end(); return; }
  try {
    const body = await readFile(new URL(`./public/${file[0]}`, import.meta.url));
    res.writeHead(200, {'Content-Type': file[1], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'});
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch { res.writeHead(500); res.end('Unable to load file'); }
}).listen(5192, '127.0.0.1', () => console.log('오늘의 연금번호: http://127.0.0.1:5192'));

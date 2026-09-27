import { createServer } from 'node:http';
import { createWallClock } from '@enormora/wall-clock/wall-clock';
import { createMockServer, type HttpResponseWriter } from './create-mock-server';
import { HttpStatus, type HttpRequest } from './decide-mock-response';
import { loadSnapshot } from './load-snapshot';

const defaultMockPort = 4010;
const highestTcpPort = 65_535;

function readPort(): number {
  const raw = process.env.MOCK_PORT;
  if (typeof raw !== 'string') {
    return defaultMockPort;
  }
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > highestTcpPort || String(parsed) !== raw) {
    return defaultMockPort;
  }
  return parsed;
}

function listen(port: number, handleRequest: (request: HttpRequest, response: HttpResponseWriter) => void): void {
  const server = createServer(function handle(request, response) {
    const { method, url } = request;
    if (typeof method !== 'string' || typeof url !== 'string') {
      response.writeHead(HttpStatus.badRequest, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ error: 'invalidQuery' }));
      return;
    }
    handleRequest({ method, url }, response);
  });
  server.listen(port, '127.0.0.1', function listening() {
    console.log(`Mock server listening on http://127.0.0.1:${port}`);
  });
}

async function main(): Promise<void> {
  const port = readPort();
  const snapshot = await loadSnapshot();
  if (snapshot.type === 'failure') {
    console.error(snapshot.message);
    process.exitCode = 1;
    return;
  }
  const wallClock = createWallClock();
  const handleRequest = createMockServer({
    posts: snapshot.posts,
    images: snapshot.images,
    schedule: function schedule(delayInMilliseconds, send) {
      wallClock.setTimeout(send, delayInMilliseconds);
    }
  });
  listen(port, handleRequest);
}

await main();

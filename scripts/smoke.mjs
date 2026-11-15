// Testa o PACOTE gerado no CI: front-end e back-end juntos, via HTTP.
import { mkdtemp, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { once } from 'node:events';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';

const raiz = path.resolve(process.env.BUNDLE_DIR || 'pacote');
const { criarServidor } = await import(pathToFileURL(path.join(raiz, 'backend', 'server.mjs')).href);
const pastaTemp = await mkdtemp(path.join(os.tmpdir(), 'adota-pet-smoke-'));
const servidor = criarServidor({ dataFile: path.join(pastaTemp, 'db.json'), publicDir: path.join(raiz, 'frontend') });
try {
  servidor.listen(0, '127.0.0.1');
  await once(servidor, 'listening');
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const pagina = await fetch(base);
  assert.equal(pagina.status, 200);
  assert.match(await pagina.text(), /AdotaPet/);
  const css = await fetch(`${base}/styles.css`);
  assert.equal(css.status, 200);
  const js = await fetch(`${base}/app.js`);
  assert.equal(js.status, 200);
  const resposta = await fetch(`${base}/api/pets`);
  assert.equal(resposta.status, 200);
  const { pets } = await resposta.json();
  assert.ok(pets.length > 0);
  console.log('Smoke test passou: página, CSS, JS e API disponíveis.');
} finally {
  await new Promise((resolve) => servidor.close(resolve));
  await rm(pastaTemp, { recursive: true, force: true });
}

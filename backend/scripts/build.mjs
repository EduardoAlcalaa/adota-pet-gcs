import { cp, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'dist');
await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
for (const arquivo of ['server.mjs', 'store.mjs', 'package.json']) {
  await cp(path.join(raiz, arquivo), path.join(destino, arquivo));
}
console.log(`Build do back-end pronto em ${destino}`);

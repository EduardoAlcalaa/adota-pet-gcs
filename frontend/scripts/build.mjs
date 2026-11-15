import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'dist');
await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });
for (const arquivo of ['index.html', 'styles.css', 'app.js', 'logic.mjs']) {
  await stat(path.join(raiz, arquivo));
  await cp(path.join(raiz, arquivo), path.join(destino, arquivo));
}
console.log(`Build do front-end pronto em ${destino}`);

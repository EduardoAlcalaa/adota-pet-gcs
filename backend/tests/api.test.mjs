import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { criarServidor } from '../server.mjs';

async function preparar(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'adota-pet-test-'));
  const server = criarServidor({ dataFile: path.join(dir, 'dados.json'), publicDir: null });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(dir, { recursive: true, force: true });
  });
  return { base: `http://127.0.0.1:${server.address().port}`, file: path.join(dir, 'dados.json') };
}
const post = (dados) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) });

test('inicializa pets e fornece estatísticas da API', async (t) => {
  const { base } = await preparar(t);
  const pets = await (await fetch(`${base}/api/pets`)).json();
  const stats = await (await fetch(`${base}/api/stats`)).json();
  assert.equal(pets.pets.length, 6);
  assert.deepEqual(stats, { total: 6, available: 6, adopted: 0 });
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { status: 'ok' });
});

test('cadastra pet, registra adoção e bloqueia adoção duplicada', async (t) => {
  const { base, file } = await preparar(t);
  const novo = await fetch(`${base}/api/pets`, post({ name: 'Sol', species: 'gato', age: 1, city: 'Joinville', description: 'Bem tranquila' }));
  assert.equal(novo.status, 201);
  const { pet } = await novo.json();
  const url = `${base}/api/pets/${pet.id}/adopt`;
  const body = { adopterName: 'Pessoa Exemplo', adopterContact: 'exemplo@exemplo.invalid' };
  const primeiro = await fetch(url, post(body));
  assert.equal(primeiro.status, 201);
  const segundo = await fetch(url, post(body));
  assert.equal(segundo.status, 409);
  const stats = await (await fetch(`${base}/api/stats`)).json();
  assert.deepEqual(stats, { total: 7, available: 6, adopted: 1 });
  const historico = await (await fetch(`${base}/api/adoptions`)).json();
  assert.equal(historico.adoptions[0].petName, 'Sol');
  const salvo = JSON.parse(await readFile(file, 'utf8'));
  assert.equal(salvo.adoptions.length, 1);
});

test('recusa cadastro inválido e ID inexistente', async (t) => {
  const { base } = await preparar(t);
  const invalido = await fetch(`${base}/api/pets`, post({ name: '', species: 'cao', age: -1, city: 'X', description: 'X' }));
  assert.equal(invalido.status, 400);
  const inexistente = await fetch(`${base}/api/pets/00000000-0000-0000-0000-000000000000/adopt`, post({ adopterName: 'Exemplo', adopterContact: 'contato.invalid' }));
  assert.equal(inexistente.status, 404);
});


test('filtra pets por espécie e situação e rejeita filtros inválidos', async (t) => {
  const { base } = await preparar(t);
  const gatos = await fetch(`${base}/api/pets?species=gato&status=disponivel`);
  assert.equal(gatos.status, 200);
  const { pets } = await gatos.json();
  assert.equal(pets.length, 2);
  assert.ok(pets.every((p) => p.species === 'gato' && p.status === 'disponivel'));

  const invalidaEspecie = await fetch(`${base}/api/pets?species=dragao`);
  assert.equal(invalidaEspecie.status, 400);
  assert.match((await invalidaEspecie.json()).error, /espécie/i);
  const invalidaSituacao = await fetch(`${base}/api/pets?status=pendente`);
  assert.equal(invalidaSituacao.status, 400);

  const semFiltro = await (await fetch(`${base}/api/pets`)).json();
  assert.equal(semFiltro.pets.length, 6);
});

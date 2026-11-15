import http from 'node:http';
import path from 'node:path';
import { existsSync, createReadStream } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { criarRepositorio } from './store.mjs';

const PASTA_ATUAL = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = process.env.FRONTEND_DIR || [
  path.resolve(PASTA_ATUAL, '../frontend'),
  path.resolve(PASTA_ATUAL, '../frontend/dist')
].find((pasta) => existsSync(path.join(pasta, 'index.html')));
const DATA_FILE = process.env.DATA_FILE || path.join(PASTA_ATUAL, 'data', 'database.json');

class ErroHttp extends Error {
  constructor(status, mensagem) { super(mensagem); this.status = status; }
}

const responder = (res, status, dados) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(dados));
};

function campoTexto(valor, nome, limite = 120) {
  if (typeof valor !== 'string' || !valor.trim() || valor.trim().length > limite) {
    throw new ErroHttp(400, `${nome} deve ter entre 1 e ${limite} caracteres.`);
  }
  return valor.trim();
}

async function lerCorpo(req) {
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    throw new ErroHttp(415, 'Envie os dados como application/json.');
  }
  const partes = [];
  let tamanho = 0;
  for await (const parte of req) {
    tamanho += parte.length;
    if (tamanho > 16_384) throw new ErroHttp(413, 'Dados muito grandes.');
    partes.push(parte);
  }
  try {
    const dados = JSON.parse(Buffer.concat(partes).toString('utf8'));
    if (!dados || Array.isArray(dados) || typeof dados !== 'object') throw new Error('Objeto esperado');
    return dados;
  } catch { throw new ErroHttp(400, 'JSON inválido.'); }
}

function validarNovoPet(dados) {
  const species = campoTexto(dados.species, 'Espécie', 10);
  if (!['cao', 'gato', 'outro'].includes(species)) throw new ErroHttp(400, 'Espécie inválida.');
  const age = Number(dados.age);
  if (!Number.isInteger(age) || age < 0 || age > 30) throw new ErroHttp(400, 'Idade deve ser de 0 a 30 anos.');
  return {
    id: randomUUID(),
    name: campoTexto(dados.name, 'Nome', 60), species, age,
    city: campoTexto(dados.city, 'Cidade', 60),
    description: campoTexto(dados.description, 'Descrição', 250),
    color: ({ cao: 'peach', gato: 'lavender', outro: 'mint' })[species],
    status: 'disponivel', createdAt: new Date().toISOString()
  };
}

function arquivoEstatico(req, res, pathname, pastaPublica) {
  const arquivos = new Map([
    ['/', ['index.html', 'text/html; charset=utf-8']],
    ['/index.html', ['index.html', 'text/html; charset=utf-8']],
    ['/styles.css', ['styles.css', 'text/css; charset=utf-8']],
    ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
    ['/logic.mjs', ['logic.mjs', 'text/javascript; charset=utf-8']]
  ]);
  const configuracao = arquivos.get(pathname);
  if (!configuracao || !pastaPublica) return false;
  const arquivo = path.join(pastaPublica, configuracao[0]);
  if (!existsSync(arquivo)) return false;
  res.writeHead(200, { 'Content-Type': configuracao[1], 'X-Content-Type-Options': 'nosniff' });
  if (req.method === 'HEAD') { res.end(); return true; }
  createReadStream(arquivo).pipe(res);
  return true;
}

export function criarServidor({ dataFile = DATA_FILE, publicDir = PUBLIC_DIR } = {}) {
  const repositorio = criarRepositorio(dataFile);
  return http.createServer(async (req, res) => {
    let pathname;
    try {
      const endereco = new URL(req.url, 'http://localhost');
      pathname = endereco.pathname;
      if (req.method === 'GET' && pathname === '/api/health') return responder(res, 200, { status: 'ok' });
      if (req.method === 'GET' && pathname === '/api/pets') {
        // Filtros opcionais de API: GET /api/pets?species=gato&status=disponivel
        const species = endereco.searchParams.get('species');
        const status = endereco.searchParams.get('status');
        if (species !== null && !['cao', 'gato', 'outro'].includes(species)) {
          throw new ErroHttp(400, 'Filtro de espécie inválido.');
        }
        if (status !== null && !['disponivel', 'adotado'].includes(status)) {
          throw new ErroHttp(400, 'Filtro de situação inválido.');
        }
        const dados = await repositorio.ler();
        const pets = dados.pets.filter((pet) =>
          (species === null || pet.species === species) &&
          (status === null || pet.status === status)
        );
        return responder(res, 200, { pets });
      }
      if (req.method === 'GET' && pathname === '/api/adoptions') {
        const dados = await repositorio.ler();
        return responder(res, 200, { adoptions: dados.adoptions.slice().reverse().map(({ id, petId, petName, adopterName, createdAt }) => ({ id, petId, petName, adopterName, createdAt })) });
      }
      if (req.method === 'GET' && pathname === '/api/stats') {
        const { pets, adoptions } = await repositorio.ler();
        return responder(res, 200, { total: pets.length, available: pets.filter((p) => p.status === 'disponivel').length, adopted: adoptions.length });
      }
      if (req.method === 'POST' && pathname === '/api/pets') {
        const novo = validarNovoPet(await lerCorpo(req));
        await repositorio.alterar((dados) => { dados.pets.push(novo); });
        return responder(res, 201, { pet: novo });
      }
      const adotando = pathname.match(/^\/api\/pets\/([0-9a-f-]+)\/adopt$/);
      if (req.method === 'POST' && adotando) {
        const body = await lerCorpo(req);
        const adopterName = campoTexto(body.adopterName, 'Nome do responsável', 100);
        const adopterContact = campoTexto(body.adopterContact, 'Contato', 120);
        const adocao = await repositorio.alterar((dados) => {
          const pet = dados.pets.find((item) => item.id === adotando[1]);
          if (!pet) throw new ErroHttp(404, 'Animal não encontrado.');
          if (pet.status === 'adotado') throw new ErroHttp(409, 'Este animal já foi adotado.');
          pet.status = 'adotado';
          const novo = { id: randomUUID(), petId: pet.id, petName: pet.name, adopterName, adopterContact, createdAt: new Date().toISOString() };
          dados.adoptions.push(novo);
          return novo;
        });
        return responder(res, 201, { adoption: adocao });
      }
      if ((req.method === 'GET' || req.method === 'HEAD') && arquivoEstatico(req, res, pathname, publicDir)) return;
      if (pathname.startsWith('/api/')) return responder(res, 404, { error: 'Rota da API não encontrada.' });
      return responder(res, 404, { error: 'Página não encontrada.' });
    } catch (erro) {
      if (!erro.status) console.error('[API]', erro);
      if (!res.headersSent) responder(res, erro.status || 500, { error: erro.status ? erro.message : 'Erro interno do servidor.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT inválida');
  criarServidor().listen(port, () => console.log(`AdotaPet em http://localhost:${port}`));
}

import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const SEEDS = [
  { name: 'Amora', species: 'cao', age: 2, city: 'Joinville', description: 'Adora passear e brincar. Procura uma família cheia de carinho.', color: 'rose' },
  { name: 'Nino', species: 'gato', age: 1, city: 'Joinville', description: 'Curioso, tranquilo e fã de uma boa soneca no sofá.', color: 'lavender' },
  { name: 'Biscoito', species: 'cao', age: 3, city: 'Curitiba', description: 'Um companheiro alegre que ama receber atenção.', color: 'peach' },
  { name: 'Lua', species: 'gato', age: 2, city: 'Blumenau', description: 'Carinhosa, gosta de cantinhos ensolarados.', color: 'mint' },
  { name: 'Pipoca', species: 'outro', age: 1, city: 'Joinville', description: 'Coelhinha gentil e cheia de energia.', color: 'yellow' },
  { name: 'Theo', species: 'cao', age: 4, city: 'Florianópolis', description: 'Calmo e sociável, perfeito para passeios no parque.', color: 'blue' }
];

export function estadoInicial() {
  return {
    pets: SEEDS.map((pet) => ({ id: randomUUID(), ...pet, status: 'disponivel', createdAt: new Date().toISOString() })),
    adoptions: []
  };
}

export function criarRepositorio(caminhoArquivo) {
  let fila = Promise.resolve();

  async function ler() {
    try {
      return JSON.parse(await readFile(caminhoArquivo, 'utf8'));
    } catch (erro) {
      if (erro.code !== 'ENOENT') throw erro;
      const inicial = estadoInicial();
      await salvar(inicial);
      return inicial;
    }
  }

  async function salvar(dados) {
    await mkdir(path.dirname(caminhoArquivo), { recursive: true });
    const temporario = `${caminhoArquivo}.${randomUUID()}.tmp`;
    await writeFile(temporario, JSON.stringify(dados, null, 2), { encoding: 'utf8', mode: 0o600 });
    await rename(temporario, caminhoArquivo);
  }

  // As operações de gravação são serializadas, evitando duas adoções do mesmo animal.
  function alterar(mutacao) {
    const operacao = fila.then(async () => {
      const dados = await ler();
      const resultado = mutacao(dados);
      await salvar(dados);
      return resultado;
    });
    fila = operacao.catch(() => {});
    return operacao;
  }

  return { ler, alterar };
}

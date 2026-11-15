import test from 'node:test';
import assert from 'node:assert/strict';
import { filtrarPets, idadeTexto, especieTexto } from '../logic.mjs';

const animais = [
  { name: 'Bento', species: 'cao', status: 'disponivel', city: 'Joinville', description: 'Calmo' },
  { name: 'Mimi', species: 'gato', status: 'adotado', city: 'Curitiba', description: 'Carinhosa' },
  { name: 'Luna', species: 'gato', status: 'disponivel', city: 'Joinville', description: 'Brincalhona' }
];

test('mostra apenas disponíveis por padrão', () => {
  assert.deepEqual(filtrarPets(animais).map((p) => p.name), ['Bento', 'Luna']);
});
test('combina filtro de espécie e busca sem diferenciar maiúsculas', () => {
  assert.deepEqual(filtrarPets(animais, { especie: 'gato', busca: 'JOINVILLE' }).map((p) => p.name), ['Luna']);
});
test('permite consultar animais adotados', () => {
  assert.deepEqual(filtrarPets(animais, { situacao: 'adotado' }).map((p) => p.name), ['Mimi']);
});
test('formata idade e espécie', () => {
  assert.equal(idadeTexto(1), '1 ano');
  assert.equal(idadeTexto(3), '3 anos');
  assert.equal(especieTexto('cao'), 'Cachorro');
});

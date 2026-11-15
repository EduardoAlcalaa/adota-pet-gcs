import { filtrarPets, idadeTexto, especieTexto, dataTexto } from './logic.mjs';

const $ = (seletor) => document.querySelector(seletor);
const estado = { pets: [], adoptions: [], petSelecionado: null };
const emojiPorEspecie = { cao: '🐶', gato: '🐱', outro: '🐰' };
let timeoutToast;

async function requisitar(rota, opcoes = {}) {
  let resposta;
  try {
    resposta = await fetch(rota, {
      ...opcoes,
      headers: { 'Content-Type': 'application/json', ...(opcoes.headers || {}) }
    });
  } catch { throw new Error('Não foi possível conectar ao servidor.'); }
  let conteudo;
  try { conteudo = await resposta.json(); } catch { throw new Error('Resposta inesperada do servidor.'); }
  if (!resposta.ok) throw new Error(conteudo.error || 'Ocorreu um erro.');
  return conteudo;
}

function mostrarToast(mensagem) {
  const toast = $('#toast');
  toast.textContent = mensagem;
  toast.classList.add('show');
  clearTimeout(timeoutToast);
  timeoutToast = setTimeout(() => toast.classList.remove('show'), 3800);
}

function preencherTexto(elemento, seletor, valor) {
  elemento.querySelector(seletor).textContent = valor;
}

function criarCard(pet) {
  const elemento = document.createElement('article');
  elemento.className = 'pet-card';
  elemento.innerHTML = `
    <div class="pet-illustration" data-color="peach"><span class="chip"></span><span class="pet-emoji" aria-hidden="true"></span><span class="mini-heart" aria-hidden="true">♥</span></div>
    <div class="pet-card-content"><div class="pet-card-top"><h3></h3><span class="pet-species"></span></div><div class="pet-meta"><span class="age"></span><span class="city"></span></div><p class="pet-description"></p><button type="button" class="pet-action"><span></span><span aria-hidden="true">↗</span></button></div>`;
  const visual = elemento.querySelector('.pet-illustration');
  visual.dataset.color = ['rose', 'lavender', 'peach', 'mint', 'yellow', 'blue'].includes(pet.color) ? pet.color : 'peach';
  preencherTexto(elemento, '.chip', pet.status === 'adotado' ? '✓ ADOTADO' : '♥ DISPONÍVEL');
  if (pet.status === 'adotado') elemento.querySelector('.chip').classList.add('adopted');
  preencherTexto(elemento, '.pet-emoji', emojiPorEspecie[pet.species] || '🐾');
  preencherTexto(elemento, 'h3', pet.name);
  preencherTexto(elemento, '.pet-species', especieTexto(pet.species));
  preencherTexto(elemento, '.age', `◷ ${idadeTexto(pet.age)}`);
  preencherTexto(elemento, '.city', `⌖ ${pet.city}`);
  preencherTexto(elemento, '.pet-description', pet.description);
  const botao = elemento.querySelector('button');
  botao.disabled = pet.status === 'adotado';
  preencherTexto(elemento, '.pet-action span', pet.status === 'adotado' ? 'Já encontrou um lar' : 'Registrar adoção');
  if (!botao.disabled) botao.addEventListener('click', () => abrirAdocao(pet));
  return elemento;
}

function renderizarPets() {
  const filtros = { busca: $('#searchPets').value, especie: $('#filterSpecies').value, situacao: $('#filterStatus').value };
  const encontrados = filtrarPets(estado.pets, filtros);
  const grade = $('#petGrid');
  grade.replaceChildren(...encontrados.map(criarCard));
  $('#resultsCount').textContent = `${encontrados.length} ${encontrados.length === 1 ? 'amigo encontrado' : 'amigos encontrados'}`;
  $('#emptyPets').hidden = encontrados.length !== 0;
}

function renderizarHistorico() {
  const lista = $('#adoptionsList');
  lista.replaceChildren();
  if (estado.adoptions.length === 0) {
    const vazio = document.createElement('div');
    vazio.className = 'history-empty';
    vazio.textContent = 'Nenhuma adoção foi registrada ainda. A primeira história feliz pode começar hoje!';
    lista.append(vazio);
    return;
  }
  for (const adocao of estado.adoptions) {
    const item = document.createElement('article');
    item.className = 'adoption-item';
    item.innerHTML = '<div class="adoption-item-main"><span class="adoption-icon">♥</span><div><strong></strong><span></span></div></div><time></time>';
    preencherTexto(item, 'strong', `${adocao.petName} encontrou um lar!`);
    preencherTexto(item, '.adoption-item-main div span', `Responsável: ${adocao.adopterName}`);
    const tempo = item.querySelector('time');
    tempo.dateTime = adocao.createdAt;
    tempo.textContent = dataTexto(adocao.createdAt);
    lista.append(item);
  }
}

async function atualizar() {
  const [pets, adoptions, stats] = await Promise.all([
    requisitar('/api/pets'), requisitar('/api/adoptions'), requisitar('/api/stats')
  ]);
  estado.pets = pets.pets;
  estado.adoptions = adoptions.adoptions;
  $('#statTotal').textContent = stats.total;
  $('#statAvailable').textContent = stats.available;
  $('#statAdopted').textContent = stats.adopted;
  renderizarPets();
  renderizarHistorico();
}

function abrirAdocao(pet) {
  estado.petSelecionado = pet;
  $('#adoptForm').reset();
  $('#adoptError').textContent = '';
  $('#adoptSubtitle').textContent = `Você está registrando a adoção de ${pet.name}. Use informações fictícias nesta demonstração.`;
  $('#adoptDialog').showModal();
}

function abrirCadastro() {
  $('#registerForm').reset();
  $('#registerError').textContent = '';
  $('#registerDialog').showModal();
}

for (const id of ['#openRegisterTop', '#openRegisterBottom']) $(id).addEventListener('click', abrirCadastro);
for (const botao of document.querySelectorAll('.close-modal')) botao.addEventListener('click', () => botao.closest('dialog').close());
for (const campo of ['#searchPets', '#filterSpecies', '#filterStatus']) {
  $(campo).addEventListener(campo === '#searchPets' ? 'input' : 'change', renderizarPets);
}

$('#registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const botao = form.querySelector('button[type=submit]');
  $('#registerError').textContent = '';
  const dados = Object.fromEntries(new FormData(form));
  dados.age = Number(dados.age);
  botao.disabled = true;
  try {
    await requisitar('/api/pets', { method: 'POST', body: JSON.stringify(dados) });
    $('#registerDialog').close();
    $('#filterStatus').value = 'disponivel';
    $('#filterSpecies').value = 'todos';
    $('#searchPets').value = '';
    await atualizar();
    mostrarToast('Pet cadastrado com sucesso!');
    location.hash = '#animais';
  } catch (erro) { $('#registerError').textContent = erro.message; }
  finally { botao.disabled = false; }
});

$('#adoptForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!estado.petSelecionado) return;
  const form = event.currentTarget;
  const botao = form.querySelector('button[type=submit]');
  const dados = Object.fromEntries(new FormData(form));
  $('#adoptError').textContent = '';
  botao.disabled = true;
  try {
    await requisitar(`/api/pets/${estado.petSelecionado.id}/adopt`, { method: 'POST', body: JSON.stringify(dados) });
    $('#adoptDialog').close();
    await atualizar();
    mostrarToast('Adoção registrada! ♥');
  } catch (erro) { $('#adoptError').textContent = erro.message; }
  finally { botao.disabled = false; }
});

atualizar().catch((erro) => {
  $('#resultsCount').textContent = 'Não foi possível carregar os animais.';
  const aviso = document.createElement('div');
  aviso.className = 'history-empty';
  aviso.textContent = erro.message + ' Inicie o back-end e atualize a página.';
  $('#petGrid').replaceChildren(aviso);
  mostrarToast(erro.message);
});

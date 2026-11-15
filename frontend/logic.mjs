export function filtrarPets(pets, { busca = '', especie = 'todos', situacao = 'disponivel' } = {}) {
  const termo = String(busca).trim().toLocaleLowerCase('pt-BR');
  return pets.filter((pet) => {
    const correspondeEspecie = especie === 'todos' || pet.species === especie;
    const correspondeSituacao = situacao === 'todos' || pet.status === situacao;
    const texto = `${pet.name} ${pet.city} ${pet.description}`.toLocaleLowerCase('pt-BR');
    return correspondeEspecie && correspondeSituacao && (!termo || texto.includes(termo));
  });
}

export function idadeTexto(anos) {
  return Number(anos) === 1 ? '1 ano' : `${Number(anos)} anos`;
}

export function especieTexto(especie) {
  return ({ cao: 'Cachorro', gato: 'Gato', outro: 'Outro pet' })[especie] || 'Pet';
}

export function dataTexto(iso) {
  const data = new Date(iso);
  return Number.isNaN(data.getTime()) ? 'Data indisponível' : new Intl.DateTimeFormat('pt-BR').format(data);
}

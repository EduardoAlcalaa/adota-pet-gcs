# AdotaPet — Projeto de GCS

Sistema web demonstrativo de uma ONG para **cadastrar animais**, **listar pets disponíveis** e **registrar adoções**, com front-end e back-end independentes e automação de builds pelo GitHub Actions.

![Status](https://img.shields.io/badge/Projeto-GCS%20acad%C3%AAmico-f4775c)

## Comece aqui

Requisito: **Node.js 22+**. Abra a pasta raiz no VS Code e execute:

```bash
node backend/server.mjs
```

Visite **http://localhost:3000**. Não é necessário instalar pacotes nem usar banco de dados externo.

### Estrutura do repositório

```text
adota-pet-gcs/
├── .github/
│   ├── workflows/ci.yml             # Pipeline automatizado
│   └── pull_request_template.md     # Checklist de revisão
├── frontend/
│   ├── index.html                    # Interface
│   ├── styles.css                    # Design responsivo
│   ├── app.js                        # Consumo da API e formulários
│   ├── logic.mjs                     # Regras de filtros
│   ├── tests/                        # Testes de interface
│   └── scripts/build.mjs             # Build do módulo
├── backend/
│   ├── server.mjs                    # Servidor web e rotas REST
│   ├── store.mjs                     # Persistência e dados de exemplo
│   ├── data/                         # Dados locais (não versionados)
│   ├── tests/                        # Testes da API
│   └── scripts/build.mjs             # Build do módulo
├── scripts/smoke.mjs                 # Teste do pacote integrado
└── docs/
    ├── ESTRATEGIA_GCS.md            # Texto da atividade + fluxograma
    ├── GUIA_GITHUB.md               # Publicação passo a passo
    └── EXECUTAR_BUILD.md            # Como executar o artefato da CI
```

## API

| Método | Endpoint | Função |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica funcionamento |
| `GET` | `/api/pets` | Lista animais |
| `GET` | `/api/stats` | Retorna indicadores |
| `GET` | `/api/adoptions` | Consulta adoções |
| `POST` | `/api/pets` | Cadastra novo animal |
| `POST` | `/api/pets/:id/adopt` | Registra adoção |

## Testes e builds locais

```bash
npm --prefix frontend test
npm --prefix backend test
npm --prefix frontend run build
npm --prefix backend run build
```

O pipeline `.github/workflows/ci.yml` executa esses passos automaticamente em commits, PRs e tags `v*`. Ele combina os dois módulos, executa um teste HTTP do pacote final e publica três artefatos por SHA para download.

## Documentos para a disciplina

- **[Estratégia de GCS e workflow](docs/ESTRATEGIA_GCS.md)**: resposta pronta como base para a atividade, branches, controle de artefatos, diagramas e critérios de build.
- **[Guia completo de GitHub](docs/GUIA_GITHUB.md)**: executar, criar repositório, `git push`, abrir PR, configurar checks e baixar builds.
- **[Como executar o pacote integrado](docs/EXECUTAR_BUILD.md)**.

> **Atenção:** protótipo didático, sem autenticação e com armazenamento local JSON. Insira **somente dados fictícios**, especialmente nos contatos de adotantes. Não adequado para produção com dados pessoais reais.

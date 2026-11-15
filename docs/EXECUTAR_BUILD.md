# Como executar o pacote gerado pelo GitHub Actions

Estrutura esperada depois de extrair o artefato `adota-pet-completo-<commit>`:

- `frontend/index.html`, `frontend/app.js`, `frontend/styles.css`, `frontend/logic.mjs`
- `backend/server.mjs`, `backend/store.mjs`, `backend/package.json`

Requisitos: Node.js 22 ou superior.

Na pasta onde estão `frontend/` e `backend/`, execute:

```bash
node backend/server.mjs
```

Acesse **http://localhost:3000**.

O servidor cria `backend/data/database.json` quando necessário. Esse arquivo contém dados locais e não deve ser enviado para o GitHub.

**Importante:** este é um protótipo acadêmico, sem login nem gestão de consentimento. Use contatos fictícios e não coloque a aplicação em produção com informações reais.

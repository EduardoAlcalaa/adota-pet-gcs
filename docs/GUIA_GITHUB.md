# Guia: executar, publicar no GitHub e trabalhar em dupla

## 1. Preparar o computador

Instale **Git** e **Node.js 22 ou superior**. Extraia o ZIP deste projeto. Abra o VS Code e escolha **Arquivo > Abrir Pasta**, selecionando a pasta `adota-pet-gcs` (a pasta que contém `frontend`, `backend` e `.github`).

No terminal integrado do VS Code (Terminal > Novo Terminal), confirme:

```bash
git --version
node --version
```

## 2. Executar a aplicação

Ainda na pasta raiz `adota-pet-gcs`:

```bash
node backend/server.mjs
```

No navegador, abra **http://localhost:3000**. O servidor entrega a página e a API no mesmo endereço. Para encerrar, pressione `Ctrl + C` no terminal.

Experimente cadastrar um animal e registrar uma adoção **com nome e contato fictícios**. Os dados são salvos localmente em `backend/data/database.json`, arquivo ignorado pelo Git.

## 3. Rodar os testes e os builds manualmente

```bash
npm --prefix frontend test
npm --prefix backend test
npm --prefix frontend run build
npm --prefix backend run build
```

Esses comandos geram `frontend/dist/` e `backend/dist/`. As pastas `dist/` são geradas de novo no GitHub Actions e não precisam ser enviadas para o repositório.

## 4. Criar o repositório no GitHub

1. Entre em [github.com](https://github.com) e acesse sua conta.
2. Clique no botão `+` > **New repository**.
3. Nome: **adota-pet-gcs**; descrição: `Sistema web de adoção de animais - atividade GCS`.
4. Escolha **Public** apenas se o projeto não contiver informações sensíveis (como neste exemplo) ou **Private** para restringir o acesso.
5. **Não marque** Initialize with README, Add .gitignore ou Choose a license, pois esses arquivos já estão no projeto.
6. Clique em **Create repository**. Deixe a página aberta para copiar a URL HTTPS do novo repositório.

## 5. Enviar o projeto pelo terminal do VS Code

Na pasta raiz do projeto, substitua `SEU_USUARIO` pelo seu login real:

```bash
git init -b main
git add .
git commit -m "feat: versão inicial do sistema de adoção"
git remote add origin https://github.com/SEU_USUARIO/adota-pet-gcs.git
git push -u origin main
```

O Git pode abrir uma janela de login no navegador; autorize a autenticação. Se pedir usuário e senha, utilize a forma de autenticação permitida pelo Git Credential Manager/GitHub; não envie sua senha para ninguém.

Se o Git reclamar que nome ou e-mail não foram configurados, configure com os dados que você deseja associar aos commits:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "email-que-usa-no-github@exemplo.com"
```

Depois, execute novamente o comando `git commit` e o `git push`.

> Se aparecer `remote origin already exists`, não adicione o remote outra vez. Confira com `git remote -v`.

## 6. Criar a branch de integração e convidar o colega

```bash
git switch -c develop
git push -u origin develop
```

No GitHub, acesse **Settings > Collaborators** (ou **Collaborators and teams**) e convide a pessoa da sua dupla, se tiver permissão. O colega aceita o convite e clona o repositório:

```bash
git clone https://github.com/SEU_USUARIO/adota-pet-gcs.git
cd adota-pet-gcs
git switch develop
```

## 7. Trabalhar em funcionalidades sem mexer direto na main

Exemplo para quem cuida do front-end:

```bash
git switch develop
git pull origin develop
git switch -c feature/frontend/melhorar-catalogo
# editar arquivos em frontend/
git add .
git commit -m "feat(frontend): melhorar catálogo de animais"
git push -u origin feature/frontend/melhorar-catalogo
```

Exemplo para quem cuida do back-end:

```bash
git switch develop
git pull origin develop
git switch -c feature/backend/validar-adocoes
# editar arquivos em backend/
git add .
git commit -m "feat(backend): validar registro de adoção"
git push -u origin feature/backend/validar-adocoes
```

No GitHub, clique em **Compare & pull request**. Selecione como destino **`develop`**, descreva a alteração e solicite revisão ao colega. O GitHub Actions executará os testes e builds. Se tudo passar, o colega revisa e aprova o merge.

**Atenção:** criar a branch diretamente de `main` em vez de `develop` pode fazer o PR não incluir alterações recentes da equipe.

## 8. Acompanhar o workflow e baixar as builds

1. No repositório, abra a aba **Actions**.
2. Clique no workflow **GCS - Testes e Builds**.
3. Abra a execução correspondente ao commit ou Pull Request.
4. Verifique se as tarefas `Front-end - teste e build`, `Back-end - teste e build` e `Integração - smoke test e pacote final` ficaram verdes.
5. No fim da página da execução, vá até **Artifacts**.
6. Baixe `adota-pet-completo-<SHA>`. Extraia o pacote e execute `node backend/server.mjs` na pasta extraída.

O SHA no nome do artefato indica o commit usado na geração. Se algum teste falhar, abra o job em vermelho para ler o motivo, corrija a branch e envie novo commit.

## 9. Proteger a main e concluir uma versão

No GitHub, em **Settings > Branches** ou **Settings > Rules > Rulesets** (conforme a interface/permissões), configure a regra para `main` exigindo Pull Request antes do merge, uma revisão aprovada e status checks bem-sucedidos. Após a primeira execução, selecione como checks obrigatórios os jobs de **front-end**, **back-end** e **integração**; seus nomes aparecem no relatório do Actions. Aplique regra semelhante a `develop` se disponível.

Quando `develop` estiver pronta, faça um PR de `develop` para `main`. Após aprovação e merge, crie uma tag de versão:

```bash
git switch main
git pull origin main
git tag -a v1.0.0 -m "Primeira versão estável"
git push origin v1.0.0
```

A tag gera uma nova execução com os builds daquela versão. Se quiser, use a aba **Releases** para associar um lançamento à tag e documentar as mudanças.

## 10. Evidências recomendadas para entregar na disciplina

Tire capturas da estrutura do repositório, das branches `main` e `develop`, de um Pull Request com revisão, da execução verde do GitHub Actions e da lista de artefatos gerados. Apresente também o fluxograma e a estratégia descritos em `docs/ESTRATEGIA_GCS.md`.

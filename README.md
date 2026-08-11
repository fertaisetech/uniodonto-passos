# Dashboard Executivo Uniodonto

## Documentação

- [Guia completo do Portal](docs/GUIA-COMPLETO.md)
- [Plano de implementação e entrega](docs/PLANO-IMPLEMENTACAO.md)

Este é o projeto do Dashboard Executivo para a Uniodonto, desenvolvido com stack moderna e robusta para alta performance e escalabilidade.

## Tecnologias (Stack)
- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Recharts, TanStack Query, React Router, Lucide Icons, Zod.
- **Backend**: Node.js com Express e TypeScript.
- **Integrações**: Firebase Authentication (Google Workspace) e Google Sheets API.

## Funcionalidades
- **Interface Responsiva**: Adaptada para Desktop, Tablet e Mobile com visualizações dinâmicas (sidebar lateral expansível e barra de navegação inferior).
- **Dados Executivos (Mocks e Reais)**: Alternância simplificada através de variáveis de ambiente.
- **Autenticação**: Integrado ao Firebase Auth, exclusivo para usuários providos nas configurações.

## Variáveis de Ambiente
O projeto exige o preenchimento das seguintes variáveis, definidas em `.env.example`:
- `GOOGLE_PROJECT_ID`: ID do projeto no Google Cloud.
- `GOOGLE_CLIENT_EMAIL`: Email da Service Account.
- `GOOGLE_PRIVATE_KEY`: Chave privada JSON ("replace \n with actual newlines").
- `GOOGLE_SPREADSHEET_ID`: O ID da planilha do Google que servirá como banco de dados.
- `GOOGLE_MONTHLY_SHEET_NAME`: Nome da aba mensal com os consolidadores em JSON. Padrão: `monthly_dashboard`.

## Formato esperado da aba mensal
O backend Express lê a aba `monthly_dashboard` com uma linha por mês. As colunas podem usar estes nomes:
- `month`
- `summary_json`
- `beneficiaries_json`
- `funnel_json`
- `nps_json`
- `investments_json`
- `metrics_json`

Cada coluna `*_json` deve conter um JSON válido no formato que o painel já consome.

## Passos de Instalação e Execução

### 1. Preparando o Ambiente
1. Clone o repositório ou faça download.
2. Certifique-se de usar Node.js v18+.
3. Execute a instalação de dependências:
   ```bash
   npm install
   ```

### 2. Configurando Autenticação & Google Sheets (Backend/Service Account)
O requisito arquitetônico do projeto aponta para *Nunca acessar diretamente a Google Sheets API pelo frontend.*
Portanto, a leitura da planilha será executada pela **Service Account** no backend.

1. Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2. Crie ou selecione um projeto.
3. Acesse **APIs e Serviços > Biblioteca** e ative a **Google Sheets API**.
4. Acesse **APIs e Serviços > Credenciais**, selecione "Criar Credenciais" > "Conta de Serviço".
5. Uma conta de serviço gerará um email, ex: `meu-dashboard@seu-projeto.iam.gserviceaccount.com`. Copie-o.
6. Crie e baixe uma **Chave JSON** associada a esta conta.
7. Abra a chave JSON baixada e extraia as variáveis `project_id`, `client_email` e `private_key` para o seu arquivo `.env`.
8. Compartilhe a sua Planilha Executiva do Google (onde as abas estão) com o email da Conta de Serviço (dê permissão de "Leitor").

### 3. Rodando o Servidor (Desenvolvimento)
Execute o comando de inicialização local:
```bash
npm run dev
```

A aplicação será servida na porta 3000 (front-end HMR integrado na camada do Express).

## Instruções de Deploy
Você pode fazer deploy deste projeto em contêineres Docker (Cloud Run, Railway, Render) ou instâncias Node.js. O projeto foi projetado para "buildar" uma aplicação Full-Stack unificada.

Script de build:
```bash
npm run build
```
O Vite irá compilar o frontend React, enquanto o esbuild criará um bundle único e leve da API no arquivo `dist/server.cjs`.
Inicie em produção através de:
```bash
npm run start
```

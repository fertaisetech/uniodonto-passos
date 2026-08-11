# Portal Executivo UniOdonto — guia completo

## 1. Visão geral

O Portal Executivo UniOdonto é uma aplicação web para acompanhamento de indicadores operacionais e de marketing. O frontend usa React, TypeScript e Vite, com React Router, Recharts, Tailwind CSS e componentes Lucide. O projeto também possui um servidor Express/Node para rotas auxiliares e leitura opcional de planilhas.

O projeto Firebase de publicação é uniodonto-passos-gestao.

## 2. Telas e rotas

| Rota | Tela | Finalidade |
|---|---|---|
| / | Visão Geral | Resumo executivo dos indicadores. |
| /dashboard | Dashboard | Funil, marketing, evolução, cidades e investimentos. |
| /relatorios | Relatórios | Relatórios executivos por competência e foco. |
| /envio-integracao | Envio e Integração | Entrada e edição dos dados mensais. |
| /configuracoes | Configurações | Perfil, usuários e permissões. |
| /comunicacoes | Comunicações | Mensagens, avisos, templates e revisão de envio. |
| /app-vendas | App de Vendas | Acesso externo ao aplicativo comercial. |
| /crm | CRM | Acesso externo ao CRM. |

CRM e App de Vendas usam links centralizados em src/config/apps.ts. A configuração pública aceita VITE_CRM_URL e VITE_SALES_APP_URL; há fallbacks seguros no código.

## 3. Arquitetura

- App.tsx e Layout.tsx: rotas, shell e proteção de telas.
- Navigation.tsx: menu e links externos.
- pages/: telas de negócio.
- hooks/: estado e carregamento mensal.
- lib/dashboardData.ts: modelo, fórmulas e persistência mensal.
- lib/firebase.ts: autenticação, perfis e Storage.
- lib/operationalSpreadsheet.ts: leitura da planilha operacional.
- SafeChartContainer.tsx: dimensões seguras para gráficos.
- Firebase Authentication: login.
- Firestore: documentos compartilhados.
- Storage: fotos de perfil e equipe.
- Hosting: conteúdo de dist/.

## 4. Instalação e execução local

Requisitos: Node.js 18+, npm e Firebase CLI para publicação.

    cd C:\Users\famil\Desktop\1.10-Uniodonto\uniodonto-passos
    npm.cmd install
    npm.cmd run dev

O servidor local normalmente usa http://localhost:3000; confirme a porta na saída do processo. Para gerar e visualizar produção local:

    npm.cmd run build
    npm.cmd run preview

## 5. Variáveis e segredos

Nunca versionar senhas, tokens ou chaves privadas. O .gitignore bloqueia .env*, exceto .env.example.

    VITE_CRM_URL=https://crm.uniodontopassos.com.br/login
    VITE_SALES_APP_URL=https://app.uniodontopassos.com.br/

As rotas Express que leem Google Sheets podem exigir GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SPREADSHEET_ID, GOOGLE_MONTHLY_SHEET_NAME e GOOGLE_SHEET_CACHE_TTL. Esses valores ficam somente no ambiente do servidor.

## 6. Modelo Firebase

### accounts/{email}

Conta de login por senha: uid, email, name, role, passwordHash, updatedAt e lgpdAcceptedAt quando aplicável.

### users/{uid}

Perfil público: nome, e-mail, função, telefone, foto e atualização. O passwordHash não deve aparecer aqui.

### organizations/uniodonto/months/{monthId}

Documento mensal compartilhado por Dashboard, Visão Geral, Relatórios e Envio e Integração. Campos: month, summary, beneficiariesData, funnelData, npsData, investments, metrics, cancellationReasons, updatedAt e updatedBy.

### Usuários e permissões

- organizations/uniodonto/teamMembers/{memberId}: membros, função, status, foto e telas.
- organizations/uniodonto/roleScreens/{roleId}: permissões por função.
- organizations/uniodonto/consents/{consentId}: consentimento LGPD versionado.

### Storage

- profile-photos/{uid}/{filename}: foto do próprio perfil.
- team-member-photos/{memberId}/{filename}: fotos da equipe.

## 7. Autenticação e permissões

O login converte usuário sem @ para @uniodonto.com. A conta fertaisetech@gmail.com é Tech FerTaise e deve ser a administradora das configurações.

Permissões padrão atuais:

- Administrador e Tech FerTaise: todas as telas.
- Diretor e Gerente: Visão Geral, Dashboard e Relatórios.
- Recepção: Visão Geral, Dashboard, Comunicações e CRM.
- Vendedoras: Visão Geral, Dashboard, Comunicações, App de Vendas e CRM.
- Operador: Visão Geral e Dashboard.

Permissões persistidas em roleScreens devem prevalecer sobre os padrões. Toda mudança deve ser salva e retestada com o usuário correspondente.

## 8. Dados mensais e sincronização

Fluxo operacional:

1. Selecionar a competência em Envio e Integração.
2. Editar resumo, investimentos, marketing, cidades e cancelamentos.
3. Clicar em Salvar os dados do mês.
4. Gravar o documento no Firestore.
5. Atualizar a interface a partir do documento salvo.
6. Recarregar e conferir competência, valores, updatedAt e status remoto.

O localStorage é somente fallback de continuidade. Salvo localmente não confirma Firestore; a confirmação exige ler o documento após o salvamento, idealmente em outro navegador.

### Marketing

src/lib/metaAdsMonthlyData.ts contém os dados oficiais informados para Meta de janeiro a julho de 2026: investimento, impressões, alcance, cliques e leads.

### Investimentos

src/lib/investmentMonthlyData.ts contém a série mensal da primeira aba de investimento. getMonthlyInvestmentValues retorna uma competência ou o acumulado quando o período é Todos.

### Operacional

src/lib/operationalSpreadsheet.ts interpreta abas de cidades, entradas, cancelamentos e motivos. Dados ausentes ou parciais devem permanecer sinalizados.

## 9. Fórmulas e apresentação

- saldo líquido = entradas - cancelamentos.
- CTR = cliques / impressões.
- CPC = investimento / cliques.
- CPM = investimento / impressões x 1.000.
- custo por visualização = investimento / visualizações, somente com visualizações informadas.
- CAC deve usar a definição aprovada para o indicador.
- ROI exige receita/LTV válido e não deve ser derivado do próprio investimento.
- denominador zero ou origem ausente gera Não calculável ou Dados indisponíveis.

Formatar no padrão brasileiro: R$ 1.234,56, 2,46% e 1.070.

## 10. Segurança e LGPD

- Não versionar credenciais.
- Restringir dados mensais a usuários autenticados autorizados.
- Restringir edição de membros e funções ao administrador.
- Restringir fotos de perfil ao próprio usuário e fotos de equipe ao administrador para escrita.
- Registrar consentimento com versão e data.
- Não expor passwordHash em perfil público.
- Revisar Firestore Rules e Storage Rules periodicamente.
- Testar sessão expirada, rotas diretas e tentativa de acesso não autorizado.

## 11. Testes

    npm.cmd run test -- --run
    npx.cmd tsc --noEmit
    npm.cmd run build

npm.cmd run verify reúne testes, lint e build. A validação funcional deve cobrir login, logout, permissões, quatro telas mensais, salvar/recarregar/trocar competência, links externos, mobile, overflow, NaN e warnings de Recharts.

## 12. Deploy

    npm.cmd run build
    firebase.cmd login
    firebase.cmd use uniodonto-passos-gestao
    firebase.cmd deploy --project uniodonto-passos-gestao

O firebase.json publica dist/, Firestore Rules e Storage Rules. Depois valide a URL de Hosting, login, rota privada, leitura mensal e console.

## 13. Git e release

    git status -sb
    git switch -c agent/<descricao>
    git add <arquivos-intencionais>
    git commit -m <descricao-curta>
    git push -u origin <branch>

Não adicionar artefatos temporários. O PR deve registrar escopo, riscos, testes e evidência do deploy.

## 14. Checklist para apresentação

- [ ] Login de produção confirmado.
- [ ] Termo de consentimento revisado.
- [ ] Dashboard abre na competência correta.
- [ ] Valores batem entre Dashboard, Visão Geral, Envio e Integração e Relatórios.
- [ ] Salvamento remoto confirmado.
- [ ] Permissões por função demonstradas.
- [ ] Relatório revisado.
- [ ] CRM e App de Vendas abrem em novas abas.
- [ ] Desktop e mobile revisados.
- [ ] Build, testes e deploy registrados.

## 15. Pendência conhecida

Na última validação de produção, o Hosting respondeu HTTP 200 e as rotas privadas exigiram autenticação, mas o login de fertaisetech@gmail.com foi recusado. Até confirmar essa conta no Firebase Authentication ou obter a credencial correta, os fluxos autenticados e a persistência remota não podem ser considerados aprovados.


# Plano de implementação e entrega — Portal Executivo UniOdonto

## Objetivo

Entregar um portal executivo confiável para diretores e gestores, com dados mensais consistentes entre Dashboard, Visão Geral, Envio e Integração e Relatórios, autenticação controlada, permissões por função e publicação rastreável.

## Checklist de implementação

### Dados e sincronização

- [ ] Definir o registro oficial de cada competência (Janeiro/2026, Abril/2026 etc.).
- [ ] Separar dados reais, parciais, estimados e indisponíveis.
- [ ] Validar beneficiários, entradas, cancelamentos, saldo, investimentos, impressões, alcance, cliques, leads, agendamentos, vendas, cidades e motivos.
- [ ] Garantir que Dashboard, Visão Geral, Envio e Integração e Relatórios leiam o mesmo documento mensal.
- [ ] Impedir fallback silencioso para números de demonstração.
- [ ] Salvar no Firestore somente após confirmação do botão de salvar.
- [ ] Recarregar o documento remoto após salvar e conferir updatedAt/updatedBy.
- [ ] Testar salvar, recarregar, trocar mês e retornar ao mês anterior.
- [ ] Confirmar a mesma alteração em outro navegador.

### Fórmulas

- [ ] Centralizar ROI, CAC, CTR, CPC, CPM, custo por visualização, conversão e saldo líquido.
- [ ] Arredondar apenas na apresentação.
- [ ] Exibir Não calculável quando faltar denominador ou origem válida.
- [ ] Conferir fechamento dos totais por cidade e canal.

### Autenticação e permissões

- [ ] Confirmar fertaisetech@gmail.com no Firebase Authentication.
- [ ] Validar Diretor, Gerente, Recepção e Vendedoras.
- [ ] Confirmar telas visíveis por função e bloqueio de acesso direto por URL.
- [ ] Permitir gerenciamento de usuários e telas apenas ao administrador.
- [ ] Testar logout e sessão expirada.

### Qualidade e publicação

- [ ] Testar desktop e 320x568, 360x800, 390x844 e 430x932.
- [ ] Corrigir cortes, overflow horizontal, NaN e warnings de dimensões dos gráficos.
- [ ] Validar contraste, foco, labels e alvos de toque de 44px.
- [ ] Executar testes, TypeScript, lint e build.
- [ ] Publicar Hosting, Firestore Rules e Storage Rules.
- [ ] Registrar evidências de login, troca de competência, salvamento, permissões e logout.

## Critérios de aceite

- Login de administrador aprovado em produção.
- Pelo menos três perfis testados com permissões diferentes.
- As quatro telas exibem a mesma competência e os mesmos valores.
- Salvar, recarregar, trocar mês e retornar mantém os dados corretos.
- Dados remotos confirmados em outro navegador.
- Console sem erros críticos, sem NaN e sem warnings width(-1)/height(-1).
- Build, testes e deploy registrados por commit, branch e URL.

## Riscos

- Fallback local não comprova persistência remota.
- Dados parciais da planilha não podem ser tratados silenciosamente como dados completos.
- Um login recusado em produção impede a aprovação dos fluxos autenticados.
- Mudanças nas regras do Firebase devem ser revisadas antes de ampliar permissões.

## Comandos de referência

    npm.cmd install
    npm.cmd run test -- --run
    npx.cmd tsc --noEmit
    npm.cmd run build
    firebase.cmd deploy --project uniodonto-passos-gestao


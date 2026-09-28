# XtremeBrain na sua conta Cloudflare

Esta versão funciona sem ChatGPT Sites e sem assinatura ChatGPT. Usa Workers + D1 + Cloudflare Access. O login é por código no e-mail; apenas os e-mails da política de acesso podem entrar. O perfil de estudos é criado no primeiro acesso. A autenticação e as permissões são gerenciadas no Cloudflare Access, não há cadastro aberto nem senhas armazenadas no aplicativo.

## Situação da migração

Código preparado. O lançamento depende de autenticação na conta Cloudflare, criação do D1 e configuração do Access. `wrangler.json` contém um identificador fictício de D1 para compilação local; o script de publicação recusa esse identificador. Não há dados de teste na migração. O endereço anterior continua separado.

## Publicação

Requer Node 22.13+ e pnpm na versão indicada em `package.json`. Confira os limites e o plano apresentados pela Cloudflare antes de contratar qualquer serviço pago.

```sh
git clone https://github.com/paywin/XtremeBrain.git
cd XtremeBrain
pnpm install --frozen-lockfile
npm run cf:login
npm run cf:setup
npm run cf:deploy -- --bootstrap
```

O login abre a autorização oficial da Cloudflare no seu navegador. Não compartilhe tokens ou senhas no chat. Se houver várias contas, selecione a conta de destino pelo Wrangler; utilize `CLOUDFLARE_ACCOUNT_ID` quando necessário. O setup cria um novo D1 chamado `xtremebrain` e grava seu ID em `wrangler.json`. Se um banco com esse nome já existir, confira no painel e registre o ID correto; não apague o existente.

A publicação inicial produz um endereço `workers.dev`, mas mostra somente a tela de preparação. A API recusa acesso sem um JWT válido. O conteúdo estático do aplicativo não é confidencial; os registros de estudo só são carregados com autenticação válida.

1. No painel Cloudflare, abra Workers & Pages → `xtremebrain` → Domains/Settings → domínio `workers.dev` → habilitar Cloudflare Access. Também é possível proteger todo o Worker na aba Access.
2. Abra a aplicação criada no Cloudflare One / Access. Configure uma política **Allow → Emails** com somente os e-mails de quem pode usar, começando pelo seu. Não use `Everyone` ou `Bypass`.
3. Em métodos de login, habilite **One-time PIN**. Cada pessoa recebe um código no próprio e-mail. Se a configuração inicial exigir aceitar termos ou selecionar plano, o titular deve concluir essa etapa.
4. Copie o domínio da equipe (`sua-equipe.cloudflareaccess.com`) e o **Application Audience (AUD)** da aplicação Access. O AUD tem 64 caracteres hexadecimais e não é uma senha. Use os valores retornados pela Cloudflare, nunca invente-os.
5. Configure e publique:

```sh
npm run cf:configure -- sua-equipe.cloudflareaccess.com AUD_REAL_DA_APLICACAO
npm run cf:deploy
```

`cf:deploy` compila, aplica as migrations do D1 na conta e publica o resultado. O script usa os dados de `wrangler.json`: ao mudar domínio/AUD no painel, atualize também este arquivo antes do próximo deploy. IDs de conta, banco e AUD não são segredos; guarde a configuração para futuras publicações. Os tokens de acesso do Wrangler devem permanecer fora do Git.

## Conferência antes de compartilhar

- E-mail autorizado: completar código de entrada, criar perfil e concluir diagnóstico.
- Outro e-mail autorizado: conta inicialmente vazia, sem progresso de outra pessoa.
- E-mail não autorizado: acesso recusado pelo Access.
- Requisição à API sem JWT: `401`; cabeçalhos antigos `oai-authenticated-user-*` não concedem acesso.
- JWT de outra aplicação, vencido ou com assinatura inválida: `401`.
- Sair encerra a sessão usando `/cdn-cgi/access/logout`.
- Evitar regras de cache que sobrescrevam `Cache-Control: private, no-store` em `/` e `/api/*`.

As previews do Workers ficam desativadas na configuração. Ao adicionar um domínio novo, inclua-o na aplicação Access (ou use proteção do Worker inteiro) e teste o acesso antes de compartilhar.

## Convites e remoção

No Cloudflare Access, edite a política da aplicação e adicione/remova e-mails. Ao remover alguém, revogue suas sessões ativas: tokens já emitidos podem continuar válidos até expirar. Use sessões curtas apropriadas ao seu grupo. Nenhum convite é enviado por este repositório automaticamente.

## Desenvolvimento e testes

```sh
npm run check
npm test
npm run build
```

Sem uma configuração válida de Access e um token assinado válido, a aplicação mantém os dados inacessíveis. Os testes de autenticação usam chaves temporárias locais; não existe login simulado no código de produção. Os testes da API usam SQLite em memória e contas isoladas. A tela autenticada exige configuração de Access em uma implantação de teste.

## Fontes oficiais

- https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/d1/get-started/

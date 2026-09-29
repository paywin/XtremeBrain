# Tutor de estudos e personagem

O tutor abre pelo botão **Tutor IA**, pelo personagem ou pelos botões de ajuda nas questões e resultados. Usa até 30 atividades da conta autenticada para contextualizar as respostas. Tentativas repetidas contam novamente. Durante a prova oferece pistas; na revisão explica acertos e erros. Para provas em PDF, cole enunciado e alternativas: o tutor não baixa ou lê o PDF automaticamente.

## Ativar no Cloudflare

Após instalar as dependências e configurar Workers, D1 e Access conforme `CLOUDFLARE.md`:

```bash
npx wrangler secret put GEMINI_API_KEY
npm run cf:deploy
```

Cole a chave somente no prompt do Wrangler. Nunca coloque a chave no Git, no frontend ou em variáveis `NEXT_PUBLIC_*`. A implantação aplica as migrações, incluindo `0001_tutor_usage.sql`. Se executar a publicação manualmente, aplique primeiro `npx wrangler d1 migrations apply xtremebrain --remote`.

Variáveis opcionais do Worker: `AI_PROVIDER=gemini` e `AI_MODEL=gemini-3.5-flash-lite`. Escolha em `AI_MODEL` um modelo disponível para sua chave. A seleção e os adaptadores ficam em `lib/tutor.ts`; adicione outros provedores ali, com seus segredos exclusivos no servidor. Apenas Gemini está implementado nesta versão.

Há limite de 60 requisições por pessoa por dia UTC, imposto atomicamente pelo D1. Requisições que chegam ao provedor contam mesmo se ele falhar. Limites adicionais e cobrança do Gemini continuam valendo. Configure orçamento no provedor conforme sua conta.

As conversas ficam apenas na memória da aba e são limpas ao trocar o contexto da questão ou recarregar. A pergunta, as últimas mensagens e um resumo de desempenho são enviados ao Gemini. Nome e e-mail não são enviados pelo contexto automático. As respostas são orientações geradas por IA e podem conter erros.

## Personagem

Em **Personalizar**, envie PNG transparente de até 1 MB. Ele é uma imagem estática que desliza suavemente perto do local escolhido (não anima pernas nem gera sprites). Clique para conversar; arraste com mouse ou toque para reposicionar e ouvir a reclamação em um balão. Preferências e imagem ficam neste navegador. Pode ocultar o personagem ou parar o movimento; o botão Tutor IA permanece disponível. A preferência de movimento reduzido do sistema também é respeitada.

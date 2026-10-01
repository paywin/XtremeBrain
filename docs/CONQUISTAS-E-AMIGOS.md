# Conquistas, sequência e amigos

Abra **Conquistas** ou **Amigos** no menu. O início também mostra um resumo da sequência e da coleção.

## Regras

- 22 badges com nomes e símbolos próprios: comum, incomum, rara, épica, lendária e mítica.
- Mago do Saber: 3 horas acumuladas de estudo ativo, sem exigir uma sessão longa.
- Tempo ativo: a prova ou as páginas de plano, erros e tendências precisam estar visíveis, com interação nos últimos 2 minutos. O servidor recebe sinais a cada 30 segundos. Aba oculta, sessão ociosa e intervalos longos não acumulam tempo; abas simultâneas compartilham um relógio no banco. É uma aproximação de atividade, não prova de atenção ou sistema antifraude.
- O tempo antigo das tentativas inclui pausas, por isso não é convertido em horas de conquistas. Tentativas antigas continuam valendo para respostas, sequência e acertos.
- Um dia conta com 60 segundos ativos ou uma atividade concluída com resposta. O calendário usa America/Recife. A sequência de ontem permanece até terminar o dia de hoje; ao interromper, o recorde e os badges permanecem.
- Mestre da Prova exige um caderno oficial completo perfeito. Lenda do ENEM exige cobertura dos números 1 a 180 de uma mesma aplicação, com tentativas completas perfeitas para os dois dias. Anuladas não exigem acerto. Não inclui redação nem representa nota TRI.
- A biblioteca atual tem cobertura incompleta dos dois dias do ENEM: a conquista mítica permanece bloqueada até haver os cadernos necessários. A interface deixa essa limitação explícita.
- Badges desbloqueados são persistidos no servidor ao carregar sua jornada. A celebração aparece quando a página detecta um badge novo após uma atividade ou durante o estudo.

## Amigos e privacidade

Cada perfil tem um código aleatório de 12 caracteres. Troque o código e envie um convite; o destinatário precisa aceitar. Ao aceitar, ambos compartilham nome, objetivo, sequência e conquistas. O código não concede acesso aos estudos nem substitui o login Cloudflare Access: o amigo precisa ter acesso autorizado à plataforma e criar um perfil.

Compartilhar atividades recentes é opcional e começa desligado. Quando ativado, os amigos aceitos veem até 5 atividades, com título, disciplinas e data. Respostas, notas, conversas do tutor e e-mail não são retornados pela API social. Cancelar ou recusar um convite e remover uma amizade são suportados. Limite de 50 conexões por conta, incluindo convites pendentes.

Os cartões de amigos são atualizados ao abrir a página ou recarregar; não há envio de mensagens externas ou notificações push.

## Instalação

```bash
git pull
pnpm install --frozen-lockfile
npm run cf:deploy
```

O deploy aplica `drizzle/0002_community.sql`, criando tabelas novas sem apagar estudos existentes. Nenhuma configuração de API adicional é necessária.

Verificação: `npm run test:community`, `npm run check` e `npm run build`. Os testes usam SQLite em memória, cobrem autorizações, privacidade, contagem, abas duplicadas, calendário de Recife e cobertura ENEM.

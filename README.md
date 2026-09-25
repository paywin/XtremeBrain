# XtremeBrain

Plataforma de estudos em português para vestibulares e concursos. React + TypeScript, Vinext, Cloudflare Workers e D1 (SQLite). Gráficos com Recharts; componentes acessíveis com Radix/Shadcn.

## Funcionalidades

- Perfil com objetivo e tempo diário, login com ChatGPT no ambiente hospedado.
- Diagnóstico de fundamentos por trilha, com 8–12 questões.
- Provas oficiais em PDF, folha de respostas, cronômetro de tempo livre, rascunho salvo e retomada.
- Correção no servidor; respostas em branco erradas e questões anuladas fora do percentual de aprendizagem.
- Histórico por conta, desempenho por matéria, evolução por atividade e filtro de período.
- Plano de estudos baseado nas menores taxas de acerto, sugestões de método e registro dos blocos concluídos.
- Caderno de erros baseado na tentativa mais recente de cada questão, com treino de revisão autoral.
- Áreas Militar (ITA, IME, ESA, EsPCEx, AFA, EFOMM), ENEM, UPE (SSA 1/2/3) e trilhas gerais de concursos.
- Estatísticas de cobertura do acervo e ranking editorial de assuntos de Matemática do ITA.

## Cobertura atual — transparente

15 cadernos oficiais, com 854 questões objetivas no total:

| Trilha | Edições | Caderno |
| --- | --- | --- |
| ENEM | 2023, 2024, 2025 | 2º dia, amarelo (5), aplicação regular |
| ITA | 2024, 2025, 2026 | 1ª fase, aplicadas em 2023–2025 |
| UPE SSA 1 | 2024, 2025, 2026 | 2º dia |
| UPE SSA 2 | 2024, 2025, 2026 | 2º dia |
| UPE SSA 3 | 2024, 2025, 2026 | 2º dia |

A numeração, cor, dia e edição são parte da identidade da prova. Não misturar gabaritos de cadernos diferentes. Nos acervos UPE/ITA, a edição pode ser diferente do ano da aplicação. O campo `appliedYear` deixa essa distinção explícita.

**Limitações de conteúdo:** o ranking por assunto abrange 36 questões de Matemática do ITA, classificadas editorialmente a partir dos cadernos. Para os demais acervos há distribuição por disciplina, não um ranking temático inventado. Trilhas militares além do ITA e concursos gerais ainda não têm cadernos integrados. O acervo atual não inclui redação, provas discursivas ou o primeiro dia de ENEM/SSA. Os exercícios autorais são separados das provas oficiais. Não existem notas, aprovações ou usuários demonstrativos no histórico.

Os resultados são percentuais simples e não representam TRI, classificação ou nota oficial. O plano usa regras explicáveis de priorização; não chama um serviço de IA generativa nem exige chave paga. A contagem de tempo é o tempo decorrido na atividade, incluindo períodos antes da retomada; não é uma medição de atenção.

## Desenvolvimento

Node >= 22.13 e pnpm. Dependências fixadas em `pnpm-lock.yaml`.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm dev
```

O build gera `dist/server/wrangler.json`. Para aplicar a migração somente no banco local:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_tranquil_kat_farrell.sql
```

Não reaplique migrações já aplicadas. Novas mudanças de esquema exigem novas migrações via `pnpm db:generate`. A publicação aplica migrações no banco de produção separadamente. Nunca editar migração já publicada.

### Autenticação e implantação

A hospedagem configurada em `.openai/hosting.json` fornece o fluxo de login e os cabeçalhos autenticados. A API verifica identidade no servidor e limita todas as consultas ao usuário autenticado; não aceita `userId` enviado pelo cliente. Os cabeçalhos devem vir exclusivamente do proxy confiável da hospedagem. Não exponha o Worker diretamente em outro host aceitando cabeçalhos arbitrários. Para migrar a hospedagem, implemente autenticação real por sessão e substitua `app/chatgpt-auth.ts`.

O desenvolvimento local pode usar a simulação do starter em ambientes compatíveis. O preview gerenciado pode ser anônimo; autenticação real é feita na URL publicada. `test-api.mjs` usa usuários fictícios e SQLite isolado em memória e não adiciona bypass na aplicação. A publicação inicial é privada.

## Organização

- `app/study-app.tsx`: fluxo de estudo e interface responsiva.
- `app/api/study/route.ts`: perfil, histórico, rascunhos, correção e atividades.
- `lib/catalog.ts`: trilhas, questões autorais e orientações.
- `lib/exams.ts`, `lib/*-exams.json`: metadados e gabaritos oficiais.
- `lib/topic-tags.ts`: classificação editorial por questão.
- `lib/grading.ts`: correção e agregação por matéria.
- `db/schema.ts`, `drizzle/`: esquema e migrações.
- `scripts/test-domain.mjs`: testes de gabaritos, anulações, brancos e diagnóstico.
- `scripts/test-api.mjs`: testes de autenticação, persistência, retomada, idempotência e isolamento entre contas.

## Adicionar provas e melhorar a cobertura

1. Obter caderno e **gabarito definitivo** da organizadora.
2. Criar um JSON no formato dos arquivos em `lib/`, com `id`, `target`, `year`, `appliedYear`, `title`, `pdf`, `source`, `keyUrl`, `key`, `subjects`, `start`, `minutes` e opcionalmente `topics`.
3. `key` contém A–E, ou `*` para anuladas. Deve haver uma disciplina e, se fornecido, um tema para cada questão. Use `Não classificado` quando não houver revisão temática.
4. Importar: `pnpm import:exam /caminho/absoluto/prova.json`.
5. Conferir visualmente gabarito, numeração, regras e temas; rodar testes e publicar.

O importador valida o formato, não atesta a origem ou a qualidade pedagógica. A taxonomia é editorial e deve ser revisada; contagens não são previsões. PDFs permanecem nos portais de origem, com link externo como alternativa ao visualizador. A disponibilidade do PDF depende da organizadora.

## Fontes

- [Inep — provas e gabaritos ENEM](https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos)
- [ITA — provas anteriores](https://www.vestibular.ita.br/provas.htm)
- [UPE — processo de ingresso](https://processodeingresso.upe.pe.gov.br/)

URLs específicas do caderno e gabarito são registradas em cada entrada. Verificação do acervo: 25/09/2026. Marcas e provas pertencem às respectivas instituições; a plataforma não é afiliada a elas.

## Aparência de console

Início com blocos horizontais e navegação por teclado (setas, Home e End). Em Personalizar, escolha cor, fundo, imagem própria (JPG/PNG/WebP até 2 MB), densidade e ordem dos atalhos. Preferências visuais ficam apenas neste navegador; respostas e histórico continuam no banco autenticado. Movimento reduzido respeita a configuração do sistema e o controle da interface.

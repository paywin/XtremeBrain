import { env } from 'cloudflare:workers';
import { getStudyUser } from '../../auth';
import { database } from '@/lib/database';
import { askTutor } from '@/lib/tutor';
import { questions } from '@/lib/catalog';
import { officialExams } from '@/lib/exams';
import type { Result } from '@/lib/grading';
import { z } from 'zod';
const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const schema = z.object({ messages: z.array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().trim().min(1).max(6000) })).min(1).max(16), questionId: z.string().max(160).optional(), mode: z.enum(['hint', 'review', 'general']).default('general') });
export async function POST(request: Request) {
  const user = await getStudyUser();
  if (!user) return json({ error: 'Entre na sua conta para conversar com o tutor.' }, 401);
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origem inválida.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 32000) return json({ error: 'Conversa muito longa. Inicie uma nova conversa.' }, 413);
    const input = schema.parse(JSON.parse(raw));
    if (input.messages.at(-1)?.role !== 'user') return json({ error: 'Envie uma pergunta.' }, 400);
    if (!env.GEMINI_API_KEY || (env.AI_PROVIDER && env.AI_PROVIDER !== 'gemini')) return json({ error: 'O tutor ainda precisa ser configurado pelo responsável pela plataforma.' }, 503);
    const db = database();
    const profile = await db.prepare('SELECT target,minutes FROM profiles WHERE user_id=?').bind(user.userId).first();
    const history = await db.prepare('SELECT created_at,result FROM attempts WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.userId).all<{ created_at: string; result: string }>();
    const attempts = history.results.map(h => ({ date: h.created_at, result: JSON.parse(h.result) as Result }));
    const items = attempts.flatMap(h => h.result.items).filter(i => !i.annulled);
    const subjects = [...new Set(items.map(i => i.subject))].map(subject => { const rows = items.filter(i => i.subject === subject); return { subject, total: rows.length, correct: rows.filter(i => i.ok).length }; });
    const q = questions.find(q => q.id === input.questionId);
    const exam = officialExams.find(e => input.questionId?.startsWith(e.id + '-'));
    const reviewed = input.mode === 'review' ? items.find(i => i.id === input.questionId) : undefined;
    const question = q ? { text: q.text, options: q.options, subject: q.subject, topic: q.topic } : exam ? { exam: exam.title, questionId: input.questionId, text: 'Enunciado não disponível; peça ao aluno para colar o texto.' } : null;
    // Atomic per-user daily quota bounds provider spending across Worker instances.
    const quota = await db.prepare('INSERT INTO tutor_usage(user_id,day,requests) VALUES(?,?,1) ON CONFLICT(user_id,day) DO UPDATE SET requests=requests+1 WHERE requests<60 RETURNING requests').bind(user.userId, new Date().toISOString().slice(0,10)).first();
    if (!quota) return json({ error: 'Você chegou ao limite de 60 mensagens de hoje. Volte amanhã.' }, 429);
    const answer = await askTutor(env, { profile, mode: input.mode, question, review: reviewed, subjects, coverage: 'Últimas 30 atividades; tentativas repetidas contam novamente.', activities: attempts.map(h => ({ date: h.date, correct: h.result.correct, total: h.result.total })) }, input.messages);
    return json({ answer });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError) return json({ error: 'Confira a pergunta enviada.' }, 400);
    const code = e instanceof Error ? e.message : '';
    if (!['QUOTA','NOT_CONFIGURED','GEMINI_KEY','GEMINI_MODEL','GEMINI_REQUEST','PROVIDER','EMPTY'].includes(code)) console.error('Tutor request failed',e);
    return json({ error: code === 'QUOTA' ? 'A cota do provedor foi atingida. Tente novamente mais tarde.' : code === 'NOT_CONFIGURED' ? 'O tutor ainda não está configurado.' : code === 'GEMINI_KEY' ? 'O Gemini recusou a chave de API. Confira a chave configurada na Cloudflare.' : code === 'GEMINI_MODEL' ? 'Este modelo Gemini não está disponível para sua chave. Configure outro AI_MODEL no Worker.' : code === 'GEMINI_REQUEST' ? 'O Gemini recusou a solicitação. Confira o modelo configurado e os registros do Worker.' : 'Não foi possível responder agora. Tente novamente em instantes.' }, code === 'QUOTA' ? 429 : 503);
  }
}

import { officialExams } from './exams';
import type { Result } from './grading';
export type StudyAttempt={exam_id:string;created_at:string;result:Result};
export type StudyDay={day:string;seconds:number};
export const rarities={common:'Comum',uncommon:'Incomum',rare:'Rara',epic:'Épica',legendary:'Lendária',mythic:'Mítica'};
export const badges=[
 {id:'first',name:'Primeira Faísca',description:'Conclua sua primeira atividade com pelo menos uma resposta.',rarity:'common',icon:'spark',goal:1,metric:'attempts'},
 {id:'questions25',name:'Caçador de Respostas',description:'Responda 25 questões em atividades concluídas.',rarity:'common',icon:'target',goal:25,metric:'answered'},
 {id:'hour',name:'Aprendiz do Tempo',description:'Acumule 1 hora de estudo ativo.',rarity:'uncommon',icon:'clock',goal:3600,metric:'seconds'},
 {id:'streak3',name:'Chama Acesa',description:'Estude por 3 dias consecutivos.',rarity:'uncommon',icon:'flame',goal:3,metric:'bestStreak'},
 {id:'wizard',name:'Mago do Saber',description:'Acumule 3 horas de estudo ativo, no seu ritmo.',rarity:'rare',icon:'wand',goal:10800,metric:'seconds'},
 {id:'subjects',name:'Explorador de Mundos',description:'Responda questões de 4 disciplinas.',rarity:'rare',icon:'compass',goal:4,metric:'subjects'},
 {id:'streak7',name:'Guardião da Chama',description:'Complete uma sequência de 7 dias de estudo.',rarity:'rare',icon:'shield',goal:7,metric:'bestStreak'},
 {id:'recovery',name:'Alquimista dos Erros',description:'Acerte 10 questões diferentes que já havia errado.',rarity:'epic',icon:'gem',goal:10,metric:'recovered'},
 {id:'hours10',name:'Arquiteto do Conhecimento',description:'Acumule 10 horas de estudo ativo.',rarity:'epic',icon:'castle',goal:36000,metric:'seconds'},
 {id:'streak30',name:'Fênix da Constância',description:'Alcance uma sequência de 30 dias de estudo.',rarity:'legendary',icon:'flame',goal:30,metric:'bestStreak'},
 {id:'officialPerfect',name:'Mestre da Prova',description:'Acerte todas as questões válidas de um caderno oficial completo.',rarity:'legendary',icon:'trophy',goal:1,metric:'officialPerfect'},
 {id:'attempts5',name:'Ritmo de Descoberta',description:'Conclua 5 atividades com pelo menos uma resposta em cada.',rarity:'common',icon:'spark',goal:5,metric:'attempts'},
 {id:'minutes30',name:'Tempo de Aprender',description:'Acumule 30 minutos de estudo ativo.',rarity:'common',icon:'clock',goal:1800,metric:'seconds'},
 {id:'questions100',name:'Centurião das Questões',description:'Responda 100 questões em atividades concluídas.',rarity:'uncommon',icon:'target',goal:100,metric:'answered'},
 {id:'recovery3',name:'Virada de Chave',description:'Acerte 3 questões diferentes que já havia errado.',rarity:'uncommon',icon:'gem',goal:3,metric:'recovered'},
 {id:'attempts20',name:'Desbravador do Saber',description:'Conclua 20 atividades com pelo menos uma resposta em cada.',rarity:'rare',icon:'compass',goal:20,metric:'attempts'},
 {id:'hours5',name:'Feiticeiro dos Estudos',description:'Acumule 5 horas de estudo ativo.',rarity:'rare',icon:'wand',goal:18000,metric:'seconds'},
 {id:'questions500',name:'Sentinela das Respostas',description:'Responda 500 questões em atividades concluídas.',rarity:'epic',icon:'shield',goal:500,metric:'answered'},
 {id:'streak14',name:'Chama Persistente',description:'Alcance uma sequência de 14 dias de estudo.',rarity:'epic',icon:'flame',goal:14,metric:'bestStreak'},
 {id:'recovery50',name:'Mestre da Superação',description:'Acerte 50 questões diferentes que já havia errado.',rarity:'legendary',icon:'trophy',goal:50,metric:'recovered'},
 {id:'hours50',name:'Fortaleza do Saber',description:'Acumule 50 horas de estudo ativo, no seu ritmo.',rarity:'legendary',icon:'castle',goal:180000,metric:'seconds'},
 {id:'enemPerfect',name:'Lenda do ENEM',description:'Acerte todas as questões válidas dos dois dias da mesma edição do ENEM. Não inclui redação nem equivale à nota TRI.',rarity:'mythic',icon:'crown',goal:180,metric:'enemPerfect'},
] as const;
export type BadgeId=typeof badges[number]['id'];
export function dayKey(date:Date){return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Recife',year:'numeric',month:'2-digit',day:'2-digit'}).format(date)}
const previousDay=(day:string)=>new Date(Date.parse(day+'T12:00:00Z')-86400000).toISOString().slice(0,10);
export function summarize(attempts:StudyAttempt[],days:StudyDay[],now=new Date()){
 const sorted=[...attempts].sort((a,b)=>a.created_at.localeCompare(b.created_at));
 const answeredAttempts=sorted.filter(a=>a.result.items.some(i=>!!i.selected));
 const studyDates=new Set([...days.filter(d=>d.seconds>=60).map(d=>d.day),...answeredAttempts.map(a=>dayKey(new Date(a.created_at)))]);
 const today=dayKey(now),daily=[...studyDates].sort();let bestStreak=0,run=0,last='';
 for(const day of daily){run=previousDay(day)===last?run+1:1;bestStreak=Math.max(bestStreak,run);last=day}
 let currentStreak=0,cursor=studyDates.has(today)?today:previousDay(today);
 while(studyDates.has(cursor)){currentStreak++;cursor=previousDay(cursor)}
 const errors=new Set<string>(),recovered=new Set<string>(),subjects=new Set<string>();let answered=0;
 for(const a of sorted)for(const i of a.result.items){if(i.annulled)continue;if(i.selected){answered++;subjects.add(i.subject)}if(i.ok&&errors.has(i.id))recovered.add(i.id);if(!i.ok)errors.add(i.id)}
 const perfect=sorted.filter(a=>{const e=officialExams.find(e=>e.id===a.exam_id);return e&&a.result.items.length===e.key.length&&a.result.total>0&&a.result.correct===a.result.total&&a.result.items.every(i=>i.annulled||(i.ok&&!!i.selected))});
 const coverage=new Map<number,Set<number>>();
 for(const a of perfect){const e=officialExams.find(e=>e.id===a.exam_id)!;if(e.target!=='ENEM')continue;const numbers=coverage.get(e.appliedYear)||new Set<number>();e.key.forEach((_,i)=>numbers.add(e.start+i));coverage.set(e.appliedYear,numbers)}
 const completeEnem=Array.from(coverage.values()).some(numbers=>Array.from({length:180},(_,i)=>i+1).every(n=>numbers.has(n)));
 const metrics={attempts:answeredAttempts.length,answered,seconds:days.reduce((s,d)=>s+d.seconds,0),subjects:subjects.size,bestStreak,recovered:recovered.size,officialPerfect:perfect.length,enemPerfect:completeEnem?180:Math.min(179,Math.max(0,...Array.from(coverage.values()).map(n=>n.size)))};
 return {metrics,currentStreak,bestStreak,todayStudied:studyDates.has(today),todaySeconds:days.find(d=>d.day===today)?.seconds||0,week:Array.from({length:7},(_,i)=>{const day=dayKey(new Date(now.getTime()-(6-i)*86400000));return {day,active:studyDates.has(day)}}),badges:badges.map(b=>({...b,value:Math.min(b.goal,metrics[b.metric]),unlocked:metrics[b.metric]>=b.goal}))};
}
export type StudySummary=ReturnType<typeof summarize>;

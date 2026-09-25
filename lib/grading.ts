import { questions, diagnostic } from './catalog';
import { officialExams } from './exams';
export type ItemResult={id:string;number:number;subject:string;topic:string;selected:string;correct:string;ok:boolean;annulled:boolean;explanation:string};
export type Result={items:ItemResult[];correct:number;total:number;score:number;annulled:number;officialPoints:number;bySubject:{subject:string;correct:number;total:number;score:number}[]};
export function examItems(examId:string,target:string,ids?:string[]){
 const official=officialExams.find(e=>e.id===examId);
 if(official)return official.key.map((a,i)=>({id:`${official.id}-${i+official.start}`,number:i+official.start,subject:official.subjects[i],topic:official.topics?.[i]||official.subjects[i],answer:a,explanation:'Confira o enunciado no caderno oficial e o gabarito da organizadora. A resolução comentada desta questão ainda não está disponível.'}));
 const bank=examId==='diagnostic'?diagnostic(target):questions.filter(q=>ids?.includes(q.id));
 if(!bank.length)throw new Error('Prova inválida');
 return bank.map((q,i)=>({...q,number:i+1,answer:'ABCDE'[q.answer]}));
}
export function grade(examId:string,target:string,answers:Record<string,string>,ids?:string[]):Result{
 const items=examItems(examId,target,ids).map(q=>({id:q.id,number:q.number,subject:q.subject,topic:q.topic,selected:answers[q.id]||'',correct:q.answer,ok:q.answer==='*'||answers[q.id]===q.answer,annulled:q.answer==='*',explanation:q.explanation}));
 const valid=items.filter(q=>!q.annulled),correct=valid.filter(q=>q.ok).length;
 const bySubject=[...new Set(valid.map(q=>q.subject))].map(subject=>{const rows=valid.filter(q=>q.subject===subject),c=rows.filter(q=>q.ok).length;return {subject,correct:c,total:rows.length,score:Math.round(c/rows.length*100)}});
 return {items,correct,total:valid.length,score:valid.length?Math.round(correct/valid.length*100):0,annulled:items.length-valid.length,officialPoints:items.filter(q=>q.ok).length,bySubject};
}

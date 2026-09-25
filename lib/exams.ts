import additionalExams from './additional-exams.json';
import {itaMathTopics} from './topic-tags';
import upeExams from './upe-exams.json';
import enemExams from './enem-exams.json';
export type OfficialExam={id:string;target:string;year:number;appliedYear:number;title:string;pdf:string;source:string;keyUrl:string;key:string[];subjects:string[];start:number;minutes:number;topics?:string[]};
function ita(year:number,key:string,subjects:string[]):OfficialExam{return {id:`ita-${year}`,target:'ITA',year,appliedYear:year-1,title:`ITA ${year} · 1ª fase`,pdf:`https://www.vestibular.ita.br/provas/${year}_fase1.pdf`,source:'https://www.vestibular.ita.br/provas.htm',keyUrl:`https://www.vestibular.ita.br/provas/gabarito_${year}.pdf`,key:key.split(''),topics:subjects.flatMap(s=>s==='Matemática'?itaMathTopics[year]:Array(12).fill('Não classificado')),subjects:subjects.flatMap(s=>Array(12).fill(s)),start:1,minutes:300};}
export const officialExams:OfficialExam[]=[
...enemExams,...upeExams,...(additionalExams as OfficialExam[]),
ita(2026,'DBECD*ABDEAB'+'BADC AEBCDECC'.replace(/ /g,'')+'AEDBEBEABAAC'+'DCCBADCBBBDC',['Matemática','Física','Química','Inglês']),
ita(2025,'BECDDBAE*DAC'+'BABDB*CDABCE'+'BABCBDBACDEC'+'CBDBDACEEBCE',['Matemática','Física','Química','Inglês']),
ita(2024,'DDCBBBEAE*CC'+'EDDBBBDCDDDC'+'BADCDECBDCAB'+'BEABDCEDCDAC'+'CCEEDAABCBDB',['Física','Português','Inglês','Matemática','Química'])
];

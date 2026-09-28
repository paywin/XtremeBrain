import {getStudyUser,authenticationConfigured,signInPath} from './auth';
import StudyApp from './study-app';
export const dynamic='force-dynamic';
export default async function Page(){
 const user=await getStudyUser();
 if(!user)return <main className="access-gate"><div className="panel"><h1>XtremeBrain</h1><h2>{authenticationConfigured()?'Seu espaço de estudos é privado.':'Estamos preparando seu espaço de estudos.'}</h2><p>{authenticationConfigured()?'Entre com o e-mail autorizado. Se você acabou de entrar, sua sessão não foi validada; tente novamente ou peça ao responsável para conferir seu acesso.':'O acesso ainda não foi liberado. Volte quando receber o link de entrada.'}</p>{authenticationConfigured()&&<a className="primary-button" href="/cdn-cgi/access/logout">Entrar novamente</a>}</div></main>;
 return <StudyApp signedIn displayName="" signInUrl={signInPath}/>;
}

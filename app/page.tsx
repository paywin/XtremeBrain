import { getChatGPTUser, chatGPTSignInPath } from './chatgpt-auth';
import StudyApp from './study-app';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <StudyApp signedIn={!!user} displayName={user?.fullName||''} signInUrl={chatGPTSignInPath('/')} />;}

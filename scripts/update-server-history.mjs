import {writeFile,mkdir,rename,readFile,copyFile} from 'node:fs/promises';
import {validateUpdate} from './history-validation.mjs';
const endpoint = 'https://www.dhlottery.co.kr/pt720/selectPstPt720WnList.do';
const directory = new URL('../data/',import.meta.url);
const target = new URL('history.json',directory);
await mkdir(directory,{recursive:true});
const statusPath = new URL('sync-status.json',directory);
let previous, status={};
try{previous=JSON.parse(await readFile(target,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
try{status=JSON.parse(await readFile(statusPath,'utf8'));}catch{}
try {
  const response=await fetch(endpoint,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`Official source HTTP ${response.status}`);
  const raw=await response.json();
  const draws=validateUpdate(raw?.data?.result,previous);
  const data={source:'동행복권',sourceUrl:'https://www.dhlottery.co.kr/pt720/result',endpoint,
    fetchedAt:new Date().toISOString(),scope:'연금복권720+ 회차별 1등 번호 (보너스 제외)',draws};
  const temp = new URL('history.json.tmp',directory);
  await writeFile(temp,JSON.stringify(data,null,2));
  if(previous)await copyFile(target,new URL('history.previous.json',directory));
  await rename(temp,target);
  await writeFile(new URL('official-history.json',directory),JSON.stringify(raw,null,2));
  await writeFile(new URL('../public/history.json',import.meta.url),JSON.stringify(data,null,2));
  status={ok:true,lastAttemptAt:data.fetchedAt,lastSuccessAt:data.fetchedAt,latestRound:draws[0].round,latestDrawDate:draws[0].date};
  console.log(`Updated ${draws.length} rounds; latest ${draws[0].round} (${draws[0].date})`);
} catch(error) {
  status={...status,ok:false,lastAttemptAt:new Date().toISOString(),error:error.message};
  console.error(error.message);process.exitCode=1;
}
await writeFile(new URL('sync-status.json.tmp',directory),JSON.stringify(status,null,2));
await rename(new URL('sync-status.json.tmp',directory),statusPath);

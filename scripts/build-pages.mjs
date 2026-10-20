import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
await mkdir('site/api',{recursive:true});
await copyFile('data/history.json','site/api/history.json');
await copyFile('data/sync-status.json','site/api/status.json');
const data=JSON.parse(await readFile('data/history.json','utf8'));
await writeFile('site/.nojekyll','');
await writeFile('site/index.html',`<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>오늘의 연금번호 데이터</title><main><h1>오늘의 연금번호 데이터</h1><p>동행복권 공식 1등 당첨 이력 · ${data.draws.length}회 수록</p><p><a href="./api/history.json">당첨 이력 JSON</a> · <a href="./api/status.json">수집 상태 JSON</a></p><p>GitHub Actions에서 매시 17분·47분에 갱신을 시도합니다. 실행은 지연될 수 있습니다.</p><p><a href="https://www.dhlottery.co.kr/pt720/result">공식 출처</a></p></main></html>`);

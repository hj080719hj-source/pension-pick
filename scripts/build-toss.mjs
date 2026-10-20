import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import {build} from 'esbuild';
await mkdir('build',{recursive:true});
await build({entryPoints:['public/app.mjs'],bundle:true,format:'esm',platform:'browser',target:'es2020',outfile:'build/app.mjs',minify:true});
let html=await readFile('public/index.html','utf8');
html=html.replace('<span class="preview">미리보기</span>','');
html=html.replace('<span class="brand-icon">7</span>','<img class="app-logo" src="/logo.png" alt="">');
html=html.replace('현재는 번호 추천과 기기 내 보관을 체험하는 버전이에요. 당첨 결과 조회, 토스 계정 연결, 광고 기능은 아직 연결되지 않았어요.',
  '하루 1회 무료로 추천받을 수 있어요. 무료 이용 횟수와 보관 번호는 현재 기기에 저장돼요. 당첨 이력은 서버에서 자동 갱신하며 통계에 마지막 반영 회차를 표시해요. 실시간 구매 가능 여부는 확인하지 않아요.');
html=html.replace('시제품 안내','이용 안내');
await writeFile('build/index.html',html);
let css=await readFile('public/style.css','utf8');
css=css.replace(/^@import[^;]+;\s*/, '');
css+='\n.app-logo{width:32px;height:32px;border-radius:9px;object-fit:cover}\n';
await writeFile('build/style.css',css);
for(const file of ['history.json','logo.png'])await copyFile(`public/${file}`,`build/${file}`);
console.log('Prepared Toss web assets (rewarded ads paused).');

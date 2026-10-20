import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {AppsInTossBundle} from '@apps-in-toss/ait-format';
import {unzipSync} from 'fflate';
const file='pension-pick.ait';
let reader=AppsInTossBundle.reader(await readFile(file));
assert.equal(reader.appName,'pension-pick');
assert.equal(reader.readSignature(),null);
let files=unzipSync(reader.readZipBlob());
if(Object.keys(files).some(name=>name.includes('\\'))) {
  const writer=AppsInTossBundle.writer({appName:reader.appName,deploymentId:reader.deploymentId,formatVersion:reader.formatVersion,createdBy:reader.bundle.createdBy});
  writer.setMetadata(reader.metadata);
  reader.permissions.forEach(p=>writer.addPermission(p.name,p.access));
  for(const [name,bytes] of Object.entries(files))writer.addFile(name.replaceAll('\\','/'),bytes);
  await writeFile(file,await writer.toBuffer());
  reader=AppsInTossBundle.reader(await readFile(file));files=unzipSync(reader.readZipBlob());
}
const expected=['index.html','app.mjs','style.css','history.json','logo.png'];
for(const name of expected)assert.deepEqual(Buffer.from(files[`sources/${name}`]),await readFile(`build/${name}`));
assert.equal(Object.keys(files).filter(n=>n.startsWith('sources/')).length,expected.length);
await mkdir('release',{recursive:true});
await writeFile('release/pension-pick.ait',await readFile(file));
console.log(JSON.stringify({appName:reader.appName,assets:expected,bytes:(await readFile(file)).length,deviceTested:false}));

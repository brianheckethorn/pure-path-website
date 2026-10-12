import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { publicFiles } from '../scripts/build-site.mjs';
import { createPreviewServer } from '../scripts/serve.mjs';

test('public build contains precisely approved runtime files and excludes design/prototype pages',async()=>{
  const root=new URL('../docs/',import.meta.url);
  const actual=(await readdir(root,{recursive:true,withFileTypes:true})).filter(entry=>entry.isFile()).map(entry=>path.relative(fileURLToPath(root),path.join(entry.parentPath || entry.path,entry.name)).split(path.sep).join('/')).sort();
  assert.deepEqual(actual,[...publicFiles].sort());
  for(const file of publicFiles) assert.deepEqual(await readFile(new URL(file,root)),await readFile(new URL(`../${file}`,import.meta.url)),file);
  assert.doesNotMatch(actual.join('\n'),/Neighbor|snapshot-home|tests\/|scripts\/|REVISION|MANIFEST/);
});
test('generated public routes and all local fonts serve correctly; archived prototypes are absent',async()=>{
  const server=createPreviewServer(); server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base=`http://127.0.0.1:${server.address().port}/docs/`;
  try {
    for(const file of ['','health-age-assessment/','wellness-snapshot/','health-age.html','health-age-assessment.html',...publicFiles.filter(file=>file.endsWith('.ttf'))]) {
      const response=await fetch(base+file); assert.equal(response.status,200,file); assert.ok((await response.arrayBuffer()).byteLength);
    }
    for(const file of ['Neighbor.dc.html','wellness-snapshot-home.html','COPY-MANIFEST.json','tests/preferences.test.mjs']) {
      const response=await fetch(base+file); assert.equal(response.status,404,file); await response.text();
    }
  } finally {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});

import { questions } from '../components/educational-age/content.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { componentHarness } from './dom-harness.mjs';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { mountWellnessSnapshot } from '../components/wellness-snapshot/component.js';
import { snapshotContent } from '../components/wellness-snapshot/content.js';
import { createMockDeliveryAdapter } from '../components/wellness-snapshot/delivery.js';
import { connectionFormURL, downloadResultText } from '../components/result-tools.js';

for(const kind of ['age','snapshot']) {
  test(`${kind}: public results have no email/signup UI, download locally, and link without prefilling`,()=>{
    const downloads=[]; const ui=componentHarness();
    const delivery={...createMockDeliveryAdapter(),requestAddressVerification(){throw new Error('No public delivery call permitted');},requestResultEmail(){throw new Error('No public delivery call permitted');},requestMailingList(){throw new Error('No public delivery call permitted');}};
    const onDownload=(copy,name)=>downloads.push({copy,name});
    if(kind==='age') {mountEducationalAge(ui.root,{delivery,onDownload});for(let i=0;i<questions.length-1;i++)ui.click('Next');ui.click('See my comparison');}
    else {mountWellnessSnapshot(ui.root,{content:snapshotContent,delivery,onDownload});ui.select('Yes');ui.click('Start my snapshot');for(let i=0;i<7;i++)ui.click('Next');ui.click('See my snapshot');}
    assert.equal(ui.nodes().filter(n=>n.type==='email'||n.type==='checkbox').length,0);
    assert.doesNotMatch(ui.root.textContent,/Email \(optional\)|Newsletter topics|Preview my email choices|Want a copy by email/);
    ui.click('Download my results (.txt)');ui.select('Growing closer to Christ');ui.click('Download my results (.txt)');
    assert.equal(downloads.length,2);assert.equal(downloads[0].copy,downloads[1].copy);assert.equal(downloads[0].name,'your-pure-path-results.txt');
    assert.doesNotMatch(downloads[0].copy,/Christ|God|spiritual|faith/i);
    assert.match(downloads[0].copy,kind==='age'?/custom lifestyle quiz/:/Your Wellness Snapshot/);
    const link=ui.nodes().find(n=>n.tagName==='A'&&n.href===connectionFormURL);
    assert.ok(link);assert.equal(link.target,'_blank');assert.equal(link.referrerPolicy,'no-referrer');assert.match(link.rel,/noreferrer/);
    assert.equal(link.href,'https://forms.gle/Zcc9QZbo9N7NTQcj6');assert.match(link.textContent,/Health & Wellness Connection/);
  });
}
test('public entry points explicitly disable delivery preview and do not expose a Google Form embed',()=>{
  for(const folder of ['health-age-assessment','wellness-snapshot']) {
    const page=readFileSync(new URL(`../${folder}/page.js`,import.meta.url),'utf8');assert.match(page,/showDeliveryPreview: false/);
    const html=readFileSync(new URL(`../${folder}/index.html`,import.meta.url),'utf8');assert.doesNotMatch(html,/<iframe|<form|<input/);
  }
});
test('download creates a local text Blob, triggers a download, then revokes the opaque object URL',async()=>{
  let blob;let scheduled;const link={click(){this.clicked=true;},remove(){this.removed=true;}};
  const document={defaultView:{Blob,URL:{createObjectURL(value){blob=value;return'blob:local-only';},revokeObjectURL(value){assert.equal(value,'blob:local-only');link.revoked=true;}},setTimeout(fn){scheduled=fn;}},createElement(){return link;},body:{append(node){assert.equal(node,link);}}};
  downloadResultText(document,'Synthetic results only','your-pure-path-results.txt');
  assert.equal(await blob.text(),'Synthetic results only');assert.equal(blob.type,'text/plain;charset=utf-8');assert.equal(link.download,'your-pure-path-results.txt');assert.ok(link.clicked&&link.removed);
  scheduled();assert.ok(link.revoked);
});

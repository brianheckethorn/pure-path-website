import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { componentHarness } from './dom-harness.mjs';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { mountWellnessSnapshot } from '../components/wellness-snapshot/component.js';
import { snapshotContent } from '../components/wellness-snapshot/content.js';
import { calculateIllustrativeAge, scoringMaps } from '../components/educational-age/scoring.js';
import { discussionIdeas } from '../components/educational-age/results.js';
import { snapshotSteps } from '../components/wellness-snapshot/model.js';
import { createMockDeliveryAdapter, previewDelivery } from '../components/wellness-snapshot/delivery.js';
import { newsletterConsentText, validateNewsletterTopics, supportIdea, spiritualChoices } from '../components/support-preferences.js';
const tick = () => new Promise(resolve => setImmediate(resolve));
function finish(ui, kind) {
  if (kind === 'age') { for(let i=0;i<21;i++) ui.click('Next'); ui.click('See my comparison'); }
  else { ui.select('Yes'); ui.click('Start my snapshot'); for(let i=0;i<7;i++) ui.click('Next'); ui.click('See my snapshot'); }
}
function setup(kind, delivery = createMockDeliveryAdapter()) {
  const ui = componentHarness();
  ui.controller = kind === 'age' ? mountEducationalAge(ui.root,{delivery,showDeliveryPreview:true}) : mountWellnessSnapshot(ui.root,{content:snapshotContent,delivery,showDeliveryPreview:true});
  finish(ui,kind); return ui;
}
test('frozen scoring bytes and all 22 question IDs are untouched; spirituality cannot change arithmetic', () => {
  const bytes=readFileSync(new URL('../components/educational-age/scoring.js',import.meta.url));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'bd7c82029db9d837912e6faa259cd6ec1f0aab96facd36b36acb36e507f246c7');
  const answers={age:'42',height:'70',weight:'154',...Object.fromEntries(Object.entries(scoringMaps).map(([key,map])=>[key,Object.entries(map).sort((a,b)=>b[1]-a[1])[0][0]]))};
  const original=calculateIllustrativeAge(answers);
  for(const choice of ['',...spiritualChoices.map(c=>c.id)]) assert.deepEqual(calculateIllustrativeAge({...answers,spiritualSupport:choice}),original);
  assert.equal(supportIdea('not-now'),''); assert.equal(supportIdea('prefer-not'),''); assert.equal(supportIdea(''),'');
});
test('practical health steps respond to explicit answers, are limited to two, and make no age-lowering claim',()=>{
  const favorable=discussionIdeas({nicotine:'never',exercise:'5+',strength:'4+',dietQuality:'excellent',vegetables:'6+'});
  assert.equal(favorable.length,1); assert.equal(favorable[0].key,'maintenance'); assert.match(favorable[0].en,/variety/);
  const ideas=discussionIdeas({dietQuality:'poor',exercise:'rarely',strength:'none'});
  assert.equal(ideas.length,2); assert.match(ideas[0].en,/next meal/); assert.match(ideas[1].en,/movement break/);
  assert.match(snapshotSteps({fruit:'none'})[0],/next meal/);
  assert.match(snapshotSteps({movement:'none'})[0],/movement break/);
  assert.match(snapshotSteps({tobacco:'former'})[0],/staying tobacco-free/);
  assert.equal(snapshotSteps({fruit:'none',movement:'none',rested:'hardly',tobacco:'most'}).length,2);
  assert.match(snapshotSteps({fruit:'unsure',movement:'skip'})[0],/^General idea/);
  assert.doesNotMatch(JSON.stringify([...ideas,...snapshotSteps({movement:'none'})]),/biological|younger|years|risk reduction|prescription/i);
});
test('newsletter topics reject arbitrary tags; only explicit topics accompany consent and email',async()=>{
  assert.deepEqual(validateNewsletterTopics([]),[]);
  for(const topics of [['age-42'],['closer-to-god','closer-to-god'],null,'closer-to-god']) assert.throws(()=>validateNewsletterTopics(topics));
  const calls=[]; const adapter={mode:'mock',async requestMailingList(payload){calls.push(payload);return{purpose:'mailing-list'};}};
  await previewDelivery({adapter,email:'synthetic@example.test',mailingListConsent:true,newsletterTopics:['closer-to-god'],snapshot:'Private synthetic result',spiritualSupport:'christ'});
  assert.deepEqual(calls,[{email:'synthetic@example.test',consent:true,topics:['closer-to-god']}]);
  assert.match(newsletterConsentText(['closer-to-god']),/Growing closer to God/);
  assert.match(newsletterConsentText(['closer-to-god'],'es'),/Acercarme más a Dios/);
});
for(const kind of ['age','snapshot']) {
  test(`${kind}: support and newsletter are optional, independent, explicitly previewed, and clearable`,async()=>{
    const calls=[]; const adapter={...createMockDeliveryAdapter(),async requestMailingList(payload){calls.push(payload);return{purpose:'mailing-list'};}};
    const ui=setup(kind,adapter);
    assert.equal(ui.nodes().some(n=>n.checked),false);
    ui.select('Growing closer to Christ');
    assert.equal(ui.nodes().filter(n=>n.type==='checkbox').some(n=>n.checked),false);
    const resultPre=ui.nodes().find(n=>n.tagName==='PRE'&&n.textContent.startsWith(kind==='age'?'Your illustrative comparison':'Your Wellness Snapshot'));
    assert.doesNotMatch(resultPre.textContent,/Growing closer|Christ|prayer|spiritual/);
    ui.select('Growing closer to God'); ui.fillEmail('synthetic@example.test');
    assert.equal(ui.inputByLabel(newsletterConsentText(['closer-to-god'])).checked,false);
    ui.click('Preview my email choices'); await tick(); assert.deepEqual(calls,[]);
    ui.select(newsletterConsentText(['closer-to-god']));
    const newsletterPre=ui.nodes().find(n=>n.tagName==='PRE'&&n.textContent.startsWith('Not sent. Mock newsletter'));
    assert.match(newsletterPre.textContent,/Selected topics: Growing closer to God/); assert.match(newsletterPre.textContent,/Consent: Yes/);
    ui.click('Preview my email choices'); await tick(); assert.deepEqual(calls,[{email:'synthetic@example.test',consent:true,topics:['closer-to-god']}]);
    ui.select('Healthier eating'); assert.equal(ui.inputByLabel(newsletterConsentText(['healthier-eating','closer-to-god'])).checked,false);
    ui.click('Clear newsletter topics'); assert.equal(ui.inputByLabel(newsletterConsentText([])).checked,false); assert.match(newsletterPre.textContent,/None; no topic preferences/);
    ui.select('Prefer not to answer'); assert.doesNotMatch(ui.root.textContent,/quiet moment for prayer/);
    ui.click('Clear my support choice'); assert.equal(ui.nodes().filter(n=>n.type==='radio').some(n=>n.checked),false);
    ui.click('Start over'); finish(ui,kind); assert.equal(ui.nodes().some(n=>n.checked),false); assert.equal(ui.nodes().find(n=>n.type==='email').value,'');
  });
}
test('new preference code has no storage, network, form submission, or URL serialization',()=>{
  const source=readFileSync(new URL('../components/support-preferences.js',import.meta.url),'utf8');
  assert.doesNotMatch(source,/<form\b|fetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|indexedDB|URLSearchParams|console\./i);
});
for(const kind of ['age','snapshot']) {
  test(`${kind}: choosing spiritual support never enters neutral verification or result delivery`,async()=>{
    const calls=[]; const adapter={...createMockDeliveryAdapter(),async requestAddressVerification(payload){calls.push(['verify',payload]);return{status:'mock-verification-pending',message:'Neutral verification'};},async requestResultEmail(payload){calls.push(['result',payload]);return{purpose:'result-email'};}};
    const ui=setup(kind,adapter); ui.select('Exploring faith'); ui.select('Growing closer to God');
    ui.fillEmail('synthetic@example.test'); ui.select(kind==='age'?'Yes, email this result to me.':'Yes, email this snapshot to me.');
    ui.click('Preview my email choices'); await tick(); assert.deepEqual(calls[0],['verify',{email:'synthetic@example.test',consent:true}]);
    ui.click('Simulate verified address and preview delivery'); await tick();
    assert.equal(calls.length,2); assert.deepEqual(Object.keys(calls[1][1]).sort(),['consent','email','snapshot','verified']);
    assert.doesNotMatch(calls[1][1].snapshot,/faith|Christ|God|spiritual/i);
  });
}
test('Spanish support choices and newsletter consent preserve explicit choices without changing arithmetic',()=>{
  const ui=setup('age'); ui.select('Growing closer to Christ'); ui.select('Growing closer to God'); ui.select(newsletterConsentText(['closer-to-god']));
  ui.click('Español'); assert.equal(ui.inputByLabel('Acercarme más a Cristo').checked,true); assert.equal(ui.inputByLabel('Acercarme más a Dios').checked,true);
  assert.equal(ui.inputByLabel(newsletterConsentText(['closer-to-god'],'es')).checked,true); assert.match(ui.root.textContent,/Temas elegidos: Acercarme más a Dios/);
  assert.match(ui.root.textContent,/No se muestra una estimación numérica/);
  ui.click('Borrar mis temas del boletín'); assert.equal(ui.inputByLabel(newsletterConsentText([],'es')).checked,false);
});
test('published homepage generation has working routes/contact and no unfinished design placeholders',()=>{
  const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.doesNotMatch(home,/\[WARM|\[HOURS|\[CREDENTIAL|\[2–3|Book online|free 15-minute|it's free/);
  assert.match(home,/href="\.\/health-age-assessment\/" lang="es"/);
  assert.match(home,/href="mailto:mario@yourpurepath.com"[^>]*>Arrange a conversation/);
  for(const file of ['health-age.html','health-age-assessment.html']) {
    const redirect=readFileSync(new URL(`../${file}`,import.meta.url),'utf8'); assert.match(redirect,/url=\.\/health-age-assessment\//); assert.doesNotMatch(redirect,/<form|<input/);
  }
});

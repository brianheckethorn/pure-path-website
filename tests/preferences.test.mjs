import { text } from '../components/educational-age/content.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { componentHarness } from './dom-harness.mjs';
import { finishAssessmentWithExplicitResponses, finishAssessmentWithAnswers } from './assessment-harness.mjs';
import { candidateFixtures } from './candidate-fixtures.mjs';
import { mountEducationalAge } from '../components/educational-age/component.js';
import { mountWellnessSnapshot } from '../components/wellness-snapshot/component.js';
import { snapshotContent } from '../components/wellness-snapshot/content.js';
import { calculateIllustrativeAge, scoringMaps } from '../components/educational-age/scoring.js';
import { discussionIdeas, calculateAssessmentPreview, resultPDFModel, resultEmailText } from '../components/educational-age/results.js';
import { snapshotSteps } from '../components/wellness-snapshot/model.js';
import { createMockDeliveryAdapter, previewDelivery } from '../components/wellness-snapshot/delivery.js';
import { newsletterConsentText, validateNewsletterTopics, supportIdea, spiritualChoices } from '../components/support-preferences.js';
const tick = () => new Promise(resolve => setImmediate(resolve));
function finish(ui, kind) {
  if (kind === 'age') { finishAssessmentWithExplicitResponses(ui); }
  else { ui.select('Yes'); ui.click('Start my snapshot'); for(let i=0;i<7;i++) ui.click('Next'); ui.click('See my snapshot'); }
}
function setup(kind, delivery = createMockDeliveryAdapter()) {
  const ui = componentHarness();
  ui.controller = kind === 'age' ? mountEducationalAge(ui.root,{delivery,showDeliveryPreview:true}) : mountWellnessSnapshot(ui.root,{content:snapshotContent,delivery,showDeliveryPreview:true});
  finish(ui,kind); return ui;
}
test('core scoring is unchanged by support preferences; spirituality cannot change arithmetic', () => {
  // Unit normalization changes implementation bytes; original weights/maps remain covered by reference checks.
  const answers={age:'42',height:'70',weight:'154',...Object.fromEntries(Object.entries(scoringMaps).map(([key,map])=>[key,Object.entries(map).sort((a,b)=>b[1]-a[1])[0][0]]))};
  const original=calculateIllustrativeAge(answers);
  for(const choice of ['',...spiritualChoices.map(c=>c.id)]) assert.deepEqual(calculateIllustrativeAge({...answers,spiritualSupport:choice}),original);
  assert.equal(supportIdea('not-now'),''); assert.equal(supportIdea('prefer-not'),''); assert.equal(supportIdea(''),'');
});
test('all relevant practical steps remain available and lifestyle priorities precede separate care guidance',()=>{
  const favorable=discussionIdeas({nicotine:'never',exercise:'5+',strength:'4+',dietQuality:'excellent',vegetables:'6+'});
  assert.ok(favorable.some(idea=>idea.key==='maintenance')); assert.match(favorable.find(idea=>idea.key==='maintenance').en,/variety/);
  assert.ok(favorable.some(idea=>idea.key==='maintainMovement'));
  const ideas=discussionIdeas({dietQuality:'poor',exercise:'rarely',strength:'none'});
  assert.deepEqual(ideas.map(idea=>idea.key),['food','movement','strength']);
  assert.match(ideas.find(idea=>idea.key==='food').en,/next meal/); assert.match(ideas.find(idea=>idea.key==='movement').en,/5[-\u2013]10 minutes/);
  const priority=discussionIdeas({nicotine:'current',bloodSugar:'diagnosed',sleepQuality:'poor',dietQuality:'poor',exercise:'rarely'});
  assert.deepEqual(priority.filter(idea=>idea.kind==='lifestyle').map(idea=>idea.key),['food','movement','sleep']);
  assert.deepEqual(priority.filter(idea=>idea.kind==='care').map(idea=>idea.key),['nicotine','history']);
  assert.equal(priority.length,5); assert.ok(priority.findIndex(idea=>idea.kind==='care')>priority.map(idea=>idea.kind).lastIndexOf('lifestyle'));
  assert.deepEqual(discussionIdeas({dietQuality:'unknown',sleepQuality:'skip',exercise:'unknown',nicotine:'never'}).map(idea=>idea.key),['general']);
  assert.match(snapshotSteps({fruit:'none'})[0],/next meal/);
  assert.match(snapshotSteps({movement:'none'})[0],/movement break/);
  assert.match(snapshotSteps({tobacco:'former'})[0],/staying tobacco-free/);
  assert.equal(snapshotSteps({fruit:'none',movement:'none',rested:'hardly',tobacco:'most'}).length,2);
  assert.match(snapshotSteps({fruit:'unsure',movement:'skip'})[0],/^General idea/);
  assert.doesNotMatch(JSON.stringify([...ideas,...snapshotSteps({movement:'none'})]),/biological|younger|years|risk reduction|prescription/i);
});

test('mixed-risk reports show more than three concrete lifestyle tips and preserve allergy exclusions and scores',()=>{
  const base={...candidateFixtures.find(fixture=>fixture.id==='metric-mixed').answers,nutSeedServings:'avoidsForCare'};
  const untouched=structuredClone(base); const before=calculateAssessmentPreview(base);
  assert.equal(before.status,'complete');
  const ideas=discussionIdeas(base); const lifestyle=ideas.filter(idea=>idea.kind!=='care'); const care=ideas.filter(idea=>idea.kind==='care');
  assert.ok(lifestyle.length>3); assert.ok(care.length>0);
  for(const key of ['food','movement','wholeGrains','sleep','foodVariety','sittingBreaks','support','alcohol']) assert.ok(lifestyle.some(idea=>idea.key===key),key);
  assert.equal(ideas.some(idea=>idea.key==='nutsSeeds'||idea.key==='maintainNutsSeeds'),false);
  assert.doesNotMatch(JSON.stringify(ideas),/try a small handful|2 tablespoons of nut butter|consider nuts or seeds/i);
  assert.equal(before.domains.find(domain=>domain.id==='nutSeedServings').assessed,false);
  for(const language of ['en','es']) {
    const model=resultPDFModel(before,base,language); const exported=resultEmailText(before,base,language);
    for(const idea of ideas) {
      assert.ok(JSON.stringify(model.recommendations).includes(idea[language]),`${idea.key} in report model`);
      assert.ok(exported.includes(idea[language]),`${idea.key} in text export`);
    }
    const ui=componentHarness(); mountEducationalAge(ui.root,{delivery:createMockDeliveryAdapter()});
    if(language==='es') ui.click('Español'); finishAssessmentWithAnswers(ui,base,language);
    const primary=ui.find(node=>node.className==='health-next-steps')[0]; assert.equal(primary.children.length,3);
    for(const idea of lifestyle.slice(0,3)) assert.ok(primary.textContent.includes(idea[language]));
    for(const idea of care) assert.equal(primary.textContent.includes(idea[language]),false);
    const outsideClosedDetails=node=>{
      for(let ancestor=node;ancestor;ancestor=ancestor.parentNode) if(ancestor.hidden||(ancestor.tagName==='DETAILS'&&!ancestor.open)) return false;
      return true;
    };
    for(const idea of ideas) {
      const matches=ui.find(node=>['LI','P'].includes(node.tagName)&&node.textContent.includes(idea[language])&&outsideClosedDetails(node));
      assert.ok(matches.length,`${idea.key} visible without opening details`);
    }
  }
  assert.deepEqual(base,untouched); assert.deepEqual(calculateAssessmentPreview(base),before);
  assert.deepEqual(calculateIllustrativeAge(base),calculateIllustrativeAge(untouched));
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
    const resultPre=ui.nodes().find(n=>n.tagName==='PRE'&&n.textContent.startsWith(kind==='age'?text.resultTitle.en:'Your Wellness Snapshot'));
    assert.doesNotMatch(resultPre.textContent,/Growing closer|Christ|prayer|spiritual/);
    if(kind==='age') assert.ok(resultPre.textContent.includes(text.withheld.en));
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
  assert.ok(ui.root.textContent.includes(text.withheld.es));
  ui.click('Borrar mis temas del boletín'); assert.equal(ui.inputByLabel(newsletterConsentText([],'es')).checked,false);
});
test('published homepage generation has working routes/contact and no unfinished design placeholders',()=>{
  const home=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.doesNotMatch(home,/\[WARM|\[HOURS|\[CREDENTIAL|\[2–3|Book online|free 15-minute|it's free/);
  assert.equal([...home.matchAll(/href="\.\/health-age-assessment\/"/g)].length,1);
  assert.match(home,/English \/ Español/);
  assert.match(home,/href="mailto:mario@yourpurepath.com"[^>]*>Arrange a conversation/);
  for(const file of ['health-age.html','health-age-assessment.html']) {
    const redirect=readFileSync(new URL(`../${file}`,import.meta.url),'utf8'); assert.match(redirect,/url=\.\/health-age-assessment\//); assert.doesNotMatch(redirect,/<form|<input/);
  }
});

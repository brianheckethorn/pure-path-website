import test from 'node:test';
import assert from 'node:assert/strict';
import { discussionIdeas } from '../components/educational-age/lifestyle-recommendations.js';

const lifestyleKeys = [
  'food', 'movement', 'wholeGrains', 'nutsSeeds', 'foodVariety',
  'breakfast', 'snacks', 'sugaryDrinks', 'water'
];
const knownChallenges = {
  fruitVegetableServings: '0-2', wholeGrainServings: 'none',
  nutSeedServings: '0-2', redMeatFrequency: '3plusWeekly',
  breakfastFrequency: 'lt2', snackingFrequency: 'severalDaily',
  sugaryDrinks: '2+', water: 'lt4', exercise: 'rarely',
  strength: 'none', sedentary: '10+', sleepQuality: 'poor',
  sleepDuration: 'lt5', tobaccoHistory: 'current',
  bloodPressureReading: { history: 'diagnosed' },
  bloodGlucoseReading: { history: 'borderline' }, cholesterol: 'high',
  stress: 'high', socialSupport: 'low', energy: 'low',
  functionalFitness: 'limited', alcoholServings: '15+'
};
const keys = ideas => new Set(ideas.map(idea => idea.key));
const find = (ideas, key) => {
  const item = ideas.find(idea => idea.key === key);
  assert.ok(item, `Expected recommendation ${key}`);
  return item;
};

test('all known challenges retain every relevant lifestyle topic without a three-tip cap', () => {
  const ideas = discussionIdeas(knownChallenges);
  assert.ok(Array.isArray(ideas));
  assert.ok(ideas.filter(idea => idea.kind === 'lifestyle').length > 3);
  const actual = keys(ideas);
  for (const key of lifestyleKeys) {
    assert.ok(actual.has(key), `Missing lifestyle topic ${key}`);
    assert.equal(find(ideas, key).kind, 'lifestyle');
  }
  assert.equal(actual.size, ideas.length, 'Recommendation keys must be unique');
  for (const idea of ideas) {
    assert.ok(['lifestyle', 'care', 'maintenance'].includes(idea.kind));
    for (const language of ['en', 'es']) {
      assert.equal(typeof idea[language], 'string');
      assert.ok(idea[language].trim(), `${idea.key} needs ${language} copy`);
      assert.doesNotMatch(idea[language], /\uFFFD|undefined|\[object Object\]/);
    }
  }
});

test('health-history, nicotine and sleep tips do not suppress food or movement', () => {
  const ideas = discussionIdeas({
    dietQuality: 'poor', vegetables: '0-1', exercise: 'rarely',
    nicotine: 'current', sleepQuality: 'poor',
    bloodPressure: 'diagnosed', bloodSugar: 'borderline', cholesterol: 'high'
  });
  for (const key of ['history', 'nicotine', 'sleep', 'food', 'movement']) {
    find(ideas, key);
  }
  assert.ok(ideas.length >= 5);
});

test('medical or allergy avoidance does not trigger a nuts/seeds recommendation', () => {
  const ideas = discussionIdeas({ ...knownChallenges, nutSeedServings: 'avoidsForCare' });
  assert.ok(!keys(ideas).has('nutsSeeds'));
  assert.ok(keys(ideas).has('food'), 'Other food guidance must remain available');
});

test('missing, unknown and declined responses do not become issue-specific advice', () => {
  const ids = [
    ...Object.keys(knownChallenges), 'nicotine', 'dietQuality', 'vegetables',
    'bloodPressure', 'bloodSugar', 'exerciseTwentyThirty', 'sleepSevenEightFrequency',
    'alcohol', 'spiritualityPreference', 'faith', 'reportContact'
  ];
  for (const sentinel of ['unknown', 'preferNot', 'skip', '']) {
    const answers = Object.fromEntries(ids.map(id => [id, sentinel]));
    answers.bloodPressureReading = { history: sentinel, readingStatus: 'notMeasured' };
    answers.bloodGlucoseReading = { history: sentinel, readingStatus: 'notMeasured' };
    const ideas = discussionIdeas(answers);
    assert.ok(ideas.every(idea => idea.key === 'general'), `Unexpected issue for ${sentinel}`);
  }
  assert.ok(discussionIdeas({}).every(idea => idea.key === 'general'));
});

test('faith and private contact values never change or appear in recommendations', () => {
  const baseline = discussionIdeas(knownChallenges);
  for (const spiritualityPreference of ['noInterest', 'moderate', 'deep', 'preferNot']) {
    const ideas = discussionIdeas({
      ...knownChallenges, spiritualityPreference,
      faith: 'PRIVATE_FAITH_SENTINEL',
      reportContact: { email: 'private-sentinel@example.invalid', phone: 'PRIVATE_PHONE_SENTINEL' }
    });
    assert.deepEqual(ideas, baseline);
    assert.doesNotMatch(JSON.stringify(ideas), /PRIVATE_|private-sentinel|spiritualityPreference/);
  }
});

test('known positive habits receive maintenance encouragement', () => {
  const ideas = discussionIdeas({
    fruitVegetableServings: '5+', wholeGrainServings: '3+', nutSeedServings: '5+',
    redMeatFrequency: 'never', breakfastFrequency: 'daily', snackingFrequency: 'rarelyNever',
    sugaryDrinks: 'none', water: '7-9', exercise: '5+', strength: '2-3', sedentary: '0-3',
    sleepDuration: '7-9', sleepQuality: 'excellent', tobaccoHistory: 'never',
    stress: 'low', socialSupport: 'excellent', energy: 'high', functionalFitness: 'excellent',
    alcoholServings: 'none', cholesterol: 'normal',
    bloodPressureReading: { history: 'normal' }, bloodGlucoseReading: { history: 'normal' }
  });
  assert.ok(ideas.some(idea => idea.kind === 'maintenance'));
  assert.ok(!ideas.some(idea => idea.kind === 'care'), 'Positive answers do not imply a care issue');
  for (const language of ['en', 'es']) {
    assert.ok(ideas.filter(idea => idea.kind === 'maintenance').every(idea => idea[language].trim()));
  }
});

test('English and Spanish include concrete portions, food swaps and adaptable movement', () => {
  const ideas = discussionIdeas(knownChallenges);
  const food = find(ideas, 'food');
  assert.match(food.en, /(?:½|1\/2|half).*cup|cup.*(?:½|1\/2|half)/i);
  assert.match(food.es, /(?:½|1\/2|media).*taza|taza.*(?:½|1\/2|media)/i);
  const grains = find(ideas, 'wholeGrains');
  assert.match(grains.en, /whole.grain|brown rice|oatmeal/i);
  assert.match(grains.es, /integral|avena/i);
  const variety = find(ideas, 'foodVariety');
  assert.match(variety.en, /beans|lentils|fish|tofu/i);
  assert.match(variety.es, /frijoles|legumbres|lentejas|pescado|tofu/i);
  const movement = find(ideas, 'movement');
  assert.match(movement.en, /walk|seated|stretch|wheel/i);
  assert.match(movement.es, /camina|sentad|estira|silla/i);
  assert.match(movement.en, /abilit|comfortable|care plan/i);
  assert.match(movement.es, /capacidad|c[oó]mod|plan de atenci[oó]n/i);
});

test('legacy nicotine and broad diet answers remain supported independently', () => {
  assert.ok(keys(discussionIdeas({ nicotine: 'current' })).has('nicotine'));
  assert.ok(keys(discussionIdeas({ dietQuality: 'poor' })).has('food'));
  assert.ok(keys(discussionIdeas({ vegetables: '0-1' })).has('food'));
});

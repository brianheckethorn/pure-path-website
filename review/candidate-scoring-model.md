# Local candidate scoring model — October 16, 2026

This is a review candidate for the merged questionnaire. The points, weights, 70-point anchor, coverage gates and conversion into years are custom product conventions. They are not validated biological age, medical risk, diagnosis, life expectancy or a treatment recommendation. The cited guidance supports directional education and definitions; it does not establish these coefficients or year effects. No public deployment is authorized by this document.

## Calculation and output contract

`calculateCandidateAssessment(answers)` reads active detailed responses only. `calculateCandidateFromDomainScores(domainScores, actualAge)` is the pure numeric review/test seam; actual age is required and never defaults to an invented value. Numeric domain points must be finite numbers in `[0,100]`; invalid, missing or inapplicable domains are unassessed. Neither function mutates its input. Exports include `candidateWeights`/`weights`, `candidateScoringMaps`/`scoringMaps`, labels, reasons and `candidateModel`.

The fixed budget is 98. The original broad diet-quality weight8 and vegetable weight4 are replaced by four detailed components totaling12: fruit/vegetables4, whole grains3, nuts/seeds2, red-meat frequency3. Broad legacy inputs are ignored. All other retained budgets appear in the table below. Waist, breakfast timing, snack frequency, sex, name, contact details, interests, and every faith/support preference have zero weight. `socialSupport` is only the direct answer about available social support; faith or belief never feeds it.

For known domain points `s` and weight `w`:

```
score = round(70 + sum_known(w * (s - 70)) / 98)
coverage = sum_known(w) / 98
adjustment = clamp((70 - score) / 3, -12, +15)
estimated quiz age = round(actual age + adjustment)
```

Because reachable scores are 0–100, the reachable adjustment is **-10 to +15 years**; the specified lower clamp of -12 remains in the formula but cannot be reached by a valid candidate score.

An unknown domain adds no deviation from the neutral anchor; it is not assigned a real70 score or a zero. The denominator always stays98, so known items are not reweighted to fill gaps. Zero is a valid assessed score in the numeric seam. Coverage is the fraction of custom model weight assessed, not confidence in a medical conclusion. Display percentage is rounded, but gating uses the exact fraction.

A numeric estimate requires a valid whole-number actual age18–100, at least60% known weight, and at least4 of5 distinct habit areas: diet (at least3 of its4 components assessed), activity (primary exercise frequency assessed), sleep (duration assessed), tobacco, and alcohol. Strength cannot stand in for primary activity, and sleep quality cannot stand in for duration. These gates are review conventions, not scientifically established validity thresholds. Incomplete output omits `quizAge`, `score`, `adjustment`, `difference` and `range`; it retains valid actual age, coverage, domain records, unassessed reasons and gate reasons.

Complete output adds `range: {minAge,maxAge,minScore,maxScore}`. Let `K=sum_known(w*s)` and `M=98-knownWeight`. Score endpoints are `round(K/98)` and `round((K+100*M)/98)`; apply the inverse age transform to the high/low scores respectively. This is a mathematical missing-input range under this custom model, not a clinical confidence interval or a safe-health range. It does not address model error or unknown risk factors.

`domains` records contain `{id,label:{en,es},weight,assessed,score,reason,reasonLabel:{en,es}}`; `unassessed` contains the unassessed IDs/labels/reasons. `habitAreas` has five boolean keys `diet,activity,sleep,tobacco,alcohol`; `habitAreaCount` is separate. `coverage` contains `knownWeight,totalWeight,percent`. A computable BMI is returned as context, even when its scoring bands are inapplicable. No raw health reading, contact detail or preference is copied into the model output.

## Custom point mappings

The numbers below are product assumptions, never claimed as clinical effect sizes. Inherited numbers are the prior custom factors multiplied by100, except the revised options and exceptions stated below.

| Domain / weight | Response -> custom points |
| --- | --- |
| BMI /5 | Prior custom `bmiFactor`×100:12/34/68/100. Original input bounds and unit conversion retained. Adult bands only score ages20+. |
| Tobacco history /10 | current5; quitUnder2=62; quitOver2=82; never100; other unassessed. Two years is a custom questionnaire division, not a reset to never-use risk. |
| Exercise /8 | rarely18; 1–2days50; 3–4days82; 5+days100. Frequency cannot establish exact weekly activity minutes or guideline compliance. |
| Strength /5 | none15; 1day45; 2–3days100; 4+days100. Two or more days share a ceiling; extra days are not treated as necessary. |
| Sitting/reclining /5 | 10+hours15; 7–<10h45; 4–<7h78; <4h100. These divisions are custom, not disability judgments or clinical limits. |
| Sleep duration /5 | <5h10; 5–<7h48; 7–9h100; >9h unassessed because individual need/context is missing. No inference that longer sleep causes illness. |
| Sleep quality /4 | poor15; fair48; good80; excellent100. Subjective experience, not a sleep diagnosis. |
| Fruit/vegetables /4 | <3portions25; 3–<5portions70; 5+portions100. The app’s half-cup counting choices do not prove dietary adequacy or the WHO400g target. |
| Whole grains /3 | none20; some<3portions70; 3+portions100. Alternatives and any medical food restrictions come first. |
| Nuts/seeds /2 | <3weekly portions25; 3–<5=70; 5+=100; avoidsForCare unassessed. No advice to eat an allergen or automatic substitute. |
| Red meat /3 | never100; lessWeekly90; 1–<3weekly70; 3+weekly40. Frequency is a broad custom ordering; it cannot establish total grams, processing or an exceeded recommendation. |
| Sugary drinks /3 | 2+daily12; about1daily45; fewweekly78; rarely/never100. Counts do not measure sugar grams. |
| Plain water /3 | Every quantity unassessed. Plain-water intake excludes fluids in food/other drinks and does not establish individual need; no universal reward for10+cups. Budget remains in missing weight. |
| Alcohol /3 | none100; >0–7weekly82; >7–14=50; >14=18. No drinking option outscores none. Binge patterns, pregnancy, medication and recovery context are not assessed; bands are not safe limits. |
| Stress /5 | high18; moderate52; manageable82; low100. Direct answer only. |
| Social support /4 | low20; some52; good82; excellent100. Direct answer only, independent of religion and preferences. |
| Known BP history /6 | clinician-reported diagnosed18; borderline56; normal100; unknown/declined unassessed. Raw readings never determine a category. |
| Known glucose history /6 | clinician-reported diagnosed12; borderline54; normal100; unknown/declined unassessed. Random/post-meal values are never treated as fasting or used to diagnose diabetes. |
| Known cholesterol history /4 | high/treated28; borderline60; normal100; unknown/declined unassessed. No interpretation of raw laboratory values. |
| Energy /4 | low18; mixed54; good82; high100. Self-report does not explain a medical cause. |
| Everyday physical activities /6 | limited18; average55; good82; excellent100. Broad self-report; cannot distinguish disability, illness, environment or personal supports. |

Functional activities6, energy4, stress5 and social support4 retain custom self-report weights. None is a standardized clinical test; these answers cannot identify a cause, disability status or an individual causal effect in years. Disability, faith and personal preferences are never inferred from those scores. Their retained directions and magnitudes are product assumptions for this educational candidate, not research-proven year adjustments.

Blood-pressure, blood-glucose and cholesterol history categories are coarse retained assumptions requiring owner review. A diagnosed or treated condition may be well controlled; the glucose `diagnosed` choice groups prediabetes and diabetes together. `Borderline` means the wording the participant recalls from a clinician, not a standardized threshold assigned by this page. These custom points cannot measure current control, severity, treatment benefit or an individual's risk, and they do not gain clinical validity from the linked guidance. Raw readings never override or manufacture the history choice.

All unknown, prefer-not, legacy skip, invalid and unsupported choices remain unassessed. `avoidsForCare`, `notSuitable` or `medicallyUnsuitable` entries, and an explicit `medicallyUnsuitableDomains` list of known domain IDs, exclude those domains without assigning low points. The actual questionnaire currently exposes the nut/seed care exception; the list is a pure API hook for future explicit applicability controls, never inferred from disability, diagnosis, faith, identifiers or other answers. If pregnancy, muscularity or another circumstance makes BMI inappropriate, its scoring should be explicitly excluded; this questionnaire does not ascertain all such circumstances.

## Verified numeric examples

With actual age50 and all98 points of domain weight explicitly supplied at70: score70, quiz age50, range50–50. All domain points100: score100, age40. All points0: score0, capped age65. With BP6, glucose6 and cholesterol4 unassessed and every other domain explicitly70: known weight82/98 (84% displayed), score70, age50, missing-input range48–54. All unknown: no numeric estimate.

The last example is the numeric seam, not a claim that the questionnaire can assess plain-water suitability. In real answer mapping, water remains unassessed too, so otherwise-equivalent unknown-lab coverage is79/98 (81% displayed). An all-best mapped example has known weight95/98, score99, age40 at actual age50. An exclusion means no negative domain contribution relative to the neutral anchor; it does not promise the same number as a fully assessed100-point domain.

## Primary guidance and practical limits

- [WHO healthy diet](https://www.who.int/news-room/fact-sheets/detail/healthy-diet): varied fruit/vegetables, whole grains, nuts and limits on free sugars; these app-specific bands and year conversions are not WHO measures.
- [CDC benefits of quitting tobacco](https://www.cdc.gov/tobacco/about/benefits-of-quitting.html) and [CDC quit medicines](https://www.cdc.gov/tobacco/campaign/tips/quit-smoking/quit-smoking-medications/how-to-use-quit-smoking-medicines/index.html): quitting is beneficial; nicotine cessation medicine is not tobacco in this assessment.
- [CDC alcohol use](https://www.cdc.gov/alcohol/about-alcohol-use/moderate-alcohol-use.html): less is better; some people should not drink. Do not recommend starting or label a weekly band safe.
- [CDC adult activity](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html):150 moderate or75 vigorous minutes per week and two strength days; the questionnaire does not ascertain exact compliance.
- [CDC sleep](https://www.cdc.gov/sleep/about/index.html): age-related needs vary, and duration/quality are distinct. This candidate’s broad score bins cannot identify disease.
- [CDC BMI](https://www.cdc.gov/bmi/about/index.html): adult categories start20 and BMI is a screening measure that does not distinguish fat/muscle/bone or assess the whole person.
- [CDC water](https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html): total water comes from food and beverages and needs vary. Quantity alone is not scored here.
- [WCRF red and processed meat](https://www.wcrf.org/research-policy/evidence-for-our-recommendations/limit-red-processed-meat/): recommendations concern quantity/processing; occasions alone do not prove a threshold breach.
- [NIDDK diabetes tests and diagnosis](https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis): fasting, random, tolerance testing and A1C are distinct; home readings and this quiz do not establish a diagnosis.
- [NIDDK celiac nutrition](https://www.niddk.nih.gov/health-information/digestive-diseases/celiac-disease/eating-diet-nutrition) and [AAAAI nut allergy](https://www.aaaai.org/tools-for-the-public/conditions-library/allergies/everything-you-need-to-know-about-tree-nut-allergy): medical dietary needs override generic suggestions.

Care plans take priority. Symptoms and concerning readings need appropriate care regardless of a younger candidate age. A favorable number is not reassurance that BP/glucose or another condition is safe. This model requires owner review of the exact assumptions and independent implementation review before a public release; medical source citations do not validate the composite age model.

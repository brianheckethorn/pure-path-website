# Original assessment question mapping — inspection only

Source: [the original live assessment](https://yourpurepath.com/health-age-assessment.html),
read by public GET on October 12, 2026. The browser-search tool could not read this
URL; a direct read-only HTTP request succeeded. No form was completed, no scoring
JavaScript was run, and no answers were submitted. The structured source inventory
in `ORIGINAL-ASSESSMENT-INVENTORY.json` records exact field IDs, source labels,
choices, default metadata, number-input limits, retrieval time, and page hash.

The source has **22 inputs**, grouped as 4 foundation, 5 movement/recovery,
5 nutrition/hydration, and 8 lifestyle/history items. This document proposes plain
prompts for a future separate questionnaire in the preserved Claude Design style.
It does not change the completed eight-question Wellness Snapshot or introduce a
numeric health-age calculation. Source ranges below are copied input metadata,
not new medical thresholds or proof of a validated population.

## Question-by-question inventory and plain-language mapping

The proposed prompts keep the source construct. Keep the original answer bins
unless the selected validated model requires a different measure; if it does,
record that as a deliberate questionnaire change rather than an equivalent rewrite.

| # | Source field / topic | Original response structure | Proposed plain-language prompt | Relation to the eight-question prototype / unresolved meaning |
| --- | --- | --- | --- | --- |
| 1 | `age` — age | Number in years; source permits 18–100 | How old are you, in years? | Absent. Prototype has only an 18-or-older gate. Exact age would be a new sensitive input. Source limits do not establish model eligibility. |
| 2 | `sex` — sex | Female / Male | What is your sex? | Absent. Preserve the source distinction in this mapping; do not silently redefine it as gender or sex assigned at birth. Model definition and coverage must be resolved. |
| 3 | `height` — height | Inches; source permits 48–84 | How tall are you? (inches) | Absent. Preserve units; metric alternatives would require explicit unit handling. |
| 4 | `weight` — weight | Pounds; source permits 80–500 | How much do you weigh? (pounds) | Absent. Additional body measurement; no current collection or BMI implementation. |
| 5 | `exercise` — exercise frequency | Rarely/never; 1–2; 3–4; 5+ days per week | How many days a week do you exercise? | Related to `movement`, but prototype asks about breathing harder. Original does not define intensity or duration. Rarely/never is not identical to zero days. |
| 6 | `strength` — strength-training frequency | None; about 1; 2–3; 4+ days per week | How many days a week do you do strength exercises? | Related to `muscles`. Prototype combines all 2+ days; original distinguishes 2–3 from 4+. Do not collapse those groups. |
| 7 | `sedentary` — daily sedentary time | 10+; 7–9; 4–6; 0–3 hours | How many hours a day do you spend sitting or resting while awake? | Absent. The original does not define sedentary time. Sitting/resting wording is a draft explanation, requiring review before replacing the source term. |
| 8 | `sleepDuration` — sleep length | Under 5; 5–6; 7–8; 9+ hours | About how many hours do you usually sleep? | Related to `sleepHours`, whose bins are under 7, 7–9, over 9, and variable. Boundary 9 is different. Original does not specify night versus a full day or counting naps; do not silently add that definition. |
| 9 | `sleepQuality` — sleep quality | Poor / Fair / Good / Excellent | How would you describe your sleep? | Related to `rested`, but overall sleep quality is broader than waking rested. Three rest-frequency choices cannot be converted into these four quality choices. |
| 10 | `dietQuality` — overall diet quality | Mostly ultra-processed; mixed quality; mostly balanced; very nutrient-dense | How would you describe the foods you usually eat? | Absent as an overall measure. Prototype fruit/vegetable/grain frequencies are not a substitute. The source's nutrition terms need reviewed plain explanations, not invented definitions. |
| 11 | `sugaryDrinks` — sweetened-drink frequency | 2+ per day; about 1 per day; a few per week; rarely/never | How often do you have sugary drinks? | Absent. Source does not define drink size or which drinks count. Preserve mixed daily/weekly bins until reviewed. |
| 12 | `vegetables` — vegetable quantity | 0–1; 2–3; 4–5; 6+ servings per day | How many servings of vegetables do you usually eat in a day? | Related name only. Prototype measures days per week, not amount per day. Original does not define serving size; no automatic conversion is valid. |
| 13 | `water` — water amount | Under 4; 4–6; 7–9; 10+ cups | About how many cups of water do you drink? | Absent. Source label does not state a timeframe or cup size; confirm before adding “per day” or a volume conversion. |
| 14 | `alcohol` — alcohol use | Heavy/frequent; moderate; light; none | How would you describe your alcohol use? | Absent. Original mixes amount and frequency without defining categories. Do not map these labels to numeric drink thresholds. |
| 15 | `nicotine` — nicotine-use history | Current / Former / Never | Do you use nicotine now, did you use it in the past, or have you never used it? | Related to `tobacco`, but prototype covers smoking/nicotine vaping and excludes quit patches/gum. Original says nicotine broadly. Its product scope is unspecified; do not silently narrow it. |
| 16 | `stress` — stress level | High / Moderate / Manageable / Low | How would you describe your stress level? | Absent. These are self-description categories, not a validated stress scale. “Manageable” is not simply a numeric severity band. |
| 17 | `socialSupport` — social support | Limited; some; strong; very strong | How much support do you feel you have from other people? | Absent. No named social-support instrument or time window appears in the question. |
| 18 | `bloodPressure` — blood-pressure history | Diagnosed/elevated often; borderline or unsure; usually normal | Which option best describes your blood pressure history? | Absent. Original combines clinical history, recurring elevated values, and uncertainty. Preserve combined “borderline or unsure”; do not treat unsure as a diagnosis. No numeric blood-pressure values are collected. |
| 19 | `bloodSugar` — blood-sugar history | Diabetes/prediabetes; borderline or unsure; usually normal | Which option best describes your blood sugar history? | Absent. Preserve diagnosis/history wording; do not prompt self-diagnosis or treat uncertainty as disease. No lab values are collected. |
| 20 | `cholesterol` — cholesterol history | High/treated; borderline or unsure; usually normal | Which option best describes your cholesterol history? | Absent. Keep treatment within the original first choice; it is not equivalent to an untreated high reading. No lab values are collected. |
| 21 | `energy` — daily energy | Low most days; variable; good; consistently strong | How is your energy on most days? | Absent. Distinct from sleep quality and restedness; do not use one as a proxy for another. |
| 22 | `functionalFitness` — daily function, mobility and stamina | Often limited; adequate for daily life; good mobility/stamina; excellent strength/mobility | Which option best describes your ability to do everyday activities? | Absent. Original mixes daily function, stamina, mobility and strength. Plain examples would need review and must accommodate disability without inventing a health-age penalty. |

## Differences from the completed prototype

Six original topics have a related prototype item: exercise, strength, sleep
duration, sleep quality, vegetables, and nicotine. **None is an exact equivalent**:
the construct, scope, units, number of options, or boundaries differ as described
above. Do not carry answers from the prototype into an original-question score.

The prototype adds two questions that do not appear separately in the original:
fruit frequency and whole-grain frequency. The original's overall diet-quality
item does not make those interchangeable with it.

Sixteen original inputs are absent from the prototype: exact age, sex, height,
weight, sedentary time, overall diet quality, sugary drinks, water, alcohol, stress,
social support, blood-pressure history, blood-sugar history, cholesterol history,
daily energy, and functional fitness.

The prototype begins with an unselected adult gate, then eight unanswered optional
items with separate Skip and Not sure choices. The original uses exact age and
prepopulates **all 22 inputs**: four numbers and one radio in every categorical
group. Those source defaults are preserved only as inspection metadata in the
JSON; they must not become answers in a new design. The original has no distinct
Skip option; three clinical-history items combine borderline with uncertainty.
Adding Skip or a separate Not sure may be desirable for consent and comprehension,
but must have an explicit missing-data policy if a model is selected.

The original advertises estimated health age, BMI, a result category, summary and
improvement ideas. The completed prototype returns four descriptive cards with
no number, grade, risk category or age. This inspection does not validate the
original conversion or copy it into the prototype.

## Mapping into the existing design

Use a **separate** future assessment content configuration and route. Keep the
existing snapshot files and route intact. Reuse the Claude Design palette, art,
local fonts, question card style, large labeled controls, progress, Back/Edit and
Start over behavior. Retain the original four section meanings in the progress
and grouping; shorter display headings could be “About you,” “Movement and sleep,”
“Food and drinks,” and “Daily life and health history.”

Do not copy original preselected answers. Do not build another native GET form.
Continue to keep results available on screen without email, with independent,
unchecked result-email and newsletter consent. A newsletter payload must never
receive health answers or health tags. Keep neutral address verification and exact
result-message preview before any future health-content email. Providers, privacy,
retention, ownership, consent recording and subscriptions remain unapproved and
mocked; no external delivery is enabled by this mapping.

## Model decisions still unresolved

A numeric health-age implementation remains gated on a published scoring guide
or an evidence-based model with a clear intended population and outcome. Confirm
which original inputs are actually required by that model, their definitions,
units, eligibility range, handling of sex/disability/treated conditions, missing
answers, calibration and uncertainty. A model that needs measured labs, blood
pressure or validated instruments cannot be supplied with vague self-reported
categories through invented conversions. “Approximate” does not resolve that
evidence gap. Parent research and any published guide from the owner's friend
must resolve it before numeric work starts.

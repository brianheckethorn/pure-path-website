# Illustrative health-age quiz — scoring and local handoff

This separate local version follows Brian's confirmed direction: use the original
22 questions and existing custom formula as an educational conversation starter.
It does not claim scientific validation. The adjacent result disclosure is:

This confirmed direction supersedes the earlier evidence-model-only gate in
`ORIGINAL-QUESTION-MAPPING.md`, which remains as a historical inventory and mapping.

> This is an educational estimate from a custom lifestyle quiz. It does not measure biological age or diagnose health conditions.

The live domain and public repository have not been changed. No push, deployment,
real email, subscription, external health-data submission, transfer, credentials,
spending, or filesystem-share/security configuration occurred.

## Original coefficients for friend review

Source: [the owner's public script](https://yourpurepath.com/script.js), read by
public GET on October 12, 2026. `ILLUSTRATIVE-SCORING-REFERENCE.json` records the
source URL, retrieval time, SHA-256, exact weights/maps, and source conversion.
`scripts/capture-scoring-reference.py` extracts coefficient literals without
running public JavaScript. The live question inventory remains in
`ORIGINAL-ASSESSMENT-INVENTORY.json`.

All existing factor values and weights are retained. The weights total **98**;
normalization divides by 98 rather than assuming they total 100.

| Factor | Weight | Original answer factors |
| --- | ---: | --- |
| BMI | 5 | See continuous BMI table below |
| Nicotine | 10 | current .05; former .62; never 1 |
| Exercise | 8 | rarely .18; 1–2 days .50; 3–4 .82; 5+ 1 |
| Strength | 5 | none .15; 1 day .45; 2–3 .82; 4+ 1 |
| Sedentary hours | 5 | 10+ .15; 7–9 .45; 4–6 .78; 0–3 1 |
| Sleep duration | 5 | under 5 .10; 5–6 .48; 7–8 1; 9+ .72 |
| Sleep quality | 4 | poor .15; fair .48; good .80; excellent 1 |
| Diet quality | 8 | poor .12; fair .50; good .80; excellent 1 |
| Sugary drinks | 3 | 2+ daily .12; 1 daily .45; a few weekly .78; rarely/none 1 |
| Vegetables | 4 | 0–1 servings .18; 2–3 .55; 4–5 .86; 6+ 1 |
| Water | 3 | under 4 cups .20; 4–6 .58; 7–9 .88; 10+ 1 |
| Alcohol | 3 | heavy .18; moderate .50; light .82; none 1 |
| Stress | 5 | high .18; moderate .52; manageable .82; low 1 |
| Social support | 4 | limited .20; some .52; strong .82; very strong 1 |
| Blood pressure | 6 | diagnosed/elevated .18; borderline .56; normal 1 |
| Blood sugar | 6 | diabetes/prediabetes .12; borderline .54; normal 1 |
| Cholesterol | 4 | high/treated .28; borderline .60; normal 1 |
| Energy | 4 | low .18; variable .54; good .82; strong 1 |
| Functional fitness | 6 | limited .18; average .55; good .82; excellent 1 |

Age is the comparison baseline. Height and weight produce BMI. **Sex has no
coefficient in the source formula.** Its original question remains, is optional,
and explicitly says it does not change the estimate. No new sex coefficient or
interpretation was added.

## Exact conversion and boundary corrections

The retained formula, using JavaScript `Math.round`, is:

```text
BMI = pounds / (inches × inches) × 703
weightedTotal = sum(factor × original weight)
score = round(weightedTotal / 98 × 100)
adjustment = clamp(((70 − score) / 30) × 10, −12, +15)
illustrativeQuizAge = round(actualAge + adjustment)
difference = illustrativeQuizAge − actualAge
```

The constants 703, 70, 30, 10, −12 and +15, source weights, option factors, and
rounding are unchanged. **The final source caps at 18 and 95 are removed.**
This is a display/meaning correction, not a new year coefficient. An age-100
worst-factor example yields 115 and +15 rather than a capped 95 and an apparent
−5. An age-18 all-best example yields 8 and −10. The visible note explains that
these numbers may be below 18 or above 100 and are not the person's body age.

Continuous BMI bands retain the original factors while closing the source's
24.9–25, 29.9–30, and 34.9–35 gaps. Scoring uses full precision; BMI is rounded to
one decimal only for display.

| BMI interval | Custom factor |
| --- | ---: |
| Below 16 | .12 |
| 16 ≤ BMI < 17 | .34 |
| 17 ≤ BMI < 18.5 | .68 |
| 18.5 ≤ BMI < 25 | 1 |
| 25 ≤ BMI < 30 | .68 |
| 30 ≤ BMI < 35 | .34 |
| BMI ≥ 35 | .12 |

These are retained **custom-quiz** factors, not a recommendation to target a BMI
or a validated age conversion. The UI gives the numeric BMI without a health
category or weight-loss recommendation. [CDC's BMI guidance](https://www.cdc.gov/bmi/about/index.html)
supports considering BMI with other factors and uses age-specific interpretation
for ages 18–19. Retaining the original formula for 18–19 is an explicit heuristic
choice, not a clinical BMI classification or validation claim.

## Missing answers, scope, and other material choices

The source bounds are explicit: integer age **18–100**, height **48–84 inches**,
weight **80–500 pounds**. Decimal height/weight are accepted within those ranges.
They describe the source's input scope; they do not prove applicability to every
adult or body type. There are no default numbers or radio answers. Not sure, Skip,
blank, unsupported choices, non-finite values and out-of-bound numbers produce
**no numeric estimate** when they affect scoring. There is no healthy imputation
or normalization over only answered questions. The user can review answers and
conversation ideas instead.

The original three “borderline or unsure” choices are split into a known
borderline choice retaining its old factor and a distinct Not sure choice that
withholds the number. This deliberate change prevents uncertainty from being
scored as a known clinical state. The original 22 IDs and original known option
IDs remain. Broad/undefined source concepts, including water timeframe/cup size,
vegetable serving size, diet quality, alcohol categories and nicotine product
scope, are disclosed in question help; no new numeric definitions were invented.

No claim is made that more water or vegetables, less disability, or a treated
condition necessarily means better individual health. The old arbitrary weights
still encode those preferences, which are material limitations for friend review.
The adult bounds and self-reported categories are not a validated model population.

The source's reassuring/medical-sounding categories, wellness-grade display,
score ring, and claims about a younger body are omitted. Discussion ideas use
explicit relevant answers rather than forcing the three lowest factor messages:
never/former nicotine users receive no quitting prompt; low BMI receives no
weight-loss suggestion; limited function receives an inclusive care-team prompt.
Advice to change medicine or stop existing care is not given. Weight values do not
select a recommendation. At most three neutral conversation ideas are displayed.

English/Spanish render from structured content; language changes preserve raw
answers and view state, translate validation, and never calculate automatically.
Reset clears answers, result, email, consent and pending verification while keeping
the selected language. Leaving/reloading also clears memory.

## Privacy and delivery behavior

No native form exists. With JavaScript disabled or failed, the static page has no
health input or submit controls and displays a reload/no-script notice. There is
no answer URL serialization, browser storage, analytics, logging, or external
submission from the quiz. Result and answer text use `textContent`.

Results are visible without email. Two separate consent boxes start unchecked.
The exact result-email preview includes the educational disclosure. A result-copy
request first invokes the mock neutral verification method with email and consent
only; a separate explicit simulation precedes the result mock. Newsletter calls
contain **email and newsletter consent only**, never answers, results, health tags,
or a counselor/CRM copy. Every mock reports **Not sent**. The shared mock adapter
from the preserved Snapshot is reused without changing it.

Provider, account/domain ownership, controller, privacy notice, retention/deletion,
consent-recording and unsubscribe details still need approval before live delivery.
No production privacy promise is inferred from this local implementation.

## Local files, routes and portability

Authoritative source folder: **`D:\Projects\YourPurePath` on TRON**.

- New stable route: `/health-age-assessment/`.
- Preserved eight-question route: `/wellness-snapshot/`.
- Preserved prior Snapshot homepage: `/wellness-snapshot-home.html`.
- Current homepage links to both versions. Original Claude Design files and all
  Snapshot component/page files retain their bytes.
- New implementation: `components/educational-age/` and
  `health-age-assessment/`. No whole-site redesign or original-art overwrite.

Portable commands from the project folder:

```text
npm start
npm test
npm run verify
npm run verify:copy
npm run build:home
```

The equivalent dependency-free direct commands are `node scripts/serve.mjs`,
`node --test tests/*.test.mjs`, `node scripts/verify-preservation.mjs`,
`node scripts/checksum.mjs verify`, and `node scripts/build-illustrative-home.mjs`.
No `npm install` is needed. Tested with Node **24.18.0** on TRON; use that version
or a compatible Node 24 runtime for reproducing the handoff. The optional source
inspection/capture scripts use Python's standard library (tested with 3.13.15)
and public GETs; they are not needed to run the app or tests.

There are **no Windows-only runtime dependencies**. Node built-ins handle paths
and directory routing; no COM, PowerShell, registry, local credentials or absolute
Windows runtime path is used by the app. Windows paths in this document/manifest
record provenance only. The local server binds to `127.0.0.1:4173`, accepts GET/HEAD,
and rejects POST. It is a preview server, not a production hosting configuration.
The old `scripts/build-home.mjs` reconstructs the Snapshot artboard; the current
`npm run build:home` uses `build-illustrative-home.mjs` to keep both version links.

## Verification and later copy

Automated tests cover exact source weights/maps and original IDs, all scored-field
missing/unknown cases, adult/input extremes, continuous BMI boundaries, original
rounding/year coefficients, uncapped old-age direction, monotonicity, irrelevant
recommendations, disclosure/email preview, no-JS/no-form privacy, route serving,
bilingual edit/reset/validation and all consent permutations. The original Snapshot
tests also pass. Independent review found no blocking issues and checked an
additional 747 input combinations, dense BMI coverage, accessible control semantics,
and pending-address-change cancellation. It did not perform a screen-reader pass.

Chrome browser verification with synthetic data completed all 22 questions, showed
age 42 → quiz age 32 with the exact adjacent disclosure and no email, exercised
English/Spanish switching and editing, withheld a number after age 17, and confirmed
reset/mocked neutral verification/independent newsletter behavior. Mobile DOM
measurements found no horizontal overflow at 375 and 305 effective content pixels.
Screenshots were captured in the task conversation. This is not a full WCAG or
screen-reader certification.

`COPY-MANIFEST.json` is generated last, after editing, by
`node scripts/checksum.mjs write`. It records relative paths, byte sizes and SHA-256
for every project file except itself and Mac `.DS_Store` metadata. Verify the frozen
TRON source and later copy with `node scripts/checksum.mjs verify`. Do not regenerate
the manifest on the Mac before checking it; that would mask a bad copy.

Brian reports the shared drive on QUORRA as **TRON-D**, with
`Projects/YourPurePath`. The parent should resolve the actual mounted share path on
QUORRA, copy this complete frozen folder into a dedicated local
**`~/Projects/YourPurePath`**, and leave TRON as backup. Confirm that the resolved
destination is the separate YourPurePath project; do not overwrite an existing
folder with unreviewed changes or use a TrailMark directory. If the destination
already exists, use a fresh staging sibling and resolve ownership/contents before
replacing it. Verify the manifest and run the portable checks on the Mac before
continuing edits. No cross-machine transfer has occurred in this task, and no share
or security settings have been changed.

The route is ready for a future QR target **after** approved integration and
publication. It is not a newly published URL on `yourpurepath.com`.

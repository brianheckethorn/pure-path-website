# Local Wellness Snapshot handoff

Implemented on TRON in `D:\Projects\YourPurePath`. This folder contains a Claude
Design export, not a checkout of the public repository. Nothing was pushed or
deployed; `yourpurepath.com` has not been changed.

## Preview and checks

From this folder:

```powershell
npm start
npm test
npm run verify
```

The preview binds only to `127.0.0.1:4173`. Open
`http://127.0.0.1:4173/` for the home artboard and
`http://127.0.0.1:4173/wellness-snapshot/` for the direct route. The slashless path
redirects to the directory route. `/wellness-snapshot/` is the stable path to use
for a future QR code **after** approved integration and publication. It is not
currently a published route on the live domain.

## Preservation and architecture

All six original files retain their original SHA-256 hashes: `Neighbor.dc.html`,
`README.md`, `support.js`, the uploaded JPG, and the two React vendor files.
`scripts/verify-preservation.mjs` checks them. `index.html` is generated from the
original artboard by `scripts/build-home.mjs`: only the questionnaire navigation,
callout, and static question example change. The design's portrait, credentials,
story, hours, booking and Spanish-link placeholders remain as supplied. They are
not production-ready content. The palette, imagery, spacing, and font families
remain the same. Both local pages load local copies of Karla and DM Serif Display;
their OFL licenses are in `assets/fonts/`.

The standalone page uses `wellness-snapshot/page.js` to mount the reusable module
in `components/wellness-snapshot/component.js`. Content, descriptive result logic,
mocked delivery, and styling have separate modules. No package installation or
framework was needed. To reuse the component, include `assets/fonts/fonts.css`
and `snapshot.css`, apply the `snapshot-page` host class, provide a `snapshot-card`
mount element, and call `mountWellnessSnapshot(root, { content, delivery })` with
the content export and `createMockDeliveryAdapter()`. The returned controller has
`reset()` and `dispose()`.

## Assessment and data behavior

The parent specification received October 12, 2026 supplies eight optional,
plain-language questions, an initially unanswered adult gate, and four descriptive
domains. Every question starts blank with Not sure and Skip options. Results
distinguish no days, not sure, skipped, and not answered; all blank/skipped answers
show the requested general-tips message. No score, grade, biological/health age,
BMI, clinical classification, or inference of activity guideline adherence is
calculated. No exact age, DOB, name, measurements, labs, diagnoses, or health
history text is collected. Results appear before optional email choices.

Answers and optional email input exist only in page memory. No native HTML form,
URL serialization, cookies, browser storage, analytics, logging, or delivery
network calls are used by the assessment. Reset, reload and leaving the page clear
that state. If JavaScript fails, the static page exposes no health input controls
and cannot submit answers. Source links use no-referrer behavior.

The two optional consent boxes start unchecked and operate independently.
The exact plain-text result message is visible before any result-email mock.
A snapshot request first previews a neutral verification message with only email
and affirmative consent; a separate explicit simulation represents a verified
address before the result-email mock. The newsletter adapter receives only email
and its affirmative consent, never answers, results, health tags, or a counselor
copy. Every successful mock clearly states **Not sent**. No email or subscription
is created and the adapters retain nothing.

## Content sources and limits

The provided sources are displayed beside the relevant result domains:

- [AHA: fruit and vegetable choices](https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/fresh-frozen-or-canned-fruits-and-vegetables-all-can-be-healthy-choices)
- [CDC: adult activity](https://www.cdc.gov/physical-activity-basics/guidelines/adults.html)
- [CDC: activity with health conditions and disabilities](https://www.cdc.gov/physical-activity-basics/guidelines/chronic-health-conditions-and-disabilities.html)
- [CDC: sleep](https://www.cdc.gov/sleep/about/index.html)
- [CDC: vaping and quitting](https://www.cdc.gov/tobacco/e-cigarettes/quitting.html)
- [FTC: health app privacy practices](https://www.ftc.gov/business-guidance/resources/mobile-health-app-developers-ftc-best-practices)

The questions are custom educational reflections, not a validated medical
instrument. The supplied source list does not validate the questionnaire as a
whole. In particular, the whole-grain frequency question is descriptive only and
is not mapped to an invented threshold. Clinical/content review remains required
before publication.

## Verification record

Fifteen automated tests cover the content branches, answer distinctions, no
defaults, consent permutations, payload separation, malformed email, verification
gate, delayed mock response after reset, component back/edit/clear/reset, generated
homepage preservation, no form/network/storage code, local routes, font files,
redirect, and rejection of traversal and POST. The DOM event harness exercises
component behavior; it does not claim to emulate layout.

Chrome browser checks with synthetic answers separately verified the adult gate,
keyboard start, all eight questions, back/skip/unsure retention, results without
email, nonjudgmental never-use tobacco output, mocked neutral verification,
independent newsletter request, edit, reset, and all-missing results. The URL stayed
`/wellness-snapshot/` throughout. Mobile screenshots and DOM measurements confirmed
no horizontal overflow at 375- and 305-pixel effective content widths (390/320
viewport overrides minus the scrollbar). The browser override was reset afterward.
No application errors were observed; browser-extension warnings were unrelated.

An independent reviewer found two issues: a trailing-separator Windows server
path bug and missing fonts on a fresh direct visit. Both were fixed and independently
rechecked. Valid routes and all five TTF files returned 200, all fifteen tests
passed, and all original-file hashes remained unchanged. A final browser check
caught and corrected two en-dash replacements in the homepage's static example.

## Still gated

Live delivery requires approved provider, domain/account ownership, data
controller, privacy notice, retention/deletion, consent records and unsubscribe
details, plus a real neutral address-verification design. No production privacy
promise is inferred from this local mock. Publication and integration with the
public repository require separate authorization and content review. No production
deployment, push, spending, credentials, external health-data submissions,
mailing-list subscriptions, or other-project/service changes occurred.

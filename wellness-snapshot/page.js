// Keep existing bookmarks working through the single primary assessment.
// A fixed relative target drops any old query/hash and avoids a back-button
// loop. The HTML meta refresh and visible link also work without this module.
const assessmentURL = new URL('../health-age-assessment/', window.location.href);
window.location.replace(assessmentURL.href);

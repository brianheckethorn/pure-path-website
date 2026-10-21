// Homepage-only reorganization. Questionnaire source and runtime remain separate.
const facebookIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect width="24" height="24" rx="5" fill="#1877F2"/><path d="M14.5 22V13.1h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8H18V2.4c-.6-.1-1.7-.2-2.6-.2-2.6 0-4.4 1.6-4.4 4.5v2.9H8v3.5h3V22h3.5Z" fill="#FFFFFF"/></svg>';
const opening = `
<section class="home-opening" aria-labelledby="intro-heading">
<header class="site-header">
<a class="brand" href="#" aria-label="Your Pure Path home"><img src="./assets/a143c2a9960446d649523f272677f609.jpg" alt="" width="38" height="38"><span>Your Pure Path</span></a>
<nav id="site-navigation" aria-label="Main"><a href="#story">My story</a><a href="#help">How I help</a><a href="#talk">Let's talk</a></nav>
<a class="social" href="https://www.facebook.com/YourPurePath" aria-label="Your Pure Path on Facebook">${facebookIcon}<span>Facebook</span></a>
<button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg><span>Menu</span></button>
</header>
<div class="home-hero" id="main" tabindex="-1">
<div class="hero-copy"><p class="hero-greeting"><span lang="es">Hola</span> — I'm Mario.</p><h1 id="intro-heading">Let's find your path to feeling well.</h1><p class="hero-intro">I'm a Functional Nutritional Counselor in Kearneysville. I listen first, then help you make small changes to food and habits that actually stick.</p><a class="hero-contact" href="#talk">Prefer to talk first? Let's talk <span aria-hidden="true">↗</span></a></div>
<div class="hero-portrait"><img src="./assets/mario-portrait.jpg" alt="Mario" width="360" height="360"></div>
</div></section>
<section id="quiz" class="path-choices" aria-labelledby="choices-heading"><div class="choices-inner"><p class="section-eyebrow">A starting point that fits you</p><h2 id="choices-heading">How would you like to begin?</h2>
<div class="choices-grid"><article class="choice-card"><p class="choice-number">01 · Explore your everyday habits</p><h3>Take the Health Age Assessment</h3><p>Explore 29 questions about your daily habits and health history, with a rough educational health-age estimate when enough scoring information is available.</p><p class="choice-detail">English / Español · Not known and prefer not to answer are valid responses.</p><a href="./health-age-assessment/" class="choice-action">Start my Health Age Assessment</a><details><summary>About this assessment</summary><p>Get practical next steps matched to your answers and a personal report you can print, save as a PDF, or share yourself. The scoring and conversion to years are custom educational choices. This quiz is not scientifically validated and does not measure biological age or diagnose health conditions.</p></details></article>
<article class="choice-card consultation-choice"><p class="choice-number">02 · Get ready for a conversation</p><h3>Prepare for Your Consultation</h3><p>Reflect on what you'd like to discuss with Mario before a teleconsult or an in-person consultation. Answer only what feels useful.</p><p class="choice-detail">All questions are optional · Review, download or print your notes.</p><a href="./consultation/" class="choice-action">Prepare for my consultation</a><p class="choice-privacy">Answers stay in page memory and are not sent to or retained by this website. You choose whether to share your downloaded or printed copy.</p></article></div>
</div></section>`;
export function reframeHome(html) {
  return html
    .replace('</head>', '<link rel="stylesheet" href="./home/home.css">\n<script src="./home/navigation.js" defer></script>\n</head>')
    .replace('<body>', '<body>\n<a class="home-skip" href="#main">Skip to main content</a>')
    .replace('<div style="font-family:', '<main class="home-page" style="font-family:')
    .replace('</div>\n\n</body>', '</main>\n\n</body>')
    .replace(/<section style="background: #26301A; color: #F4F1E6">[\s\S]*?<\/section>/, opening)
    .replace(/<section id="quiz" style=[\s\S]*?<\/section>/, '')
    .replace('<section id="story"', '<section id="story" tabindex="-1"')
    .replace('<section id="help"', '<section id="help" tabindex="-1"')
    .replace('<section id="talk"', '<section id="talk" tabindex="-1"');
}

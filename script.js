const form = document.getElementById("health-age-form");
const healthAgeValue = document.getElementById("health-age-value");
const actualAgeValue = document.getElementById("actual-age-value");
const estimatedHealthAgeValue = document.getElementById("estimated-health-age-value");
const differenceValue = document.getElementById("difference-value");
const bmiValue = document.getElementById("bmi-value");
const categoryValue = document.getElementById("category-value");
const summaryText = document.getElementById("summary-text");
const improvementsList = document.getElementById("improvements-list");
const scoreRing = document.getElementById("score-ring");
const currentYear = document.getElementById("current-year");
const topNav = document.querySelector(".top-nav");

const weights = {
  bmi: 5,
  nicotine: 10,
  exercise: 8,
  strength: 5,
  sedentary: 5,
  sleepDuration: 5,
  sleepQuality: 4,
  dietQuality: 8,
  sugaryDrinks: 3,
  vegetables: 4,
  water: 3,
  alcohol: 3,
  stress: 5,
  socialSupport: 4,
  bloodPressure: 6,
  bloodSugar: 6,
  cholesterol: 4,
  energy: 4,
  functionalFitness: 6
};

const scoringMaps = {
  nicotine: { current: 0.05, former: 0.62, never: 1 },
  exercise: { rarely: 0.18, "1-2": 0.5, "3-4": 0.82, "5+": 1 },
  strength: { none: 0.15, "1": 0.45, "2-3": 0.82, "4+": 1 },
  sedentary: { "10+": 0.15, "7-9": 0.45, "4-6": 0.78, "0-3": 1 },
  sleepDuration: { lt5: 0.1, "5-6": 0.48, "7-8": 1, "9+": 0.72 },
  sleepQuality: { poor: 0.15, fair: 0.48, good: 0.8, excellent: 1 },
  dietQuality: { poor: 0.12, fair: 0.5, good: 0.8, excellent: 1 },
  sugaryDrinks: { "2+": 0.12, "1": 0.45, few: 0.78, none: 1 },
  vegetables: { "0-1": 0.18, "2-3": 0.55, "4-5": 0.86, "6+": 1 },
  water: { lt4: 0.2, "4-6": 0.58, "7-9": 0.88, "10+": 1 },
  alcohol: { heavy: 0.18, moderate: 0.5, light: 0.82, none: 1 },
  stress: { high: 0.18, moderate: 0.52, manageable: 0.82, low: 1 },
  socialSupport: { low: 0.2, some: 0.52, good: 0.82, excellent: 1 },
  bloodPressure: { diagnosed: 0.18, borderline: 0.56, normal: 1 },
  bloodSugar: { diagnosed: 0.12, borderline: 0.54, normal: 1 },
  cholesterol: { high: 0.28, borderline: 0.6, normal: 1 },
  energy: { low: 0.18, mixed: 0.54, good: 0.82, high: 1 },
  functionalFitness: { limited: 0.18, average: 0.55, good: 0.82, excellent: 1 }
};

const improvementMessages = {
  bmi: "If weight management is one of your goals, a steady focus on protein, fiber, walking, and strength work can improve body composition over time.",
  nicotine: "Reducing or eliminating nicotine use would be one of the most meaningful steps you could take for long-term Health Age improvement.",
  exercise: "A realistic next step is building toward regular weekly cardio or brisk walking to support heart health, energy, and metabolic resilience.",
  strength: "Adding even two short strength sessions each week can support muscle, mobility, and a younger functional Health Age.",
  sedentary: "Try breaking up sitting time with brief walks, stretching, or standing breaks every hour to support circulation and energy.",
  sleepDuration: "A more consistent sleep window, with most nights landing around 7 to 8 hours, could meaningfully improve your recovery profile.",
  sleepQuality: "Improving sleep quality with a calmer evening routine, less screen exposure, and a darker room may help your Health Age trend in a better direction.",
  dietQuality: "Shifting more meals toward whole, minimally processed foods would likely have a broad positive effect on your overall wellness score.",
  sugaryDrinks: "Replacing sugary drinks with water, tea, or sparkling water is a practical way to support steadier energy and metabolic health.",
  vegetables: "A simple next step is adding vegetables more consistently at lunch and dinner to improve fiber and nutrient intake.",
  water: "More consistent hydration could support energy, digestion, and recovery throughout the day.",
  alcohol: "Reducing alcohol intake may help improve sleep quality, recovery, and stress resilience.",
  stress: "Daily stress regulation habits such as walking, prayer, journaling, breath work, or quiet recovery time may have an outsized benefit here.",
  socialSupport: "Investing in supportive relationships, community, or regular connection can strengthen resilience in ways that matter for long-term wellness.",
  bloodPressure: "If blood pressure has been elevated, prioritizing movement, food quality, sleep, and medical follow-up would be especially worthwhile.",
  bloodSugar: "If blood sugar has been a concern, a strong next step would be pairing balanced meals with regular movement and ongoing professional follow-up.",
  cholesterol: "Improving food quality, activity, and follow-up care could help support healthier cholesterol patterns over time.",
  energy: "Low energy often improves when sleep, nourishment, stress load, and movement rhythm become more supportive and consistent.",
  functionalFitness: "Mobility work, walking, and strength training could help improve how capable and energetic your body feels day to day."
};

function setNavOffset() {
  if (!topNav) return;
  const navHeight = Math.ceil(topNav.getBoundingClientRect().height);
  document.documentElement.style.setProperty("--nav-offset", `${navHeight + 8}px`);
}

function calculateBmi(heightInches, weightPounds) {
  return (weightPounds / (heightInches * heightInches)) * 703;
}

function getBmiScore(bmi) {
  if (bmi >= 18.5 && bmi <= 24.9) return 1;
  if ((bmi >= 25 && bmi <= 29.9) || (bmi >= 17 && bmi < 18.5)) return 0.68;
  if ((bmi >= 30 && bmi <= 34.9) || (bmi >= 16 && bmi < 17)) return 0.34;
  return 0.12;
}

function getBmiLabel(bmi) {
  if (bmi < 18.5) return "Underweight range";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight range";
  return "Obesity range";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getCategory(diff) {
  if (diff <= -6) {
    return {
      title: "Thriving foundation",
      tone: "Your current habits are supporting a Health Age that appears meaningfully younger than your chronological age."
    };
  }

  if (diff <= 1) {
    return {
      title: "Steady and supported",
      tone: "Your estimated Health Age is close to your chronological age, suggesting a fairly balanced wellness foundation."
    };
  }

  if (diff <= 6) {
    return {
      title: "Growth opportunity",
      tone: "A few habit or health-history factors may be pulling your estimated Health Age upward right now."
    };
  }

  return {
    title: "Needs extra attention",
    tone: "Several wellness markers appear to be placing added strain on your current health trajectory."
  };
}

function buildSummary(actualAge, healthAge, score, bmi, bmiLabel, category) {
  const diff = Math.round(healthAge - actualAge);
  const direction = diff > 0 ? `${diff} years older` : `${Math.abs(diff)} years younger`;
  const neutralPhrase = diff === 0 ? "about the same as your chronological age" : `${direction} than your chronological age`;

  return `${category.tone} Based on this weighted wellness model, your estimated Health Age is ${neutralPhrase}. Your wellness score is ${score}/100, and your estimated BMI is ${bmi.toFixed(1)} (${bmiLabel}).`;
}

function getTopImprovements(factorScores) {
  return factorScores
    .filter((entry) => entry.key !== "bmi" || entry.score < 0.95)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((entry) => improvementMessages[entry.key]);
}

function renderResults(result) {
  healthAgeValue.textContent = result.healthAge.toString();
  actualAgeValue.textContent = result.actualAge.toString();
  estimatedHealthAgeValue.textContent = `${result.healthAge} years`;
  differenceValue.textContent = result.differenceLabel;
  bmiValue.textContent = `${result.bmi.toFixed(1)} - ${result.bmiLabel}`;
  categoryValue.textContent = result.category.title;
  summaryText.textContent = result.summary;

  improvementsList.innerHTML = "";
  result.improvements.forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    improvementsList.appendChild(item);
  });

  const progress = clamp((result.score / 100) * 360, 36, 360);
  scoreRing.style.background = `
    radial-gradient(circle at center, #fffaf5 0 59%, transparent 60%),
    conic-gradient(#7a8f66 0deg, #c59b6c ${progress}deg, rgba(197, 155, 108, 0.16) ${progress}deg, rgba(197, 155, 108, 0.16) 360deg)
  `;
}

function calculateHealthAge() {
  const formData = new FormData(form);
  const age = Number(formData.get("age"));
  const height = Number(formData.get("height"));
  const weight = Number(formData.get("weight"));
  const bmi = calculateBmi(height, weight);
  const bmiScore = getBmiScore(bmi);

  const factorScores = [{ key: "bmi", score: bmiScore }];

  Object.keys(scoringMaps).forEach((key) => {
    factorScores.push({
      key,
      score: scoringMaps[key][formData.get(key)]
    });
  });

  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const weightedTotal = factorScores.reduce((sum, factor) => sum + (factor.score * weights[factor.key]), 0);
  const score = Math.round((weightedTotal / totalWeight) * 100);
  const ageAdjustment = clamp(((70 - score) / 30) * 10, -12, 15);
  const healthAge = Math.round(clamp(age + ageAdjustment, 18, 95));
  const diff = healthAge - age;
  const differenceLabel = diff === 0 ? "0 years" : `${diff > 0 ? "+" : "-"}${Math.abs(diff)} years`;
  const category = getCategory(diff);
  const bmiLabel = getBmiLabel(bmi);
  const summary = buildSummary(age, healthAge, score, bmi, bmiLabel, category);
  const improvements = getTopImprovements(factorScores);

  renderResults({
    actualAge: age,
    bmi,
    bmiLabel,
    score,
    healthAge,
    differenceLabel,
    category,
    summary,
    improvements
  });
}

function resetResults() {
  healthAgeValue.textContent = "--";
  actualAgeValue.textContent = "--";
  estimatedHealthAgeValue.textContent = "--";
  differenceValue.textContent = "--";
  bmiValue.textContent = "--";
  categoryValue.textContent = "Complete the form";
  summaryText.textContent = "Fill out the questionnaire to see a clear educational estimate, a practical summary, and the habits most likely to support a healthier direction.";
  improvementsList.innerHTML = "<li>Balanced movement, nourishing meals, and consistent recovery habits can meaningfully shift your Health Age over time.</li>";
  scoreRing.style.background = `
    radial-gradient(circle at center, #fffaf5 0 59%, transparent 60%),
    conic-gradient(#7a8f66 0deg, #c59b6c 180deg, rgba(197, 155, 108, 0.16) 180deg, rgba(197, 155, 108, 0.16) 360deg)
  `;
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear().toString();
}

setNavOffset();
window.addEventListener("resize", setNavOffset);
window.addEventListener("load", setNavOffset);

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateHealthAge();
  });

  form.addEventListener("reset", () => {
    window.setTimeout(resetResults, 0);
  });
}

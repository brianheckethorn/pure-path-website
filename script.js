const form = document.getElementById("health-age-form");
const healthAgeValue = document.getElementById("health-age-value");
const bmiValue = document.getElementById("bmi-value");
const categoryValue = document.getElementById("category-value");
const summaryText = document.getElementById("summary-text");
const improvementsList = document.getElementById("improvements-list");
const scoreRing = document.getElementById("score-ring");
const currentYear = document.getElementById("current-year");

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
  bmi: "Aim for a sustainable body composition shift through consistent movement, strength work, and nutrition habits if weight management is a current goal.",
  nicotine: "Reducing or eliminating nicotine use is one of the highest-impact changes for long-term health resilience.",
  exercise: "Build toward regular weekly cardio or brisk movement to support heart health, energy, and metabolic function.",
  strength: "Add strength training to preserve muscle, mobility, and functional independence over time.",
  sedentary: "Break up long sitting periods with short walking, stretching, or standing breaks through the day.",
  sleepDuration: "Prioritize a steadier sleep window, with most adults benefiting from around 7 to 8 hours nightly.",
  sleepQuality: "Improve sleep quality with a calming wind-down routine, darker sleep space, and more consistent bedtime habits.",
  dietQuality: "Focus on more whole, minimally processed meals built around protein, fiber, and nutrient-dense foods.",
  sugaryDrinks: "Cutting back on sugary drinks can improve energy regulation, appetite balance, and metabolic health.",
  vegetables: "Increase daily vegetable intake to strengthen fiber, micronutrient, and gut health support.",
  water: "Drinking more water consistently can support energy, digestion, and exercise recovery.",
  alcohol: "Reducing alcohol intake may improve sleep, recovery, stress resilience, and cardiometabolic wellness.",
  stress: "Support your nervous system with stress-reduction habits like walking, breath work, boundaries, and recovery time.",
  socialSupport: "Strong relationships are protective for health, so invest in supportive connection where you can.",
  bloodPressure: "If blood pressure has been elevated, consistent lifestyle changes and medical follow-up are both worth prioritizing.",
  bloodSugar: "If blood sugar has been a concern, nutrition quality, movement after meals, and professional monitoring can make a meaningful difference.",
  cholesterol: "Improving food quality, activity, and follow-up care can help support healthier cholesterol patterns.",
  energy: "Low daily energy is often a signal to review sleep, nutrition quality, stress load, and recovery capacity.",
  functionalFitness: "Improving mobility, balance, and everyday strength can meaningfully lower your functional health age."
};

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
      tone: "Your current habits are supporting a health age meaningfully younger than your chronological age."
    };
  }

  if (diff <= 1) {
    return {
      title: "Steady and supported",
      tone: "Your estimated health age is close to your chronological age, suggesting a fairly balanced wellness foundation."
    };
  }

  if (diff <= 6) {
    return {
      title: "Growth opportunity",
      tone: "A few habit or health-history factors may be pulling your estimated health age upward right now."
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

  return `${category.tone} Based on this weighted wellness model, your estimated health age is ${neutralPhrase}. Your wellness score is ${score}/100, and your estimated BMI is ${bmi.toFixed(1)} (${bmiLabel}).`;
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
  const category = getCategory(diff);
  const bmiLabel = getBmiLabel(bmi);
  const summary = buildSummary(age, healthAge, score, bmi, bmiLabel, category);
  const improvements = getTopImprovements(factorScores);

  renderResults({
    bmi,
    bmiLabel,
    score,
    healthAge,
    category,
    summary,
    improvements
  });
}

function resetResults() {
  healthAgeValue.textContent = "--";
  bmiValue.textContent = "--";
  categoryValue.textContent = "Complete the form";
  summaryText.textContent = "Fill out the questionnaire to see a personalized educational estimate and your strongest wellness opportunities.";
  improvementsList.innerHTML = "<li>Balanced movement, nourishment, and recovery habits can meaningfully shift your result over time.</li>";
  scoreRing.style.background = `
    radial-gradient(circle at center, #fffaf5 0 59%, transparent 60%),
    conic-gradient(#7a8f66 0deg, #c59b6c 180deg, rgba(197, 155, 108, 0.16) 180deg, rgba(197, 155, 108, 0.16) 360deg)
  `;
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear().toString();
}

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateHealthAge();
  });

  form.addEventListener("reset", () => {
    window.setTimeout(resetResults, 0);
  });
}

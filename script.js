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
const languageToggle = document.querySelector(".language-toggle");

let currentLanguage = localStorage.getItem("yourPurePathLanguage") || "en";
let textNodes = [];
let lastResult = null;
const initialPageTitle = document.title;

const spanishText = {
  "Your Pure Path | Functional Nutrition Counseling": "Your Pure Path | Consejeria de nutricion funcional",
  "Your Pure Path | Health Age": "Your Pure Path | Edad de Salud",
  "Your Pure Path | Complete the Health Age Assessment": "Your Pure Path | Completa la evaluación de Edad de Salud",
  "Home": "Inicio",
  "About": "Acerca de",
  "Health Age": "Edad de Salud",
  "Contact": "Contacto",
  "Functional nutrition guidance for real life": "Guia de nutricion funcional para la vida real",
  "Your path to better health can start with one steady step.": "Tu camino hacia una mejor salud puede comenzar con un paso firme.",
  "Your Pure Path offers warm, practical nutrition and wellness support for people who want to feel more confident in their daily choices, energy, and long-term health.": "Your Pure Path ofrece apoyo calido y practico en nutricion y bienestar para personas que desean sentirse mas seguras en sus decisiones diarias, energia y salud a largo plazo.",
  "Contact Mario": "Contactar a Mario",
  "Health Age Tool": "Herramienta de Edad de Salud",
  "Support that feels personal": "Apoyo que se siente personal",
  "Functional nutrition counseling": "Consejeria de nutricion funcional",
  "Practical wellness and lifestyle support": "Apoyo practico de bienestar y estilo de vida",
  "Encouraging next steps you can use daily": "Proximos pasos alentadores que puedes usar cada dia",
  "Serving the Eastern Panhandle of West Virginia": "Sirviendo al Eastern Panhandle de West Virginia",
  "About Your Pure Path": "Acerca de Your Pure Path",
  "Warm guidance for nutrition, wellness, and everyday habits.": "Guia calida para nutricion, bienestar y habitos diarios.",
  "Your Pure Path is a functional nutrition and wellness practice created to help people build a clearer, more supportive path toward better health.": "Your Pure Path es una practica de nutricion funcional y bienestar creada para ayudar a las personas a construir un camino mas claro y con mas apoyo hacia una mejor salud.",
  "Mario is a Functional Nutritional Counselor serving the Eastern Panhandle of West Virginia. He helps clients look at food, habits, energy, and lifestyle patterns with practical steps that feel realistic in everyday life.": "Mario es un Consejero de Nutricion Funcional que sirve al Eastern Panhandle de West Virginia. Ayuda a sus clientes a observar la alimentacion, los habitos, la energia y los patrones de estilo de vida con pasos practicos que se sienten realistas en la vida diaria.",
  "How Mario helps": "Como ayuda Mario",
  "Personal support without overwhelm.": "Apoyo personal sin abrumarte.",
  "The work is grounded in simple education, steady encouragement, and personalized wellness support that meets you where you are.": "El trabajo se basa en educacion sencilla, animo constante y apoyo personalizado de bienestar que comienza donde tu estas.",
  "Nutrition": "Nutricion",
  "Understand what supports your body.": "Entiende que apoya a tu cuerpo.",
  "Get clear guidance around food choices, meal patterns, and nourishing habits that fit your life.": "Recibe guia clara sobre elecciones de alimentos, patrones de comida y habitos nutritivos que se adaptan a tu vida.",
  "Wellness": "Bienestar",
  "Build routines that support energy.": "Construye rutinas que apoyen tu energia.",
  "Explore practical changes around hydration, sleep, movement, stress, and daily rhythm.": "Explora cambios practicos en hidratacion, sueno, movimiento, estres y ritmo diario.",
  "Support": "Apoyo",
  "Take the next step with confidence.": "Da el proximo paso con confianza.",
  "Work with Mario to turn health goals into realistic, encouraging actions you can keep building on.": "Trabaja con Mario para convertir tus metas de salud en acciones realistas y alentadoras que puedas seguir construyendo.",
  "A personal approach": "Un enfoque personal",
  "Better health is a path, not a quick fix.": "Mejor salud es un camino, no una solucion rapida.",
  "Your Pure Path focuses on progress that feels steady and sustainable, with room for real life, real schedules, and real challenges.": "Your Pure Path se enfoca en un progreso constante y sostenible, con espacio para la vida real, horarios reales y desafios reales.",
  "A simple wellness snapshot when you want one.": "Una imagen sencilla de bienestar cuando la quieras.",
  "The Health Age questionnaire is available as a separate educational tool if you want a quick reflection on habits and possible next steps.": "El cuestionario de Edad de Salud esta disponible como una herramienta educativa separada si deseas una reflexion rapida sobre habitos y posibles proximos pasos.",
  "Open Health Age Tool": "Abrir herramienta de Edad de Salud",
  "Assessment": "Evaluación",
  "Whole-person wellness, made practical": "Bienestar integral, hecho práctico",
  "See how your daily habits may be shaping your Health Age.": "Descubre cómo tus hábitos diarios pueden estar influyendo en tu Edad de Salud.",
  "This guided Your Pure Path experience introduces a simple educational wellness tool built around movement, sleep, nutrition, stress, and health history.": "Esta experiencia guiada de Your Pure Path presenta una herramienta educativa de bienestar basada en movimiento, sueño, nutrición, estrés e historial de salud.",
  "Start Assessment": "Comenzar evaluación",
  "How It Works": "Cómo funciona",
  "What you will get": "Lo que recibirás",
  "Estimated BMI and Health Age": "IMC estimado y Edad de Salud",
  "Clear result category and explanation": "Categoría de resultado y explicación claras",
  "Top lifestyle improvement opportunities": "Principales oportunidades para mejorar hábitos",
  "A warm, mobile-friendly wellness experience": "Una experiencia de bienestar cálida y fácil de usar en móvil",
  "Your Pure Path approach": "El enfoque de Your Pure Path",
  "Warm guidance rooted in real-life wellness.": "Guía cálida basada en el bienestar de la vida real.",
  "Health Age is an educational estimate that helps you reflect on how daily choices may support or strain long-term wellness. It is not a diagnosis; it is a starting point for awareness and practical next steps.": "La Edad de Salud es una estimación educativa que te ayuda a reflexionar sobre cómo tus decisiones diarias pueden apoyar o afectar tu bienestar a largo plazo. No es un diagnóstico; es un punto de partida para crear conciencia y próximos pasos prácticos.",
  "Your Pure Path focuses on sustainable habits, simple nutrition education, and supportive wellness guidance that fits everyday life.": "Your Pure Path se enfoca en hábitos sostenibles, educación nutricional sencilla y guía de bienestar que se adapta a la vida diaria.",
  "How it works": "Cómo funciona",
  "A clear, encouraging look at your wellness patterns.": "Una mirada clara y alentadora a tus patrones de bienestar.",
  "The assessment uses a weighted wellness model to turn your answers into an Estimated Health Age, a BMI estimate, and practical areas to improve.": "La evaluación usa un modelo de bienestar ponderado para convertir tus respuestas en una Edad de Salud estimada, un IMC estimado y áreas prácticas para mejorar.",
  "Step 1": "Paso 1",
  "Answer the questionnaire": "Responde el cuestionario",
  "Share basics about movement, recovery, food quality, hydration, stress, social support, and health history.": "Comparte información básica sobre movimiento, recuperación, calidad de alimentación, hidratación, estrés, apoyo social e historial de salud.",
  "Step 2": "Paso 2",
  "Review your Health Age": "Revisa tu Edad de Salud",
  "See your actual age, Estimated Health Age, difference, result category, and a plain-language summary.": "Mira tu edad real, Edad de Salud estimada, diferencia, categoría de resultado y un resumen claro.",
  "Step 3": "Paso 3",
  "Choose practical next steps": "Elige próximos pasos prácticos",
  "Use your top improvement opportunities as a gentle guide for building better daily habits.": "Usa tus principales oportunidades de mejora como una guía sencilla para crear mejores hábitos diarios.",
  "Meaningful wellness metrics": "Métricas de bienestar significativas",
  "Built around habits that matter day to day.": "Basado en hábitos que importan día a día.",
  "The model weighs sleep, movement, nourishment, stress, and health history to create a simple wellness snapshot that is easy to understand.": "El modelo pondera sueño, movimiento, nutrición, estrés e historial de salud para crear una imagen sencilla y fácil de entender.",
  "A next-step mindset": "Una mentalidad de próximos pasos",
  "Designed to encourage progress, not perfection.": "Diseñado para fomentar progreso, no perfección.",
  "Small improvements in movement, strength, sleep, hydration, and food quality can build momentum toward a healthier path.": "Pequeñas mejoras en movimiento, fuerza, sueño, hidratación y calidad de alimentación pueden crear impulso hacia un camino más saludable.",
  "Educational wellness tool": "Herramienta educativa de bienestar",
  "Ready to see your estimate?": "¿Listo para ver tu estimación?",
  "This Health Age experience is for educational wellness purposes only. It is not medical advice, diagnosis, or treatment.": "Esta experiencia de Edad de Salud es solo para fines educativos de bienestar. No es consejo médico, diagnóstico ni tratamiento.",
  "Begin Health Age Assessment": "Comenzar evaluación de Edad de Salud",
  "Connect with Your Pure Path": "Conecta con Your Pure Path",
  "Ready for more personalized support?": "¿Listo para apoyo más personalizado?",
  "Mario offers functional nutrition counseling and wellness support to help you improve energy, habits, and long-term health with practical next steps.": "Mario ofrece consejería en nutrición funcional y apoyo de bienestar para ayudarte a mejorar energía, hábitos y salud a largo plazo con próximos pasos prácticos.",
  "Business:": "Negocio:",
  "Phone:": "Teléfono:",
  "Address:": "Dirección:",
  "73 Edmond Rd Suite 2, Kearneysville, WV, United States, West Virginia": "73 Edmond Rd Suite 2, Kearneysville, WV, Estados Unidos, Virginia Occidental",
  "Email:": "Correo electrónico:",
  "Website:": "Sitio web:",
  "Facebook:": "Facebook:",
  "Email Us": "Envíanos un correo",
  "Call Us": "Llámanos",
  "Your Pure Path. All rights reserved.": "Your Pure Path. Todos los derechos reservados.",
  "Health Age Assessment": "Evaluación de Edad de Salud",
  "Complete your Health Age questionnaire.": "Completa tu cuestionario de Edad de Salud.",
  "Answer each section as honestly as you can. You will receive an educational Estimated Health Age, BMI estimate, result category, and practical next-step ideas.": "Responde cada sección con la mayor honestidad posible. Recibirás una Edad de Salud estimada educativa, un IMC estimado, una categoría de resultado e ideas prácticas para próximos pasos.",
  "Begin Questionnaire": "Comenzar cuestionario",
  "Back to Overview": "Volver al resumen",
  "Back to Home": "Volver al inicio",
  "Before you begin": "Antes de comenzar",
  "Plan for a few quiet minutes": "Reserva unos minutos tranquilos",
  "Use your best estimate when needed": "Usa tu mejor estimación cuando sea necesario",
  "Review your result as an educational guide": "Revisa tu resultado como una guía educativa",
  "Contact Mario for personalized support": "Contacta a Mario para apoyo personalizado",
  "Complete the questionnaire for your Estimated Health Age.": "Completa el cuestionario para tu Edad de Salud estimada.",
  "Answer each section as honestly as you can. This weighted wellness model estimates how your current habits and health markers may compare with your chronological age in a clear, encouraging way.": "Responde cada sección con la mayor honestidad posible. Este modelo ponderado de bienestar estima cómo tus hábitos actuales y marcadores de salud pueden compararse con tu edad cronológica de una forma clara y alentadora.",
  "Foundational Details": "Datos básicos",
  "These basics help estimate BMI and create a stronger starting point for your Health Age result.": "Estos datos ayudan a estimar el IMC y crean un punto de partida más sólido para tu resultado de Edad de Salud.",
  "Age": "Edad",
  "Sex": "Sexo",
  "Female": "Femenino",
  "Male": "Masculino",
  "Height (inches)": "Estatura (pulgadas)",
  "Weight (lbs)": "Peso (libras)",
  "Movement and Recovery": "Movimiento y recuperación",
  "These habits play a major role in resilience, recovery, mobility, and long-term vitality.": "Estos hábitos tienen un papel importante en resiliencia, recuperación, movilidad y vitalidad a largo plazo.",
  "Exercise habits": "Hábitos de ejercicio",
  "Rarely or never": "Rara vez o nunca",
  "1 to 2 days weekly": "1 a 2 días por semana",
  "3 to 4 days weekly": "3 a 4 días por semana",
  "5 or more days weekly": "5 o más días por semana",
  "Strength training": "Entrenamiento de fuerza",
  "None": "Nada",
  "About 1 day weekly": "Aproximadamente 1 día por semana",
  "2 to 3 days weekly": "2 a 3 días por semana",
  "4 or more days weekly": "4 o más días por semana",
  "Sedentary time each day": "Tiempo sedentario cada día",
  "10+ hours": "10+ horas",
  "7 to 9 hours": "7 a 9 horas",
  "4 to 6 hours": "4 a 6 horas",
  "0 to 3 hours": "0 a 3 horas",
  "Sleep duration": "Duración del sueño",
  "Less than 5 hours": "Menos de 5 horas",
  "5 to 6 hours": "5 a 6 horas",
  "9 or more hours": "9 o más horas",
  "Sleep quality": "Calidad del sueño",
  "Poor": "Mala",
  "Fair": "Regular",
  "Good": "Buena",
  "Excellent": "Excelente",
  "Nutrition and Hydration": "Nutrición e hidratación",
  "Food quality and hydration influence energy, recovery, and many core systems at the same time.": "La calidad de la alimentación y la hidratación influyen en la energía, la recuperación y muchos sistemas importantes al mismo tiempo.",
  "Diet quality": "Calidad de la alimentación",
  "Mostly ultra-processed": "Mayormente ultraprocesada",
  "Mixed quality": "Calidad mixta",
  "Mostly balanced": "Mayormente equilibrada",
  "Very nutrient-dense": "Muy rica en nutrientes",
  "Sugary drinks": "Bebidas azucaradas",
  "2 or more daily": "2 o más al día",
  "About 1 daily": "Aproximadamente 1 al día",
  "A few weekly": "Algunas por semana",
  "Vegetable intake": "Consumo de verduras",
  "0 to 1 servings daily": "0 a 1 porción al día",
  "2 to 3 servings daily": "2 a 3 porciones al día",
  "4 to 5 servings daily": "4 a 5 porciones al día",
  "6 or more servings daily": "6 o más porciones al día",
  "Water intake": "Consumo de agua",
  "Under 4 cups": "Menos de 4 tazas",
  "4 to 6 cups": "4 a 6 tazas",
  "7 to 9 cups": "7 a 9 tazas",
  "10+ cups": "10+ tazas",
  "Alcohol use": "Consumo de alcohol",
  "Heavy / frequent": "Alto / frecuente",
  "Moderate": "Moderado",
  "Light": "Ligero",
  "Lifestyle Resilience and Health History": "Resiliencia de estilo de vida e historial de salud",
  "Stress, support, energy, and health history help give your Health Age estimate fuller context.": "El estrés, el apoyo, la energía y el historial de salud ayudan a dar más contexto a tu estimación de Edad de Salud.",
  "Nicotine use": "Uso de nicotina",
  "Current user": "Uso actual",
  "Former user": "Uso anterior",
  "Never": "Nunca",
  "Stress level": "Nivel de estrés",
  "High": "Alto",
  "Manageable": "Manejable",
  "Low": "Bajo",
  "Social support": "Apoyo social",
  "Limited": "Limitado",
  "Some support": "Algo de apoyo",
  "Strong support": "Apoyo fuerte",
  "Very strong support": "Apoyo muy fuerte",
  "Blood pressure history": "Historial de presión arterial",
  "Diagnosed / elevated often": "Diagnosticada / elevada con frecuencia",
  "Borderline or unsure": "Límite o no estoy seguro",
  "Usually normal": "Normal generalmente",
  "Blood sugar history": "Historial de azúcar en sangre",
  "Diabetes / prediabetes": "Diabetes / prediabetes",
  "Cholesterol history": "Historial de colesterol",
  "High / treated": "Alto / tratado",
  "Daily energy": "Energía diaria",
  "Low most days": "Baja la mayoría de los días",
  "Up and down": "Variable",
  "Consistently strong": "Constante y fuerte",
  "Functional fitness": "Condición funcional",
  "Often limited": "A menudo limitada",
  "Adequate for daily life": "Adecuada para la vida diaria",
  "Good mobility and stamina": "Buena movilidad y resistencia",
  "Excellent strength and mobility": "Excelente fuerza y movilidad",
  "This assessment is for educational wellness purposes and does not replace medical advice.": "Esta evaluación es para fines educativos de bienestar y no reemplaza el consejo médico.",
  "Calculate My Health Age": "Calcular mi Edad de Salud",
  "Reset": "Restablecer",
  "Your result": "Tu resultado",
  "Estimated Health Age": "Edad de Salud estimada",
  "years": "años",
  "Actual Age": "Edad real",
  "Difference": "Diferencia",
  "Estimated BMI": "IMC estimado",
  "Result category": "Categoría de resultado",
  "Complete the form": "Completa el formulario",
  "Summary": "Resumen",
  "Fill out the questionnaire to see a clear educational estimate, a practical summary, and the habits most likely to support a healthier direction.": "Completa el cuestionario para ver una estimación educativa clara, un resumen práctico y los hábitos con más probabilidad de apoyar una dirección más saludable.",
  "Top improvement opportunities": "Principales oportunidades de mejora",
  "Balanced movement, nourishing meals, and consistent recovery habits can meaningfully shift your Health Age over time.": "El movimiento equilibrado, las comidas nutritivas y los hábitos constantes de recuperación pueden cambiar de forma significativa tu Edad de Salud con el tiempo.",
  "Important disclaimer": "Aviso importante",
  "This Health Age assessment is an educational wellness tool only. It is not medical advice, diagnosis, or treatment, and it should not replace care from a qualified healthcare professional.": "Esta evaluación de Edad de Salud es solo una herramienta educativa de bienestar. No es consejo médico, diagnóstico ni tratamiento, y no debe reemplazar la atención de un profesional de salud calificado.",
  "Contact Mario About Next Steps": "Contactar a Mario sobre próximos pasos",
  "Contact Mario for Your Personal Consultation": "Contactar a Mario para tu consulta personal",
  "Personal guidance": "Guia personal",
  "Contact Mario for your personal consultation.": "Contacta a Mario para tu consulta personal.",
  "Your result can be a helpful starting point. Mario can help you turn it into practical nutrition and lifestyle steps that fit your life.": "Tu resultado puede ser un punto de partida util. Mario puede ayudarte a convertirlo en pasos practicos de nutricion y estilo de vida que se adapten a tu vida.",
  "Schedule a Consultation": "Programar una consulta",
  "After you review your result, Mario offers functional nutrition counseling and wellness support to help you improve energy, habits, and long-term health with practical next steps.": "Después de revisar tu resultado, Mario ofrece consejería en nutrición funcional y apoyo de bienestar para ayudarte a mejorar energía, hábitos y salud a largo plazo con próximos pasos prácticos."
};

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

const improvementMessagesEs = {
  bmi: "Si el manejo del peso es una de tus metas, enfocarte de forma constante en proteína, fibra, caminar y entrenamiento de fuerza puede mejorar la composición corporal con el tiempo.",
  nicotine: "Reducir o eliminar el uso de nicotina sería uno de los pasos más importantes para mejorar tu Edad de Salud a largo plazo.",
  exercise: "Un próximo paso realista es avanzar hacia cardio regular o caminatas rápidas para apoyar la salud del corazón, la energía y la resiliencia metabólica.",
  strength: "Agregar incluso dos sesiones cortas de fuerza por semana puede apoyar músculo, movilidad y una Edad de Salud funcional más joven.",
  sedentary: "Intenta interrumpir el tiempo sentado con caminatas breves, estiramientos o pausas de pie cada hora para apoyar la circulación y la energía.",
  sleepDuration: "Una ventana de sueño más constante, con la mayoría de las noches cerca de 7 a 8 horas, podría mejorar de forma significativa tu recuperación.",
  sleepQuality: "Mejorar la calidad del sueño con una rutina nocturna más tranquila, menos pantallas y una habitación más oscura puede ayudar a que tu Edad de Salud avance en una mejor dirección.",
  dietQuality: "Cambiar más comidas hacia alimentos enteros y mínimamente procesados probablemente tendría un efecto positivo amplio en tu puntaje de bienestar.",
  sugaryDrinks: "Reemplazar bebidas azucaradas con agua, té o agua con gas es una forma práctica de apoyar energía más estable y salud metabólica.",
  vegetables: "Un paso sencillo es agregar verduras con más constancia en el almuerzo y la cena para mejorar la fibra y los nutrientes.",
  water: "Una hidratación más constante podría apoyar energía, digestión y recuperación durante el día.",
  alcohol: "Reducir el alcohol puede ayudar a mejorar la calidad del sueño, la recuperación y la resiliencia al estrés.",
  stress: "Hábitos diarios de regulación del estrés, como caminar, orar, escribir, respirar con calma o tomar tiempo de recuperación, pueden ayudar mucho aquí.",
  socialSupport: "Invertir en relaciones de apoyo, comunidad o conexión regular puede fortalecer la resiliencia de maneras importantes para el bienestar a largo plazo.",
  bloodPressure: "Si la presión arterial ha estado elevada, priorizar movimiento, calidad de alimentación, sueño y seguimiento médico sería especialmente valioso.",
  bloodSugar: "Si el azúcar en sangre ha sido una preocupación, un buen próximo paso sería combinar comidas equilibradas con movimiento regular y seguimiento profesional.",
  cholesterol: "Mejorar la calidad de alimentación, actividad y seguimiento médico puede apoyar patrones de colesterol más saludables con el tiempo.",
  energy: "La energía baja a menudo mejora cuando el sueño, la nutrición, la carga de estrés y el ritmo de movimiento se vuelven más consistentes.",
  functionalFitness: "Trabajo de movilidad, caminatas y entrenamiento de fuerza pueden ayudar a mejorar cómo se siente tu cuerpo en la vida diaria."
};

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function translateText(text) {
  if (currentLanguage === "en") return text;
  return spanishText[text] || text;
}

function collectTextNodes() {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  textNodes = [];

  while (walker.nextNode()) {
    const node = walker.currentNode;
    const key = normalizeText(node.textContent);
    const parentTag = node.parentElement ? node.parentElement.tagName : "";

    if (!key || parentTag === "SCRIPT" || parentTag === "STYLE") continue;

    textNodes.push({
      node,
      key,
      leading: node.textContent.match(/^\s*/)[0],
      trailing: node.textContent.match(/\s*$/)[0]
    });
  }
}

function updateLanguageButton() {
  if (!languageToggle) return;
  languageToggle.textContent = currentLanguage === "en" ? "Español" : "English";
  languageToggle.setAttribute(
    "aria-label",
    currentLanguage === "en" ? "Switch language to Spanish" : "Cambiar idioma a inglés"
  );
}

function applyLanguage() {
  document.documentElement.lang = currentLanguage;
  document.title = translateText(initialPageTitle);

  textNodes.forEach((item) => {
    item.node.textContent = `${item.leading}${translateText(item.key)}${item.trailing}`;
  });
  updateLanguageButton();
  setNavOffset();

  if (lastResult && form) {
    calculateHealthAge();
  } else if (form) {
    resetResults();
  }
}

function getImprovementMessage(key) {
  return currentLanguage === "es" ? improvementMessagesEs[key] : improvementMessages[key];
}

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
  if (currentLanguage === "es") {
    if (bmi < 18.5) return "Rango bajo de peso";
    if (bmi < 25) return "Rango saludable";
    if (bmi < 30) return "Rango de sobrepeso";
    return "Rango de obesidad";
  }

  if (bmi < 18.5) return "Underweight range";
  if (bmi < 25) return "Healthy range";
  if (bmi < 30) return "Overweight range";
  return "Obesity range";
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildDifferenceLabel(diff) {
  if (diff === 0) return currentLanguage === "es" ? "0 años" : "0 years";
  return `${diff > 0 ? "+" : "-"}${Math.abs(diff)} ${translateText("years")}`;
}

function getCategory(diff) {
  if (currentLanguage === "es") {
    if (diff <= -6) {
      return {
        title: "Base próspera",
        tone: "Tus hábitos actuales apoyan una Edad de Salud que parece notablemente menor que tu edad cronológica."
      };
    }

    if (diff <= 1) {
      return {
        title: "Estable y apoyada",
        tone: "Tu Edad de Salud estimada está cerca de tu edad cronológica, lo que sugiere una base de bienestar bastante equilibrada."
      };
    }

    if (diff <= 6) {
      return {
        title: "Oportunidad de crecimiento",
        tone: "Algunos hábitos o factores de historial de salud pueden estar elevando tu Edad de Salud estimada en este momento."
      };
    }

    return {
      title: "Necesita más atención",
      tone: "Varios marcadores de bienestar parecen estar agregando carga a tu trayectoria de salud actual."
    };
  }

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

  if (currentLanguage === "es") {
    const spanishDirection = diff > 0 ? `${diff} años mayor` : `${Math.abs(diff)} años menor`;
    const spanishPhrase = diff === 0 ? "aproximadamente igual que tu edad cronológica" : `${spanishDirection} que tu edad cronológica`;

    return `${category.tone} Según este modelo ponderado de bienestar, tu Edad de Salud estimada es ${spanishPhrase}. Tu puntaje de bienestar es ${score}/100, y tu IMC estimado es ${bmi.toFixed(1)} (${bmiLabel}).`;
  }

  return `${category.tone} Based on this weighted wellness model, your estimated Health Age is ${neutralPhrase}. Your wellness score is ${score}/100, and your estimated BMI is ${bmi.toFixed(1)} (${bmiLabel}).`;
}

function getTopImprovements(factorScores) {
  return factorScores
    .filter((entry) => entry.key !== "bmi" || entry.score < 0.95)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map((entry) => getImprovementMessage(entry.key));
}

function renderResults(result) {
  healthAgeValue.textContent = result.healthAge.toString();
  actualAgeValue.textContent = result.actualAge.toString();
  estimatedHealthAgeValue.textContent = `${result.healthAge} ${translateText("years")}`;
  differenceValue.textContent = buildDifferenceLabel(result.healthAge - result.actualAge);
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

  lastResult = {
    actualAge: age,
    bmi,
    bmiLabel,
    score,
    healthAge,
    category,
    summary,
    improvements
  };

  renderResults(lastResult);
}

function resetResults() {
  if (!healthAgeValue) return;

  healthAgeValue.textContent = "--";
  actualAgeValue.textContent = "--";
  estimatedHealthAgeValue.textContent = "--";
  differenceValue.textContent = "--";
  bmiValue.textContent = "--";
  categoryValue.textContent = translateText("Complete the form");
  summaryText.textContent = translateText("Fill out the questionnaire to see a clear educational estimate, a practical summary, and the habits most likely to support a healthier direction.");
  improvementsList.innerHTML = `<li>${translateText("Balanced movement, nourishing meals, and consistent recovery habits can meaningfully shift your Health Age over time.")}</li>`;
  scoreRing.style.background = `
    radial-gradient(circle at center, #fffaf5 0 59%, transparent 60%),
    conic-gradient(#7a8f66 0deg, #c59b6c 180deg, rgba(197, 155, 108, 0.16) 180deg, rgba(197, 155, 108, 0.16) 360deg)
  `;
}

if (currentYear) {
  currentYear.textContent = new Date().getFullYear().toString();
}

collectTextNodes();
applyLanguage();

if (languageToggle) {
  languageToggle.addEventListener("click", () => {
    currentLanguage = currentLanguage === "en" ? "es" : "en";
    localStorage.setItem("yourPurePathLanguage", currentLanguage);
    applyLanguage();
  });
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

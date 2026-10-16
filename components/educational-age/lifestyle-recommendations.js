// Practical suggestions matched to known answers. These are educational steps,
// not diagnoses, treatment instructions, or promises of health-age years gained.
// Keep the full list for both the visible report and its PDF/export model.
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const inList = (value, choices) => choices.includes(value);
const tip = (key, kind, enTitle, esTitle, en, es) => ({ key, kind, title: { en: enTitle, es: esTitle }, en, es });

export function discussionIdeas(input = {}) {
  const answers = input && typeof input === 'object' ? input : {};
  const lifestyle = [];
  const maintenance = [];
  const care = [];
  // An explicit current response, including unknown or declined, takes
  // precedence over any stale answer from a retired version of the question.
  const choose = (current, legacy) => own(answers, current) ? answers[current] : answers[legacy];
  const history = (current, legacy) => own(answers, current) ? answers[current]?.history : answers[legacy];

  const produce = choose('fruitVegetableServings', 'vegetables');
  const hasProduce = own(answers, 'fruitVegetableServings') || own(answers, 'vegetables');
  const lowProduce = own(answers, 'fruitVegetableServings')
    ? inList(produce, ['0-2', '3-4']) : inList(produce, ['0-1', '2-3']);
  if (lowProduce || (!hasProduce && inList(answers.dietQuality, ['poor', 'fair']))) {
    lifestyle.push(tip('food', 'lifestyle', 'Add one fruit or vegetable', 'Añade una fruta o verdura',
      'At your next meal, try ½ cup of a fruit or vegetable you enjoy, such as carrots, berries, or broccoli. Fresh, frozen, or canned choices can work. Choose foods that fit your allergies and care plan.',
      'En tu próxima comida, prueba ½ taza de una fruta o verdura que disfrutes, como zanahorias, frutos rojos o brócoli. Pueden ser frescos, congelados o en conserva. Elige alimentos adecuados para tus alergias y tu plan de atención.'));
  }

  const exercise = choose('exercise', 'exerciseTwentyThirty');
  const limitedMovement = answers.functionalFitness === 'limited';
  if (inList(exercise, ['rarely', '1-2']) || limitedMovement) {
    lifestyle.push(tip('movement', 'lifestyle', 'Try a comfortable movement break', 'Prueba una pausa de movimiento cómoda',
      'Start with 5–10 minutes of comfortable walking or adapted seated movement, if it fits your abilities and care plan. A shorter session is fine. Add time gradually when it feels manageable; you do not need to do everything at once.',
      'Empieza con 5–10 minutos de caminata cómoda o movimiento adaptado en una silla, si se ajusta a tus capacidades y tu plan de atención. También puede ser una sesión más breve. Aumenta el tiempo poco a poco cuando te resulte manejable; no necesitas hacerlo todo de una vez.'));
  }

  if (inList(answers.wholeGrainServings, ['none', '1-2'])) {
    lifestyle.push(tip('wholeGrains', 'lifestyle', 'Make one whole-grain swap', 'Haz un cambio a un cereal integral',
      'Try one swap you enjoy: a slice of whole-grain bread instead of refined bread, or ½ cup of cooked brown rice or oatmeal with a meal. Check ingredients for any foods you need to avoid, including gluten if relevant to your care plan.',
      'Prueba un cambio que te guste: una rebanada de pan integral en lugar de pan refinado, o ½ taza de arroz integral o avena cocidos con una comida. Revisa los ingredientes para evitar lo que no puedas comer, incluido el gluten si corresponde a tu plan.'));
  }

  const shortSleep = inList(answers.sleepDuration, ['lt5', '5-6', '5-lt7']);
  const oldShortSleep = !own(answers, 'sleepDuration') && inList(answers.sleepSevenEightFrequency, ['0-2', '3-4']);
  const poorSleep = inList(answers.sleepQuality, ['poor', 'fair']) || shortSleep || oldShortSleep;
  if (poorSleep) {
    lifestyle.push(tip('sleep', 'lifestyle', 'Choose one steady sleep cue', 'Elige una señal constante para dormir',
      'Try a regular wake-up time and a quiet wind-down routine, such as reading or turning screens off before sleep. Make your sleep space comfortable, dark, and quiet when possible. If sleep problems persist, talk with a health professional.',
      'Prueba una hora habitual para despertarte y una rutina tranquila antes de dormir, como leer o apagar las pantallas. Procura que el lugar para dormir sea cómodo, oscuro y silencioso cuando sea posible. Si los problemas persisten, consulta con un profesional de salud.'));
  }

  if (inList(answers.sugaryDrinks, ['2+', '1', 'few'])) {
    lifestyle.push(tip('sugaryDrinks', 'lifestyle', 'Swap one sweetened drink', 'Cambia una bebida azucarada',
      'For one usual sugary drink, try water, plain sparkling water, or unsweetened tea instead. Start with a swap you like. Follow any fluid limits or drink restrictions from your care team.',
      'En lugar de una bebida azucarada habitual, prueba agua, agua con gas simple o té sin azúcar. Empieza con un cambio que te guste. Respeta cualquier límite de líquidos o restricción de bebidas indicado por tu equipo de salud.'));
  }

  if (answers.nutSeedServings === '0-2') {
    lifestyle.push(tip('nutsSeeds', 'lifestyle', 'Consider a small nut or seed portion', 'Considera una porción pequeña de frutos secos o semillas',
      'Only if nuts or seeds are safe for your allergies and care plan, try a small handful, about 1 ounce (28 g), or 2 tablespoons of nut butter with a meal. If you avoid them for an allergy or medical reason, keep avoiding them and ask about foods that suit you.',
      'Solo si tus alergias y tu plan de atención permiten frutos secos o semillas, prueba un puñado pequeño, aproximadamente 1 onza (28 g), o 2 cucharadas de crema de frutos secos con una comida. Si los evitas por alergia o indicación médica, sigue evitándolos y pregunta por alimentos adecuados para ti.'));
  }
  // avoidsForCare never receives a tip to eat nuts/seeds or a substitute penalty.

  if (answers.redMeatFrequency === '3plusWeekly') {
    lifestyle.push(tip('foodVariety', 'lifestyle', 'Try a different protein at one meal', 'Prueba otra proteína en una comida',
      'For one meal that usually includes red meat, consider beans, lentils, or tofu that you enjoy and can safely eat. For example, try lentils in a soup or beans in a taco. Choose a portion and ingredients that fit your needs and care plan.',
      'En una comida que normalmente incluye carne roja, considera frijoles, lentejas o tofu que disfrutes y puedas comer con seguridad. Por ejemplo, prueba lentejas en una sopa o frijoles en un taco. Elige una porción e ingredientes adecuados para tus necesidades y tu plan.'));
  }

  if (inList(answers.breakfastFrequency, ['lt2', '2-4'])) {
    lifestyle.push(tip('breakfast', 'lifestyle', 'Try an easy breakfast if it fits your routine', 'Prueba un desayuno sencillo si encaja en tu rutina',
      'If breakfast fits your routine and meal plan, try a simple option one morning: oatmeal with fruit, or whole-grain toast with a food you enjoy. You can prepare part of it the evening before. There is no need to force a meal or change a medically advised eating schedule.',
      'Si desayunar encaja en tu rutina y tu plan de alimentación, prueba una opción sencilla una mañana: avena con fruta o pan integral con un alimento que te guste. Puedes preparar una parte la noche anterior. No necesitas forzarte a comer ni cambiar un horario indicado por motivos médicos.'));
  }

  if (inList(answers.snackingFrequency, ['severalDaily', 'daily'])) {
    lifestyle.push(tip('snacks', 'lifestyle', 'Plan a snack that suits you', 'Planea algo entre comidas que se ajuste a ti',
      'If you want a snack, plan an option you enjoy, such as fruit, plain yogurt, or whole-grain crackers, using foods safe for you. Notice hunger and what keeps you satisfied. Keep any snacks required by your care plan; frequent snacking alone does not mean you should stop.',
      'Si quieres comer entre comidas, planea una opción que disfrutes, como fruta, yogur natural o galletas integrales, con alimentos seguros para ti. Observa el hambre y qué te deja satisfecho. Mantén lo indicado en tu plan de atención; comer con frecuencia por sí solo no significa que debas dejar de hacerlo.'));
  }

  if (inList(answers.strength, ['none', '1'])) {
    lifestyle.push(tip('strength', 'lifestyle', 'Explore gentle resistance activity', 'Explora una actividad de resistencia suave',
      'Consider one short session with a resistance band, light weights, or an adapted body-weight exercise you can do safely. A trainer or health professional can help adapt the movement and technique to your abilities. Build gradually and follow your care plan.',
      'Considera una sesión breve con una banda de resistencia, pesas ligeras o un ejercicio adaptado con el peso del cuerpo que puedas hacer con seguridad. Un entrenador o profesional de salud puede ayudarte a adaptar el movimiento y la técnica a tus capacidades. Avanza poco a poco y sigue tu plan.'));
  }

  if (inList(answers.sedentary, ['10+', '7-9'])) {
    lifestyle.push(tip('sittingBreaks', 'lifestyle', 'Break up a long seated period', 'Interrumpe un período largo sentado',
      'During one long seated period, try a comfortable change of position, a stretch, or a brief movement break when safe. Seated movement is an option. Choose a reminder that works for your routine and your abilities.',
      'Durante un período largo sentado, prueba un cambio de postura cómodo, un estiramiento o una breve pausa de movimiento cuando sea seguro. Puedes moverte en la silla. Elige un recordatorio que funcione con tu rutina y tus capacidades.'));
  }

  if (answers.water === 'lt4') {
    lifestyle.push(tip('water', 'lifestyle', 'Make water easy to reach', 'Ten agua a mano',
      'If your care plan allows it, keep water within reach and try a glass with a meal. Use your own fluid needs and thirst as a guide. If you have a fluid restriction, follow it; more water is not always better.',
      'Si tu plan lo permite, ten agua a mano y prueba un vaso con una comida. Guíate por tus propias necesidades de líquidos y tu sed. Si tienes una restricción de líquidos, respétala; beber más no siempre es mejor.'));
  }

  if (inList(answers.stress, ['high', 'moderate'])) {
    lifestyle.push(tip('support', 'lifestyle', 'Try one brief calming routine', 'Prueba una rutina breve para relajarte',
      'Choose a small pause you can repeat, such as a few comfortable breaths, quiet music, or a short break from a stressful task. Notice what helps you feel more settled. This step does not depend on religious belief.',
      'Elige una pausa pequeña que puedas repetir, como respirar cómodamente unas veces, escuchar música tranquila o descansar de una tarea estresante. Observa qué te ayuda a sentirte más tranquilo. Este paso no depende de creencias religiosas.'));
  }
  if (inList(answers.socialSupport, ['low', 'some'])) {
    lifestyle.push(tip('socialConnection', 'lifestyle', 'Contact someone you trust', 'Contacta con alguien de confianza',
      'Consider one message, phone call, or short visit with someone you trust. You could ask for a listening ear or help with one practical task. Choose support that feels comfortable, whether from friends, family, neighbors, or a group.',
      'Considera enviar un mensaje, llamar o hacer una visita breve a alguien de confianza. Puedes pedir que te escuche o que te ayude con una tarea concreta. Elige un apoyo con el que te sientas cómodo, de amistades, familiares, vecinos o un grupo.'));
  }

  const alcohol = choose('alcoholServings', 'alcohol');
  if (inList(alcohol, ['1-7', '8-14', '15+', 'highReference', 'heavy', 'moderate', 'light'])) {
    lifestyle.push(tip('alcohol', 'lifestyle', 'Choose a supported alcohol goal', 'Elige una meta con apoyo sobre el alcohol',
      'If it fits your care plan, consider replacing one alcoholic drink with a nonalcoholic option you enjoy. Count standard drinks rather than glasses. If you drink heavily every day, have withdrawal symptoms, or may be dependent, ask a health professional before abruptly stopping or sharply reducing alcohol.',
      'Si se ajusta a tu plan, considera cambiar una bebida alcohólica por una opción sin alcohol que disfrutes. Cuenta bebidas estándar, no vasos. Si bebes mucho a diario, tienes síntomas de abstinencia o podrías tener dependencia, consulta con un profesional antes de dejar el alcohol de golpe o reducirlo bruscamente.'));
  }

  // Positive known habits receive maintenance ideas, never invented deficits.
  const goodProduce = own(answers, 'fruitVegetableServings')
    ? produce === '5+' : inList(produce, ['4-5', '6+']);
  if (goodProduce || (!hasProduce && inList(answers.dietQuality, ['good', 'excellent']))) {
    maintenance.push(tip('maintenance', 'maintenance', 'Keep the food variety you enjoy', 'Mantén la variedad de alimentos que disfrutas',
      'Keep including fruits and vegetables that work for you. For variety, try a different color or a fresh, frozen, or canned option at a meal, while following your allergies and care plan.',
      'Sigue incluyendo frutas y verduras que te sienten bien. Para variar, prueba otro color o una opción fresca, congelada o en conserva en una comida, respetando tus alergias y tu plan.'));
  }
  if (inList(exercise, ['3-4', '5+']) && !limitedMovement) {
    maintenance.push(tip('maintainMovement', 'maintenance', 'Keep an activity you enjoy', 'Mantén una actividad que disfrutas',
      'Keep the movement routine you enjoy, with rest and adaptations that suit your abilities. A walk, dance, or adapted activity can be part of your routine; you do not need to chase a higher quiz score.',
      'Mantén la rutina de movimiento que disfrutas, con descanso y adaptaciones adecuadas para tus capacidades. Una caminata, baile o actividad adaptada puede formar parte de tu rutina; no necesitas perseguir una puntuación mayor.'));
  }
  if (!poorSleep && inList(answers.sleepQuality, ['good', 'excellent'])) {
    maintenance.push(tip('maintainSleep', 'maintenance', 'Keep a helpful sleep routine', 'Mantén una rutina de sueño que te ayude',
      'Keep the bedtime or wake-up cue that helps you feel rested, and leave room for the amount of sleep that suits you. Notice changes in sleep and discuss persistent concerns with your care team.',
      'Mantén la señal para acostarte o despertarte que te ayuda a descansar y reserva el tiempo de sueño adecuado para ti. Observa los cambios y consulta con tu equipo si persisten las preocupaciones.'));
  }
  if (answers.wholeGrainServings === '3+') {
    maintenance.push(tip('maintainWholeGrains', 'maintenance', 'Keep whole-grain options you like', 'Mantén las opciones integrales que te gustan',
      'Continue choosing whole-grain foods you enjoy and can safely eat, such as brown rice or whole-grain bread. Vary your choices within your meal plan.',
      'Sigue eligiendo alimentos integrales que disfrutes y puedas comer con seguridad, como arroz integral o pan integral. Varía las opciones dentro de tu plan de alimentación.'));
  }
  if (inList(answers.nutSeedServings, ['3-4', '5+'])) {
    maintenance.push(tip('maintainNutsSeeds', 'maintenance', 'Keep portions that suit you', 'Mantén las porciones adecuadas para ti',
      'If nuts and seeds remain safe for your allergies and care plan, keep portions that work for you. More is not required for this suggestion.',
      'Si los frutos secos y las semillas siguen siendo seguros para tus alergias y tu plan, mantén las porciones que te resulten adecuadas. Esta sugerencia no requiere comer más.'));
  }

  const tobacco = choose('tobaccoHistory', 'nicotine');
  if (tobacco === 'current') {
    care.push(tip('nicotine', 'care', 'Take one step toward quit support', 'Da un paso para obtener apoyo para dejar el tabaco',
      'If you want to quit tobacco, choose one small next step: write down a reason to quit or contact a quit coach or health professional for a plan. In the US, 1-800-QUIT-NOW (1-800-784-8669) offers support. Do not change nicotine medicines used to quit without guidance.',
      'Si quieres dejar el tabaco, elige un paso pequeño: anota un motivo para dejarlo o contacta con un asesor o profesional para hacer un plan. En EE. UU., 1-855-DÉJELO-YA (1-855-335-3569) ofrece apoyo en español. No cambies medicamentos con nicotina para dejar de fumar sin orientación.'));
  }
  if (inList(history('bloodPressureReading', 'bloodPressure'), ['diagnosed', 'borderline']) ||
      inList(history('bloodGlucoseReading', 'bloodSugar'), ['diagnosed', 'borderline']) ||
      inList(answers.cholesterol, ['high', 'borderline'])) {
    care.push(tip('history', 'care', 'Prepare one question for your care team', 'Prepara una pregunta para tu equipo de salud',
      'Write down one question about the health history you shared and bring it to your usual care team. Keep following your existing care plan. These lifestyle ideas do not interpret readings or replace treatment.',
      'Anota una pregunta sobre el historial que compartiste y llévala a tu equipo de salud habitual. Sigue tu plan de atención. Estas ideas de hábitos no interpretan lecturas ni sustituyen tratamientos.'));
  }
  if (inList(answers.energy, ['low', 'mixed']) || limitedMovement) {
    care.push(tip('dailyLife', 'care', 'Discuss a change that matters to you', 'Habla sobre un cambio que te importe',
      'If low energy or changes in daily activities concern you, note when they happen and discuss them with your care team. Ask about practical adaptations that fit your abilities rather than pushing through discomfort.',
      'Si te preocupan la falta de energía o cambios en las actividades diarias, anota cuándo ocurren y coméntalos con tu equipo de salud. Pregunta por adaptaciones adecuadas a tus capacidades en lugar de forzarte a continuar con molestias.'));
  }

  const ideas = [...lifestyle, ...maintenance, ...care];
  if (!ideas.length) ideas.push(tip('general', 'maintenance', 'Choose a step that matters to you', 'Elige un paso que te importe',
    'Choose one everyday habit or question you would like to explore. Unknown or declined answers are not treated as problems. These educational ideas do not promise a change in health-age years.',
    'Elige un hábito diario o una pregunta que te gustaría explorar. Las respuestas desconocidas o que prefieres no dar no se consideran problemas. Estas ideas educativas no prometen cambiar años de edad de salud.'));
  return ideas;
}

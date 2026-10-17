// Plain-language definitions for the active questionnaire. These definitions
// clarify what a response means; they do not supply clinical scoring weights.
const pair = (en, es) => ({ en, es });
const options = entries => entries.map(([id, en, es]) => ({ id, label: pair(en, es) }));
const source = (title, url) => Object.freeze({ title, url });
const sources = {
  produce: source('USDA: fruit and vegetable cup equivalents', 'https://www.ers.usda.gov/data-products/fruit-and-vegetable-prices/documentation'),
  foodGroups: source('American Heart Association: food-group portions', 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/suggested-servings-from-each-food-group'),
  nuts: source('American Heart Association: nut portions', 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/go-nuts-but-just-a-little'),
  meat: source('American Heart Association: protein foods and meat portions', 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/nutrition-basics/picking-healthy-proteins'),
  drinks: source('CDC: US standard alcohol drinks', 'https://www.cdc.gov/alcohol/standard-drink-sizes/index.html'),
  activity: source('CDC: moderate and vigorous activity', 'https://www.cdc.gov/physical-activity-basics/measuring/index.html'),
  strength: source('CDC: activities that count for adults', 'https://www.cdc.gov/physical-activity-basics/adding-adults/what-counts.html'),
  sleep: source('CDC: sleep duration and quality', 'https://www.cdc.gov/sleep/about/index.html'),
  glucose: source('NIDDK: glucose tests, fasting and A1C', 'https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis'),
  pressure: source('American Heart Association: blood pressure numbers', 'https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings'),
  waist: source('NHLBI: measuring waist circumference', 'https://www.nhlbi.nih.gov/health/heart-healthy-living/healthy-weight'),
  cholesterol: source('CDC: cholesterol testing', 'https://www.cdc.gov/cholesterol/testing/index.html'),
  quitMedicines: source('FDA: nicotine medicines for quitting smoking', 'https://www.fda.gov/consumers/consumer-updates/want-quit-smoking-fda-approved-and-fda-cleared-cessation-products-can-help'),
  sugar: source('CDC: drinks with added sugar', 'https://www.cdc.gov/healthy-weight-growth/be-sugar-smart/index.html'),
  water: source('CDC: water and individual needs', 'https://www.cdc.gov/healthy-weight-growth/water-healthy-drinks/index.html'),
  labels: source('FDA: food-label serving sizes', 'https://www.fda.gov/food/nutrition-facts-label/serving-size-nutrition-facts-label')
};

export const questionGuidance = {
  age: {
    prompt: pair('What is your actual age, in years?', '¿Cuál es tu edad real, en años?'),
    help: pair('Enter the age you reached on your last birthday, as a whole number. This questionnaire is for adults ages 18–100; that input range does not establish scientific validity.', 'Escribe los años que cumpliste en tu último cumpleaños, sin decimales. Este cuestionario es para adultos de 18 a 100 años; ese intervalo de entrada no demuestra validez científica.')
  },
  sex: {
    prompt: pair('What is your sex?', '¿Cuál es tu sexo?'),
    help: pair('This personal detail does not change the estimate. Choose Prefer not to answer if you do not want to share it.', 'Este dato personal no cambia la estimación. Elige Prefiero no responder si no quieres compartirlo.')
  },
  height: {
    prompt: pair('How tall are you?', '¿Cuál es tu estatura?'),
    help: pair('Choose feet/inches or centimeters, then enter your height without shoes. For 5 feet 6 inches, use 5 in feet and 6 in inches; 5.6 does not mean 5 feet 6 inches. Original input range: 48–84 inches (4–7 feet; 121.92–213.36 cm). Decimals are allowed in inches or centimeters. Changing units clears the entry.', 'Elige pies y pulgadas o centímetros y escribe tu estatura sin zapatos. Para 5 pies y 6 pulgadas, usa 5 en pies y 6 en pulgadas; 5,6 no significa 5 pies y 6 pulgadas. Intervalo de entrada original: 48–84 pulgadas (4–7 pies; 121,92–213,36 cm). Se permiten decimales en pulgadas o centímetros. Cambiar de unidad borra el dato.')
  },
  weight: {
    prompt: pair('How much do you weigh?', '¿Cuánto pesas?'),
    help: pair('Choose pounds (lb) or kilograms (kg) and copy a recent weight you know. For example, 150 lb is about 68 kg. Original input range: 80–500 lb (about 36–227 kg); decimals are allowed. Use your scale’s unit. Changing units clears the entry.', 'Elige libras (lb) o kilogramos (kg) y copia un peso reciente que conozcas. Por ejemplo, 150 lb son unos 68 kg. Intervalo de entrada original: 80–500 lb (unos 36–227 kg); se permiten decimales. Usa la unidad de tu báscula. Cambiarla borra el dato.')
  },
  waistMeasurement: {
    prompt: pair('What is your waist measurement?', '¿Cuánto mide tu cintura?'),
    help: pair('Use a tape around your middle just above your hip bones, level and snug without pressing into the skin. Read it after a normal breath out. Choose inches or centimeters; use the tape measurement rather than your pants size. Choose not measured if you do not know it.', 'Usa una cinta alrededor del abdomen, justo por encima de los huesos de la cadera, nivelada y ajustada sin apretar la piel. Lee la medida después de soltar el aire normalmente. Elige pulgadas o centímetros; usa la cinta, no la talla del pantalón. Elige no se ha medido si no la conoces.')
  },
  bloodPressureReading: {
    prompt: pair('What do you know about your blood pressure?', '¿Qué sabes sobre tu presión arterial?'),
    help: pair('Copy an existing reading exactly, in mmHg. In a reading such as 120/80, 120 is systolic (top number) and 80 is diastolic (bottom number); neither is your pulse. For history, use what a clinician told you. Choose not known / not measured if needed; this page does not diagnose the reading.', 'Copia una lectura que ya tengas tal como aparece, en mmHg. En una lectura como 120/80, 120 es la sistólica (número superior) y 80 la diastólica (inferior); ninguno es el pulso. Para el historial, usa lo que te dijo un profesional de salud. Puedes elegir no sé / no se ha medido; esta página no diagnostica la lectura.')
  },
  bloodGlucoseReading: {
    prompt: pair('What do you know about your blood glucose (blood sugar)?', '¿Qué sabes sobre tu glucosa (azúcar) en sangre?'),
    help: pair('Copy an existing result and its mg/dL or mmol/L unit. Fasting means the result followed at least 8 hours without food or drink except water. This explains an existing result; do not fast or change medicine for this quiz. After a meal is a different timing, and A1C (%) is a different test. Choose not known / not measured if needed.', 'Copia un resultado que ya tengas y su unidad, mg/dL o mmol/L. En ayunas significa que se obtuvo tras al menos 8 horas sin comer ni beber, salvo agua. Esto explica un resultado existente; no ayunes ni cambies medicamentos para este cuestionario. Después de comer es otro momento de medición y la A1C (%) es otra prueba. Puedes elegir no sé / no se ha medido.')
  },
  cholesterol: {
    prompt: pair('What have you been told about your cholesterol?', '¿Qué te han dicho sobre tu colesterol?'),
    help: pair('Cholesterol is measured in a blood test. Choose the description a clinician gave you, including treatment for high cholesterol. Do not guess from how you feel or interpret a lab number here; choose I do not know when unsure.', 'El colesterol se mide con un análisis de sangre. Elige la descripción que te dio un profesional, incluido si recibes tratamiento para colesterol alto. No lo deduzcas por cómo te sientes ni interpretes aquí una cifra de laboratorio; elige No sé si tienes dudas.'),
    options: options([['high', 'Told it was high, or treated for high cholesterol', 'Me dijeron que era alto o recibo tratamiento para colesterol alto'], ['borderline', 'Told it was borderline', 'Me dijeron que estaba en el límite'], ['normal', 'Told it was usually normal', 'Me dijeron que normalmente era normal']])
  },
  tobaccoHistory: {
    prompt: pair('What is your history with tobacco?', '¿Cuál es tu historial de consumo de tabaco?'),
    help: pair('Include tobacco you smoke or use without smoking. Count time since you stopped using tobacco. Nicotine medicines used to help you quit are not tobacco for this question. If a product or your history does not fit, choose Other / not sure.', 'Incluye el tabaco fumado y el que se usa sin fumar. Cuenta el tiempo desde que dejaste el tabaco. Los medicamentos con nicotina para dejarlo no cuentan como tabaco en esta pregunta. Si un producto o tu situación no encajan, elige Otra situación / no sé.')
  },
  exercise: {
    prompt: pair('How many days a week do you get 20–30 minutes or more of moderate to vigorous activity?', '¿Cuántos días por semana haces de 20 a 30 minutos o más de actividad moderada a intensa?'),
    help: pair('Think of a typical week. Count days with at least 20 minutes in total; longer sessions count too. Brisk walking is one example. Moderate effort lets you talk but not sing; vigorous effort lets you say only a few words before a breath. Shorter activity also has value. Choose activity that fits your abilities.', 'Piensa en una semana habitual. Cuenta los días con al menos 20 minutos en total; también cuentan las sesiones más largas. Caminar a paso ligero es un ejemplo. Con esfuerzo moderado puedes hablar, pero no cantar; con esfuerzo intenso solo dices unas palabras antes de respirar. La actividad más breve también tiene valor. Adapta la actividad a tus capacidades.')
  },
  strength: {
    prompt: pair('How many days a week do you do muscle-strengthening activities?', '¿Cuántos días por semana haces actividades para fortalecer los músculos?'),
    help: pair('Examples include lifting weights, using resistance bands, or using your body weight for resistance, such as wall push-ups. Count days you do these activities, rather than the number of exercises. Choose activities suited to your abilities and care plan.', 'Por ejemplo, levantar pesas, usar bandas de resistencia o trabajar con el peso del cuerpo, como hacer flexiones contra una pared. Cuenta los días que haces estas actividades, no el número de ejercicios. Elige actividades adecuadas para tus capacidades y tu plan de atención.')
  },
  sedentary: {
    prompt: pair('About how many hours a day do you sit or recline while awake?', '¿Cuántas horas al día pasas sentado o recostado mientras estás despierto?'),
    help: pair('Add up a usual day: time at a desk, watching TV, riding in a car, or resting in a chair. Do not include sleep. This describes your routine; it is not a judgment about disability or activities you cannot do.', 'Suma un día habitual: tiempo en un escritorio, viendo televisión, viajando en automóvil o descansando en una silla. No incluyas el sueño. Describe tu rutina; no juzga una discapacidad ni actividades que no puedas hacer.'),
    options: options([['0-3', 'Fewer than 4 hours', 'Menos de 4 horas'], ['4-6', '4 to fewer than 7 hours', 'De 4 a menos de 7 horas'], ['7-9', '7 to fewer than 10 hours', 'De 7 a menos de 10 horas'], ['10+', '10 or more hours', '10 horas o más']])
  },
  functionalFitness: {
    prompt: pair('How easy or difficult are everyday physical activities for you?', '¿Qué tan fáciles o difíciles te resultan las actividades físicas cotidianas?'),
    help: pair('Think of moving around your home, getting dressed, carrying groceries, or similar activities in your own routine. Include the aids or support you normally use. Choose your own description; this is not a fitness test.', 'Piensa en moverte por casa, vestirte, cargar compras u otras actividades de tu rutina. Incluye las ayudas o el apoyo que normalmente usas. Elige tu propia descripción; esto no es una prueba de condición física.'),
    options: options([['limited', 'Often difficult or limited', 'A menudo difíciles o limitadas'], ['average', 'Usually manageable for daily life', 'Normalmente puedo realizarlas en la vida diaria'], ['good', 'Usually easy, with good stamina', 'Normalmente fáciles, con buena resistencia'], ['excellent', 'Very easy, with strong mobility and stamina', 'Muy fáciles, con mucha movilidad y resistencia']])
  },
  sleepDuration: {
    prompt: pair('About how many hours do you usually sleep in 24 hours?', '¿Cuántas horas duermes normalmente en 24 horas?'),
    help: pair('Count time actually asleep during your main sleep period plus naps, whether you sleep at night or during the day. For example, 6 hours plus a 1-hour nap totals 7 hours. Sleep needs vary; this answer does not diagnose a sleep problem.', 'Cuenta el tiempo que realmente duermes en tu período principal y en las siestas, ya sea de noche o de día. Por ejemplo, 6 horas y una siesta de 1 hora suman 7 horas. Las necesidades de sueño varían; esta respuesta no diagnostica un problema de sueño.')
  },
  sleepQuality: {
    prompt: pair('How would you describe the quality of your usual sleep?', '¿Cómo describirías la calidad de tu sueño habitual?'),
    help: pair('Think about whether you fall asleep easily, wake repeatedly, and feel refreshed after sleep. Choose your overall experience, separately from the number of hours you sleep.', 'Piensa en si te duermes con facilidad, te despiertas repetidamente y te sientes descansado después de dormir. Elige cómo es tu experiencia general, por separado de las horas que duermes.')
  },
  energy: {
    prompt: pair('How is your energy on most days?', '¿Cómo es tu energía la mayoría de los días?'),
    help: pair('Think about your usual energy for your daily routine, rather than one unusually busy or tiring day. Energy can have many causes; this answer does not explain or diagnose tiredness.', 'Piensa en tu energía habitual para tu rutina, no en un día excepcionalmente ocupado o agotador. La energía puede depender de muchos factores; esta respuesta no explica ni diagnostica el cansancio.')
  },
  breakfastFrequency: {
    prompt: pair('How often does your breakfast include whole grains, fruit or vegetables, or nuts?', '¿Con qué frecuencia tu desayuno incluye cereales integrales, frutas o verduras, o frutos secos?'),
    help: pair('Think of a typical week. Examples include oatmeal, whole-grain toast, fruit, vegetables, or nuts when safe for you. Count a day if breakfast includes at least one of these; it does not need all of them. Follow any meal timing or allergy advice in your care plan.', 'Piensa en una semana habitual. Por ejemplo: avena, pan integral, fruta, verduras o frutos secos si puedes comerlos. Cuenta un día si el desayuno incluye al menos uno; no hacen falta todos. Sigue las indicaciones de tu plan sobre horarios de comidas o alergias.')
  },
  snackingFrequency: {
    prompt: pair('How often do you eat between your main meals?', '¿Con qué frecuencia comes entre tus comidas principales?'),
    help: pair('Count occasions when you eat something between meals, such as fruit, nuts, crackers, or sweets. This asks when you eat, not whether a snack is good or bad. Keep snacks you need for your health or care plan.', 'Cuenta las ocasiones en que comes algo entre comidas, como fruta, frutos secos, galletas o dulces. Se pregunta cuándo comes, no si lo que comes es bueno o malo. Mantén las comidas entre horas que necesites por tu salud o tu plan de atención.')
  },
  fruitVegetableServings: {
    prompt: pair('How many portions of fruit and vegetables do you eat in a usual day?', '¿Cuántas porciones de frutas y verduras comes en un día habitual?'),
    help: pair('For this question, 1 portion is ½ measuring cup of cut-up fruit or vegetables, 1 cup of raw leafy greens, or ¼ cup of dried fruit. Half a cup of 100% juice also counts as 1 portion. Add fruit and vegetables together. For example, 5 portions equal 2½ cup-equivalents, not 5 measured cups. A whole fruit varies in size; estimate its cut-up amount.', 'En esta pregunta, 1 porción es ½ taza medidora de fruta o verdura cortada, 1 taza de hojas verdes crudas o ¼ de taza de fruta seca. Media taza de jugo 100% también cuenta como 1 porción. Suma frutas y verduras. Por ejemplo, 5 porciones equivalen a 2½ tazas equivalentes, no a 5 tazas medidas. El tamaño de una fruta entera varía; estima cuánto ocuparía cortada.'),
    options: options([['0-2', 'Fewer than 3 portions', 'Menos de 3 porciones'], ['3-4', '3 to fewer than 5 portions', 'De 3 a menos de 5 porciones'], ['5+', '5 or more portions', '5 porciones o más']])
  },
  wholeGrainServings: {
    prompt: pair('How many portions of whole grains do you eat in a usual day?', '¿Cuántas porciones de cereales integrales comes en un día habitual?'),
    help: pair('Count 1 slice of whole-grain bread or ½ measuring cup of cooked brown rice, whole-grain pasta, or oatmeal as 1 portion. Two slices of bread count as 2 portions. For whole-grain cereal flakes, about 1 cup is an example; dense or puffed cereals differ. Look for a whole grain as the first grain ingredient. Food-label serving sizes can differ.', 'Cuenta 1 rebanada de pan integral o ½ taza medidora de arroz integral, pasta integral o avena cocidos como 1 porción. Dos rebanadas cuentan como 2 porciones. En cereales integrales en hojuelas, aproximadamente 1 taza es un ejemplo; los cereales densos o inflados varían. Busca un cereal integral como primer ingrediente de cereal. La porción indicada en el envase puede ser distinta.'),
    options: options([['none', 'None', 'Ninguna'], ['1-2', 'Some, but fewer than 3 portions', 'Algo, pero menos de 3 porciones'], ['3+', '3 or more portions', '3 porciones o más']])
  },
  nutSeedServings: {
    prompt: pair('How many portions of nuts, seeds, or nut butter do you eat in a usual week?', '¿Cuántas porciones de frutos secos, semillas o crema de frutos secos comes en una semana habitual?'),
    help: pair('Count 1 ounce (about 28 g, a small handful) of shelled nuts or seeds, or 2 level tablespoons of nut butter, as 1 portion. This is a food portion, not an ounce of protein. If you avoid these foods for an allergy or medical reason, choose that option; it has no age penalty.', 'Cuenta 1 onza (unos 28 g, un puñado pequeño) de frutos secos o semillas sin cáscara, o 2 cucharadas rasas de crema de frutos secos, como 1 porción. Es una porción de alimento, no una onza de proteína. Si los evitas por alergia o indicación médica, elige esa opción; no añade años a tu edad.'),
    options: options([['0-2', 'Fewer than 3 portions', 'Menos de 3 porciones'], ['3-4', '3 to fewer than 5 portions', 'De 3 a menos de 5 porciones'], ['5+', '5 or more portions', '5 porciones o más'], ['avoidsForCare', 'I avoid these foods because of an allergy or medical advice', 'Evito estos alimentos por alergia o indicación médica']]),
    supplemental: true, score: 'none'
  },
  redMeatFrequency: {
    prompt: pair('How often do you eat red meat?', '¿Con qué frecuencia comes carne roja?'),
    help: pair('Red meat includes beef, pork, and lamb. Count eating occasions, not portions: eating it at lunch and dinner counts twice. A common portion example is 3 ounces (about 85 g) cooked, roughly the size of a deck of cards, but this question asks how often you eat it. Choose your usual pattern.', 'La carne roja incluye res, cerdo y cordero. Cuenta las ocasiones, no las porciones: comerla en el almuerzo y en la cena cuenta dos veces. Un ejemplo habitual de porción es 3 onzas (unos 85 g) cocidas, del tamaño aproximado de una baraja, pero aquí se pregunta la frecuencia. Elige tu patrón habitual.'),
    options: options([['never', 'Never', 'Nunca'], ['lessWeekly', 'Sometimes, but less than once per week', 'A veces, pero menos de una vez por semana'], ['1-2Weekly', '1 to fewer than 3 times per week', 'De 1 a menos de 3 veces por semana'], ['3plusWeekly', '3 or more times per week', '3 veces por semana o más']])
  },
  sugaryDrinks: {
    prompt: pair('How often do you drink beverages with added sugar?', '¿Con qué frecuencia tomas bebidas con azúcar añadida?'),
    help: pair('Examples are regular soda, sweetened tea or coffee, fruit drinks, sports drinks, and energy drinks. Count the times you drink them, not the number of sips. A drink made only from 100% juice is separate from a fruit drink with added sugar. This question records frequency, not grams of sugar.', 'Por ejemplo: refrescos azucarados, té o café endulzado, bebidas de fruta, bebidas deportivas y energéticas. Cuenta las ocasiones en que las tomas, no los sorbos. Un jugo 100% es distinto de una bebida de fruta con azúcar añadida. Aquí se registra la frecuencia, no los gramos de azúcar.')
  },
  water: {
    prompt: pair('About how many cups of plain water do you drink in a usual day?', '¿Cuántas tazas de agua simple tomas en un día habitual?'),
    help: pair('Use an 8-fluid-ounce US measuring cup (about 240 mL), not the size of your mug. A 16-fluid-ounce bottle is 2 cups. Count plain still or sparkling water; leave other drinks out of this answer. Your fluid needs can vary, and any fluid limit from your care team comes first.', 'Usa una taza medidora estadounidense de 8 onzas líquidas (unos 240 mL), no el tamaño de tu taza para beber. Una botella de 16 onzas líquidas son 2 tazas. Cuenta el agua simple, con o sin gas; no incluyas otras bebidas. Tus necesidades pueden variar y debes respetar cualquier límite de líquidos indicado por tu equipo de salud.'),
    options: options([['lt4', 'Fewer than 4 cups per day', 'Menos de 4 tazas al día'], ['4-6', '4 to fewer than 7 cups per day', 'De 4 a menos de 7 tazas al día'], ['7-9', '7 to fewer than 10 cups per day', 'De 7 a menos de 10 tazas al día'], ['10+', '10 or more cups per day', '10 tazas al día o más']])
  },
  alcoholServings: {
    prompt: pair('How many US standard alcoholic drinks do you have in a usual week?', '¿Cuántas bebidas alcohólicas estándar de EE. UU. tomas en una semana habitual?'),
    help: pair('One standard drink is 12 fl oz beer at 5% alcohol, 5 fl oz wine at 12%, or 1½ fl oz spirits at 40%. Alcohol strength (ABV) is on the label. Large or stronger drinks may count as several: 12 fl oz beer at 10% counts as 2. Count standard drinks, not glasses or cans. These groups are counting choices, not safe drinking limits.', 'Una bebida estándar es 12 onzas líquidas de cerveza al 5% de alcohol, 5 de vino al 12% o 1½ de licor destilado al 40%. La graduación (ABV) aparece en la etiqueta. Una bebida grande o más fuerte puede contar como varias: 12 onzas de cerveza al 10% cuentan como 2. Cuenta bebidas estándar, no vasos o latas. Estos grupos son opciones de cantidad, no límites seguros de consumo.'),
    options: options([['none', 'None', 'Ninguna'], ['1-7', 'More than 0, up to 7 standard drinks', 'Más de 0 y hasta 7 bebidas estándar'], ['8-14', 'More than 7, up to 14 standard drinks', 'Más de 7 y hasta 14 bebidas estándar'], ['15+', 'More than 14 standard drinks', 'Más de 14 bebidas estándar']]),
    supplemental: true, score: 'none'
  },
  stress: {
    prompt: pair('How would you describe your usual stress level?', '¿Cómo describirías tu nivel habitual de estrés?'),
    help: pair('Think about how overwhelmed, tense, or under pressure you feel in everyday life. Choose your overall experience. This is separate from your faith, beliefs, or interest in spiritual support.', 'Piensa en cuánto te sientes abrumado, tenso o bajo presión en la vida diaria. Elige cómo es tu experiencia general. Esto es independiente de tu fe, tus creencias o tu interés en apoyo espiritual.')
  },
  socialSupport: {
    prompt: pair('How much support do you feel you have from other people?', '¿Cuánto apoyo sientes que recibes de otras personas?'),
    help: pair('Think about people you can turn to for listening, practical help, or companionship, such as friends, relatives, neighbors, or a support group. People can have support with or without religion; this asks about available support, not beliefs.', 'Piensa en personas a quienes puedes acudir para que te escuchen, te ayuden o te acompañen, como amistades, familiares, vecinos o un grupo de apoyo. Se puede tener apoyo con o sin religión; aquí se pregunta por el apoyo disponible, no por las creencias.')
  },
  spiritualityPreference: {
    prompt: pair('Would faith or spiritual support offer you meaning, comfort, or support?', '¿La fe o el apoyo espiritual te aportarían sentido, consuelo o apoyo?'),
    help: pair('Your Pure Path can offer Christian resources if you want them. Choose what feels useful to you, including no interest or no answer. Faith, belief, or closeness to Christ never adds or subtracts health-age years. This private preference stays on this page and is omitted from saved or shared reports.', 'Your Pure Path puede ofrecer recursos cristianos si los deseas. Elige lo que te resulte útil, incluido no tener interés o no responder. La fe, las creencias o la cercanía a Cristo nunca añaden ni restan años a la edad de salud. Esta preferencia privada se queda en esta página y se omite de los informes guardados o compartidos.'),
    options: options([['noInterest', 'I do not want faith or spiritual support', 'No deseo apoyo de fe o espiritual'], ['moderate', 'Some faith or spiritual support could help', 'Algo de apoyo de fe o espiritual podría ayudarme'], ['deep', 'Faith or spiritual support is important to me', 'El apoyo de fe o espiritual es importante para mí'], ['preferNot', 'Prefer not to answer', 'Prefiero no responder']]),
    privatePreference: true, supplemental: true, score: 'none'
  },
  interests: {
    prompt: pair('Which topics would you like to learn about?', '¿Sobre qué temas te gustaría aprender?'),
    help: pair('Select any topics, or choose None of these topics. These choices help identify education and support you may find useful. They do not diagnose a condition, promise treatment, change the age estimate, or sign you up for email.', 'Selecciona los temas que quieras o elige Ninguno de estos temas. Estas opciones ayudan a identificar educación y apoyo que podrían interesarte. No diagnostican problemas, prometen tratamientos, cambian la estimación de edad ni te suscriben a correos.')
  },

};

const references = {
  waistMeasurement: [sources.waist], bloodPressureReading: [sources.pressure],
  bloodGlucoseReading: [sources.glucose], cholesterol: [sources.cholesterol], tobaccoHistory: [sources.quitMedicines], exercise: [sources.activity, sources.strength],
  strength: [sources.strength], sleepDuration: [sources.sleep], sleepQuality: [sources.sleep],
  breakfastFrequency: [sources.foodGroups], fruitVegetableServings: [sources.produce],
  wholeGrainServings: [sources.foodGroups, sources.labels], nutSeedServings: [sources.nuts, sources.foodGroups],
  redMeatFrequency: [sources.meat], sugaryDrinks: [sources.sugar], water: [sources.water],
  alcoholServings: [sources.drinks]
};
export const sourcesById = Object.freeze(Object.fromEntries(
  Object.keys(questionGuidance).map(id => [id, Object.freeze(references[id] || [])])
));
export const sourcesByQuestionId = sourcesById;

// Mutates only display guidance on the supplied active question objects. The
// caller applies this after constructing the merged question list and overrides.
// Any counting convention or changed answer bin remains pending scoring review.
export function applyQuestionGuidance(questions) {
  for (const question of questions) {
    const guidance = questionGuidance[question.id];
    if (!guidance) continue;
    Object.assign(question, guidance);
    question.guidanceSources = sourcesById[question.id];
  }
  return questions;
}

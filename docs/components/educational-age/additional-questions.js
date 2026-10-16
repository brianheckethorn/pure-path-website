// Transcribed from all 29 reference screenshots in healthage.pptx.
// Supplemental context only: none of these answers changes the age arithmetic.
const pair = (en, es) => ({ en, es });
const options = entries => entries.map(([id, en, es]) => ({ id, label: pair(en, es) }));
const supplemental = question => ({ section: 4, supplemental: true, score: 'none', ...question });
const optionalContext = pair(
  'Optional. This answer adds context to your report and does not change the estimate.',
  'Opcional. Esta respuesta añade contexto a tu informe y no cambia la estimación.'
);
const unitOptions = options([['in', 'Inches', 'Pulgadas'], ['cm', 'Centimeters', 'Centímetros']]);

export const additionalQuestions = [
  supplemental({
    id: 'fullName', type: 'text',
    prompt: pair('What name would you like on your report?', '¿Qué nombre quieres que aparezca en tu informe?'),
    help: pair('Optional. A first name or nickname is enough. It stays in this page with your answers.', 'Opcional. Basta con tu nombre o un apodo. Se queda en esta página junto con tus respuestas.')
  }),
  supplemental({
    id: 'waistMeasurement', type: 'group',
    prompt: pair('What is your waist circumference?', '¿Cuál es la medida de tu cintura?'),
    help: pair('Optional. Enter a measurement you already know and choose its unit. We show the value without assigning a health category or age adjustment.', 'Opcional. Escribe una medida que ya conozcas y elige la unidad. Mostramos el dato sin asignarle una categoría de salud ni un ajuste de edad.'),
    fields: [
      { id: 'value', type: 'number', min: 0, step: 'any', label: pair('Waist measurement', 'Medida de cintura') },
      { id: 'unit', type: 'select', label: pair('Unit', 'Unidad'), options: unitOptions }
    ]
  }),
  supplemental({
    id: 'bloodPressureReading', type: 'group',
    prompt: pair('Do you have a blood pressure reading to include?', '¿Tienes una lectura de presión arterial que quieras incluir?'),
    help: pair('Optional. Enter a reading you already know, in mmHg. We do not diagnose or interpret it, and it does not change the estimate. Ask your care team about readings or symptoms that concern you.', 'Opcional. Escribe una lectura que ya conozcas, en mmHg. No la diagnosticamos ni interpretamos y no cambia la estimación. Consulta con tu equipo de salud si te preocupan una lectura o tus síntomas.'),
    fields: [
      { id: 'systolic', type: 'number', min: 0, step: 'any', label: pair('Systolic (top number), mmHg', 'Sistólica (número superior), mmHg') },
      { id: 'diastolic', type: 'number', min: 0, step: 'any', label: pair('Diastolic (bottom number), mmHg', 'Diastólica (número inferior), mmHg') }
    ]
  }),
  supplemental({
    id: 'bloodGlucoseReading', type: 'group',
    prompt: pair('Do you have a blood glucose reading to include?', '¿Tienes una lectura de glucosa en sangre que quieras incluir?'),
    help: pair('Optional. Enter a value you already know and select its unit and timing. A post-meal value without the testing conditions cannot be interpreted as a glucose-tolerance test. This report shows your entry without diagnosis or age adjustment.', 'Opcional. Escribe un valor que ya conozcas y selecciona la unidad y el momento de la medición. Un valor después de comer, sin conocer las condiciones de la prueba, no se puede interpretar como una prueba de tolerancia a la glucosa. Este informe muestra tu dato sin diagnóstico ni ajuste de edad.'),
    fields: [
      { id: 'value', type: 'number', min: 0, step: 'any', label: pair('Blood glucose value', 'Valor de glucosa en sangre') },
      { id: 'timing', type: 'select', label: pair('When was it measured?', '¿Cuándo se midió?'), options: options([['fasting', 'Fasting', 'En ayunas'], ['postMeal', 'After a meal', 'Después de comer'], ['unsure', 'Not sure', 'No sé']]) },
      { id: 'unit', type: 'select', label: pair('Unit', 'Unidad'), options: options([['mgDl', 'mg/dL', 'mg/dL'], ['mmolL', 'mmol/L', 'mmol/L']]) }
    ]
  }),
  supplemental({
    id: 'breakfastFrequency', type: 'radio',
    prompt: pair('How often do you eat breakfast with whole grains, fruit or vegetables, or nuts?', '¿Con qué frecuencia desayunas cereales integrales, frutas o verduras, o frutos secos?'),
    help: optionalContext,
    options: options([['lt2', 'Less than 2 days per week', 'Menos de 2 días por semana'], ['2-4', '2–4 days per week', '2–4 días por semana'], ['5-6', '5–6 days per week', '5–6 días por semana'], ['daily', 'Every day', 'Todos los días']])
  }),
  supplemental({
    id: 'snackingFrequency', type: 'radio',
    prompt: pair('How often do you snack?', '¿Con qué frecuencia comes entre comidas?'),
    help: pair('Optional and unscored. Frequency alone does not describe snack quality, your total intake, or any medical need for snacks.', 'Opcional y sin puntuación. La frecuencia por sí sola no describe la calidad de lo que comes, tu alimentación total ni una necesidad médica de comer entre comidas.'),
    options: options([['severalDaily', 'Several times a day', 'Varias veces al día'], ['daily', 'Once a day', 'Una vez al día'], ['fewWeekly', 'A few times per week', 'Algunas veces por semana'], ['rarelyNever', 'Rarely or never', 'Rara vez o nunca']])
  }),
  supplemental({
    id: 'fruitVegetableServings', type: 'radio',
    prompt: pair('How many servings of fruits and vegetables do you eat per day?', '¿Cuántas porciones de frutas y verduras comes al día?'),
    help: pair('Optional and unscored. The reference uses 1 medium piece, 1 cup fresh, 1/2 cup cooked, or 6 fl oz of 100% juice as examples of a serving. Use your best estimate.', 'Opcional y sin puntuación. La referencia usa como ejemplos de una porción 1 pieza mediana, 1 taza en fresco, 1/2 taza cocida o 6 onzas líquidas de jugo 100% de fruta. Usa tu mejor estimación.'),
    options: options([['0-2', '0–2 servings', '0–2 porciones'], ['3-4', '3–4 servings', '3–4 porciones'], ['5+', '5 or more servings', '5 porciones o más']])
  }),
  supplemental({
    id: 'wholeGrainServings', type: 'radio',
    prompt: pair('How many servings of whole grains do you eat per day?', '¿Cuántas porciones de cereales integrales comes al día?'),
    help: pair('Optional and unscored. Reference examples: 1 slice of bread, 1/2 cup of brown rice or oatmeal, or 2/3 cup of dry cereal. Choose whole-grain versions and use your best estimate.', 'Opcional y sin puntuación. Ejemplos de la referencia: 1 rebanada de pan, 1/2 taza de arroz integral o avena, o 2/3 de taza de cereal seco. Piensa en las versiones integrales y usa tu mejor estimación.'),
    options: options([['none', 'None', 'Ninguna'], ['1-2', '1–2 servings', '1–2 porciones'], ['3+', '3 or more servings', '3 porciones o más']])
  }),
  supplemental({
    id: 'nutSeedServings', type: 'radio',
    prompt: pair('How many servings of nuts and seeds do you eat per week?', '¿Cuántas porciones de frutos secos y semillas comes por semana?'),
    help: pair('Optional and unscored. Reference serving: 1 oz of nuts or seeds, or 2 tablespoons of nut butter. Food allergies and your care plan come first.', 'Opcional y sin puntuación. Porción de referencia: 1 onza de frutos secos o semillas, o 2 cucharadas de crema de frutos secos. Respeta tus alergias alimentarias y tu plan de atención.'),
    options: options([['0-2', '0–2 servings', '0–2 porciones'], ['3-4', '3–4 servings', '3–4 porciones'], ['5+', '5 or more servings', '5 porciones o más']])
  }),
  supplemental({
    id: 'redMeatFrequency', type: 'radio',
    prompt: pair('How often do you eat red meat?', '¿Con qué frecuencia comes carne roja?'),
    help: pair('Optional and unscored. The reference choices leave out some frequencies. Choose Other / not sure if none fits.', 'Opcional y sin puntuación. Las opciones de la referencia no incluyen todas las frecuencias. Elige Otra frecuencia / no sé si ninguna se ajusta.'),
    options: options([['3plusWeekly', '3 or more times per week', '3 veces por semana o más'], ['1-2Monthly', 'Once or twice per month', 'Una o dos veces al mes'], ['never', 'Never', 'Nunca'], ['other', 'Other / not sure', 'Otra frecuencia / no sé']])
  }),
  supplemental({
    id: 'exerciseTwentyThirty', type: 'radio',
    prompt: pair('How often do you get 20-30 minutes of moderate to vigorous exercise?', '¿Con qué frecuencia haces de 20 a 30 minutos de ejercicio moderado a intenso?'),
    help: pair('Optional context from the reference. This is separate from the core question about exercise days and does not add a second exercise score. Choose activity that fits your abilities and care plan.', 'Contexto opcional de la referencia. Es independiente de la pregunta básica sobre días de ejercicio y no añade una segunda puntuación. Elige actividades que se ajusten a tus capacidades y plan de atención.'),
    options: options([['rarely', 'Rarely', 'Rara vez'], ['1-2', '1-2 days per week', '1-2 días por semana'], ['3-4', '3-4 days per week', '3-4 días por semana'], ['5+', '5 or more days per week', '5 días por semana o más']])
  }),
  supplemental({
    id: 'weightDescription', type: 'radio',
    prompt: pair('How would you describe your weight?', '¿Cómo describirías tu peso?'),
    help: pair('Optional self-description from the reference, without defined thresholds. It does not assign a medical category or add a second weight score.', 'Descripción personal opcional de la referencia, sin límites definidos. No asigna una categoría médica ni añade una segunda puntuación por el peso.'),
    options: options([['severelyOverweight', 'Severely overweight', 'Mucho sobrepeso'], ['moderatelyOverweight', 'Moderately overweight', 'Sobrepeso moderado'], ['underweight', 'Underweight', 'Por debajo del peso habitual o recomendado'], ['healthyWeight', 'Healthy weight', 'Peso saludable'], ['unsure', 'Not sure / prefer not to describe', 'No sé / prefiero no describirlo']])
  }),
  supplemental({
    id: 'sleepSevenEightFrequency', type: 'radio',
    prompt: pair('How often do you get 7–8 hours of sleep?', '¿Con qué frecuencia duermes entre 7 y 8 horas?'),
    help: pair('Optional and unscored. This is the reference question; individual sleep needs and care advice may differ.', 'Opcional y sin puntuación. Esta es la pregunta de la referencia; las necesidades de sueño y las indicaciones médicas pueden variar.'),
    options: options([['0-2', '2 or fewer days per week', '2 días por semana o menos'], ['3-4', '3–4 days per week', '3–4 días por semana'], ['5-6', '5–6 days per week', '5–6 días por semana'], ['daily', 'Every day', 'Todos los días']])
  }),
  supplemental({
    id: 'tobaccoHistory', type: 'radio',
    prompt: pair('What is your history with tobacco?', '¿Cuál es tu historial de consumo de tabaco?'),
    help: pair('Optional and unscored. The reference does not distinguish tobacco products or amounts. If you quit exactly 2 years ago or no choice fits, choose Other / not sure.', 'Opcional y sin puntuación. La referencia no distingue productos de tabaco ni cantidades. Si dejaste el tabaco hace exactamente 2 años o ninguna opción se ajusta, elige Otra situación / no sé.'),
    options: options([['current', 'Currently use', 'Consumo actualmente'], ['quitUnder2', 'Quit less than 2 years ago', 'Lo dejé hace menos de 2 años'], ['quitOver2', 'Quit over 2 years ago', 'Lo dejé hace más de 2 años'], ['never', 'Never used', 'Nunca he consumido'], ['other', 'Other / not sure', 'Otra situación / no sé']])
  }),
  supplemental({
    id: 'alcoholServings', type: 'radio',
    prompt: pair('How many servings of alcohol do you consume per week?', '¿Cuántas porciones de alcohol consumes por semana?'),
    help: pair('Optional and unscored. Reference serving: 12 fl oz beer, 8 fl oz malt liquor, 5 fl oz wine, or 1.5 fl oz spirits. Its choices omit some amounts; choose Other / not sure when needed. These labels are not a safe drinking limit.', 'Opcional y sin puntuación. Porción de referencia: 12 onzas líquidas de cerveza, 8 de licor de malta, 5 de vino o 1,5 de licor destilado. Las opciones omiten algunas cantidades; elige Otra cantidad / no sé cuando corresponda. Estas etiquetas no indican un límite seguro de consumo.'),
    options: options([['highReference', '15+ (men) or 8+ (women), as listed in the reference', '15 o más (hombres) u 8 o más (mujeres), según la referencia'], ['1-7', '1–7 servings', '1–7 porciones'], ['none', 'None', 'Ninguna'], ['other', 'Other / not sure', 'Otra cantidad / no sé']])
  }),
  supplemental({
    id: 'spiritualityPreference', type: 'radio', privatePreference: true,
    prompt: pair('How would you describe your interest in spirituality?', '¿Cómo describirías tu interés en la espiritualidad?'),
    help: pair('Optional preference for support or resources, kept only in this page and omitted from saved or shared reports. Every answer, including no interest, changes the health-age estimate by zero years.', 'Preferencia opcional para recibir apoyo o recursos. Se queda solo en esta página y se omite de los informes guardados o compartidos. Todas las respuestas, incluida la falta de interés, cambian la estimación de edad de salud en cero años.'),
    options: options([['noInterest', 'No interest', 'Sin interés'], ['moderate', 'Moderately spiritual', 'Moderadamente espiritual'], ['deep', 'Deeply spiritual', 'Profundamente espiritual'], ['preferNot', 'Prefer not to answer', 'Prefiero no responder']])
  }),
  supplemental({
    id: 'interests', type: 'multi',
    prompt: pair('Which topics interest you?', '¿Qué temas te interesan?'),
    help: pair('Optional. Select any topics for your report. These are education and support interests, not treatment promises, diagnoses, or mailing-list signup. They do not change the estimate.', 'Opcional. Selecciona los temas que quieras para tu informe. Son intereses de educación y apoyo, no promesas de tratamiento, diagnósticos ni una suscripción a una lista de correo. No cambian la estimación.'),
    options: options([
      ['weightManagement', 'Weight management', 'Control del peso'],
      ['fitnessExercise', 'Fitness and exercise', 'Actividad física y ejercicio'],
      ['stopSmoking', 'Support to stop smoking', 'Apoyo para dejar de fumar'],
      ['healthyCooking', 'Healthy cooking', 'Cocina saludable'],
      ['stressReduction', 'Stress reduction', 'Reducción del estrés'],
      ['heartHealth', 'Heart health education', 'Educación sobre salud del corazón'],
      ['depressionSupport', 'Depression support', 'Apoyo para la depresión'],
      ['diabetesSupport', 'Diabetes education and support', 'Educación y apoyo para la diabetes'],
      ['naturalRemedies', 'Questions about natural remedies', 'Preguntas sobre remedios naturales'],
      ['spiritualHealth', 'Spiritual health', 'Salud espiritual'],
      ['mentalPerformance', 'Memory and concentration', 'Memoria y concentración'],
      ['other', 'Other', 'Otro']
    ])
  }),
  supplemental({
    id: 'reportContact', type: 'group', privatePreference: true,
    prompt: pair('Would you like to note contact details for this session?', '¿Quieres anotar datos de contacto para esta sesión?'),
    help: pair('Optional. Leave any field blank. These details stay only in this page and are omitted from saved or shared reports. Entering them does not send email, authorize delivery, contact you, or join a mailing list. Result-email consent is a separate choice.', 'Opcional. Puedes dejar cualquier campo vacío. Estos datos se quedan solo en esta página y se omiten de los informes guardados o compartidos. Escribirlos no envía correos, autoriza un envío, permite contactarte ni te añade a una lista. El consentimiento para recibir resultados por correo se elige por separado.'),
    fields: [
      { id: 'email', type: 'email', label: pair('Email', 'Correo electrónico') },
      { id: 'address', type: 'text', label: pair('Address', 'Dirección') },
      { id: 'phone', type: 'tel', label: pair('Phone', 'Teléfono') },
      { id: 'zip', type: 'text', label: pair('ZIP / postal code', 'Código postal') }
    ]
  })
];

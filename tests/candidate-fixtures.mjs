// Explicit synthetic test data only. These fixtures test the local candidate's
// documented arithmetic and UI; their expected numbers are not clinical claims.
export const candidateFixtures = [
  {
    id: 'imperial-favorable', language: 'en',
    expected: { score: 99, actualAge: 50, quizAge: 40, coverage: { knownWeight: 95, totalWeight: 98, percent: 97 }, range: { minAge: 40, maxAge: 41, minScore: 97, maxScore: 100 } },
    answers: {
      fullName: 'preferNot', age: '50', sex: 'female', height: '66', heightUnit: 'in', weight: '140', weightUnit: 'lb',
      waistMeasurement: 'unknown',
      bloodPressureReading: { readingStatus: 'measured', history: 'normal', systolic: '118', diastolic: '76' },
      bloodGlucoseReading: { readingStatus: 'measured', history: 'normal', value: '90', timing: 'fasting', unit: 'mgDl' },
      cholesterol: 'normal', tobaccoHistory: 'never', exercise: '5+', strength: '2-3', sedentary: '0-3',
      functionalFitness: 'excellent', sleepDuration: '7-9', sleepQuality: 'excellent', energy: 'high',
      breakfastFrequency: 'daily', snackingFrequency: 'rarelyNever', fruitVegetableServings: '5+', wholeGrainServings: '3+',
      nutSeedServings: '5+', redMeatFrequency: 'never', sugaryDrinks: 'none', water: 'unknown', alcoholServings: 'none',
      stress: 'low', socialSupport: 'excellent', spiritualityPreference: 'preferNot', interests: 'none', reportContact: 'preferNot'
    }
  },
  {
    id: 'metric-mixed', language: 'es',
    expected: { score: 51, actualAge: 58, quizAge: 64, coverage: { knownWeight: 95, totalWeight: 98, percent: 97 }, range: { minAge: 64, maxAge: 65, minScore: 49, maxScore: 52 } },
    answers: {
      fullName: 'preferNot', age: '58', sex: 'male', height: '175', heightUnit: 'cm', weight: '92', weightUnit: 'kg',
      waistMeasurement: 'unknown',
      bloodPressureReading: { readingStatus: 'notMeasured', history: 'borderline' },
      bloodGlucoseReading: { readingStatus: 'measured', history: 'normal', value: '5.4', timing: 'fasting', unit: 'mmolL' },
      cholesterol: 'borderline', tobaccoHistory: 'current', exercise: '1-2', strength: '1', sedentary: '7-9',
      functionalFitness: 'average', sleepDuration: '5-lt7', sleepQuality: 'fair', energy: 'mixed',
      breakfastFrequency: '2-4', snackingFrequency: 'fewWeekly', fruitVegetableServings: '3-4', wholeGrainServings: '1-2',
      nutSeedServings: '3-4', redMeatFrequency: '3plusWeekly', sugaryDrinks: '1', water: 'unknown', alcoholServings: '1-7',
      stress: 'moderate', socialSupport: 'some', spiritualityPreference: 'preferNot', interests: 'none', reportContact: 'preferNot'
    }
  }
];

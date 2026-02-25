
import { useMemo } from 'react';
import { School, Card } from '../types';

export const useDerivedSchools = (schools: School[], decisions: Card[]) => {
  return useMemo(() => {
     if(!schools || schools.length === 0) return [];
     return schools.map(s => {
      let newSpend = s.spendingPerPupil;
      let newMath = s.academicOutcome.math;
      let newEla = s.academicOutcome.ela;

      if (decisions.find(d => d.title.includes('Reading') && (d.selected === 'Fund' || d.selected === 'OneTime')) && s.povertyRate > 0.6) {
        newEla += 5;
        newSpend += 200;
      }
      if (decisions.find(d => d.title.includes('Class Size') && (d.selected === 'Fund' || d.selected === 'OneTime'))) {
        newMath += 2;
        newEla += 2;
        newSpend += 500;
      }
      if (decisions.find(d => d.title.includes('Tutoring') && (d.selected === 'Fund' || d.selected === 'OneTime'))) {
        newMath += 4;
      }
      if (decisions.find(d => d.title.includes('Arts') && d.selected === 'Fund')) {
             newEla -= 2;
      }

      return { ...s, spendingPerPupil: newSpend, academicOutcome: { math: newMath, ela: newEla } };
     });
  }, [decisions, schools]);
};

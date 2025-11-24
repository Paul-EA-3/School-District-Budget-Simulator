import { LucideIcon } from 'lucide-react';

export type SchoolType = 'High' | 'Elementary' | 'Middle';
export type Difficulty = 'Hard' | 'Medium' | 'Expert';
export type SelectionState = 'None' | 'Fund' | 'OneTime' | 'Reject';
export type RiskFactor = 'Low' | 'Medium' | 'High';

export interface Staffing {
  senior: number;
  junior: number;
}

export interface AcademicScores {
  math: number;
  ela: number;
}

export interface School {
  id: string;
  name: string;
  type: SchoolType;
  enrollment: number;
  spendingPerPupil: number;
  academicOutcome: AcademicScores;
  povertyRate: number;
  principal: string;
  staffing: Staffing;
}

export interface Revenue {
  local: number;
  state: number;
  federalOneTime: number;
}

export interface Expenditures {
  personnel: number;
  operations: number;
  fixed: number;
}

export interface GameState {
  year: number;
  enrollment: number;
  revenue: Revenue;
  expenditures: Expenditures;
  fundBalance: number;
  structuralGap: number;
  communityTrust: number;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  cost: number;
  studentsServed: number;
  isRecurring: boolean;
  riskFactor: RiskFactor;
  riskDescription: string;
  category: string;
  selected: SelectionState;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  difficulty: Difficulty;
  initialState: GameState;
  initialSchools: School[];
  initialCards: Card[];
}
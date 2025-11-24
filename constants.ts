
import { Building2, School, Trees } from 'lucide-react';
import { Scenario, Card } from './types';

// Extended Card Interface for the Pool
export interface PoolCard extends Omit<Card, 'selected'> {
  validScenarios: ('urban' | 'suburban' | 'rural' | 'all')[];
  unique?: boolean; // If true, cannot appear again if funded
}

export const EDUCATION_STATS = [
    "Public education accounts for roughly 3.5% of U.S. GDP.",
    "Personnel costs (salaries and benefits) typically make up 80-85% of a school district's budget.",
    "Federal funding usually accounts for only ~8-10% of K-12 school budgets; the rest is State and Local.",
    "The 'Fiscal Cliff' refers to the sudden drop in funding when ESSER (COVID relief) grants expire.",
    "Per-pupil spending in the U.S. ranges wildly, from under $8,000 to over $30,000 depending on the district.",
    "Inflation impacts school budgets heavily because schools are labor-intensive institutions.",
    "Declining enrollment often increases per-pupil costs because fixed costs (buildings, utilities) remain the same.",
    "Special Education costs have risen significantly faster than general education funding in the last decade.",
    "Deferred maintenance on U.S. school buildings is estimated to be over $270 billion.",
    "Teacher pension obligations are a growing liability for many state education budgets.",
    "Transportation costs (buses) are often fully reimbursed by states, but only based on miles driven, not time.",
    "Cyber insurance premiums for school districts have tripled since 2019 due to ransomware threats.",
    "Textbook adoption cycles typically happen every 5-7 years and cost millions in a single year.",
    "Utility costs (heating/cooling) are often the second largest operational line item after staff.",
    "Title I funds are federal dollars specifically allocated for schools with high percentages of low-income students."
];

export const CARD_POOL: PoolCard[] = [
    // Urban Cards
    { id: 'u_c1', title: 'Close Riverside Elem', description: 'Consolidate under-enrolled school (280 students).', cost: -1500000, studentsServed: 280, isRecurring: true, riskFactor: 'High', riskDescription: 'Community protests likely.', category: 'Operations', validScenarios: ['urban'], unique: true },
    { id: 'u_c2', title: 'Hire Reading Specialists', description: 'Add 5 FTE literacy coaches for Title I schools.', cost: 600000, studentsServed: 1500, isRecurring: true, riskFactor: 'Low', riskDescription: 'High academic ROI.', category: 'Personnel', validScenarios: ['urban', 'rural'] },
    { id: 'u_c3', title: 'Reduce Class Size (K-3)', description: 'Hire 12 FTE to lower ratio from 25:1 to 20:1.', cost: 1200000, studentsServed: 1200, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Popular but expensive.', category: 'Personnel', validScenarios: ['all'] },
    { id: 'u_c4', title: 'Upgrade HVAC Systems', description: 'One-time repair for aging ventilation.', cost: 800000, studentsServed: 2000, isRecurring: false, riskFactor: 'Low', riskDescription: 'Necessary maintenance.', category: 'Operations', validScenarios: ['all'] },
    { id: 'u_c5', title: 'Outsource Custodial', description: 'Contract out cleaning services.', cost: -800000, studentsServed: 5000, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Union pushback expected.', category: 'Operations', validScenarios: ['urban', 'suburban'] },
    { id: 'u_c6', title: 'High-Impact Tutoring', description: 'Contract external provider for after-school math.', cost: 400000, studentsServed: 600, isRecurring: false, riskFactor: 'Medium', riskDescription: 'Vendor reliability variance.', category: 'Program', validScenarios: ['all'] },
    { id: 'u_c7', title: 'Reduce Central Office', description: 'Cut 3 administrative positions.', cost: -450000, studentsServed: 5000, isRecurring: true, riskFactor: 'Low', riskDescription: 'Reduced support capacity.', category: 'Personnel', validScenarios: ['all'] },
    { id: 'u_c8', title: 'Sell Admin Building', description: 'Liquidate old district HQ asset.', cost: -2000000, studentsServed: 0, isRecurring: false, riskFactor: 'Low', riskDescription: 'One-time cash infusion.', category: 'Operations', validScenarios: ['urban'], unique: true },

    // Suburban Cards
    { id: 's_c1', title: 'Bond Levy Campaign', description: 'Run campaign to build new High School.', cost: 50000, studentsServed: 2200, isRecurring: false, riskFactor: 'High', riskDescription: 'Taxpayer fatigue risk.', category: 'Operations', validScenarios: ['suburban'], unique: true },
    { id: 's_c2', title: 'Install Portables', description: 'Add 10 temporary classrooms.', cost: 1000000, studentsServed: 300, isRecurring: false, riskFactor: 'Low', riskDescription: 'Ugly but necessary.', category: 'Operations', validScenarios: ['suburban'] },
    { id: 's_c3', title: 'Redistrict Boundaries', description: 'Move 500 students from Legacy to Creekside.', cost: 100000, studentsServed: 500, isRecurring: false, riskFactor: 'High', riskDescription: 'Parents hate boundary changes.', category: 'Operations', validScenarios: ['suburban'], unique: true },
    { id: 's_c4', title: 'Hire Junior Teachers', description: 'Add 10 FTE to reduce class sizes.', cost: 600000, studentsServed: 1000, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Adds to future salary ladder liability.', category: 'Personnel', validScenarios: ['suburban', 'urban'] },
    { id: 's_c5', title: 'Lease Commercial Space', description: 'Rent office park for 9th grade academy.', cost: 500000, studentsServed: 400, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Recurring lease cost.', category: 'Operations', validScenarios: ['suburban'] },
    { id: 's_c6', title: '1:1 Device Refresh', description: 'Replace aging Chromebooks.', cost: 1200000, studentsServed: 4000, isRecurring: false, riskFactor: 'Low', riskDescription: 'Standard refresh.', category: 'Program', validScenarios: ['all'] },
    { id: 's_c7', title: 'Increase Class Size Cap', description: 'Raise cap from 25 to 28.', cost: -1500000, studentsServed: 8000, isRecurring: true, riskFactor: 'High', riskDescription: 'Parental outrage guaranteed.', category: 'Personnel', validScenarios: ['suburban', 'urban'] },
    { id: 's_c8', title: 'Pay-to-Play Athletics', description: 'Charge $200 fee per sport.', cost: -300000, studentsServed: 1500, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Equity concerns.', category: 'Program', validScenarios: ['suburban', 'rural'] },

    // Rural Cards
    { id: 'r_c1', title: 'Switch to 4-Day Week', description: 'Close schools on Fridays to save transport/utility.', cost: -400000, studentsServed: 2500, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Parents need childcare; Staff love it.', category: 'Operations', validScenarios: ['rural', 'urban'], unique: true },
    { id: 'r_c2', title: 'Shared Superintendent', description: 'Share admin with neighboring district.', cost: -80000, studentsServed: 2500, isRecurring: true, riskFactor: 'Low', riskDescription: 'Less local control.', category: 'Personnel', validScenarios: ['rural'] },
    { id: 'r_c3', title: 'Online AP Courses', description: 'Replace in-person advanced classes with Zoom.', cost: -150000, studentsServed: 200, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Lower engagement risk.', category: 'Program', validScenarios: ['rural', 'urban'] },
    { id: 'r_c4', title: 'Consolidate Bus Routes', description: 'Increase ride times to reduce fleet.', cost: -200000, studentsServed: 1200, isRecurring: true, riskFactor: 'High', riskDescription: 'Kids on bus for 90+ mins.', category: 'Operations', validScenarios: ['rural'] },
    { id: 'r_c5', title: 'Tele-Therapy for SpEd', description: 'Use remote speech therapists.', cost: -50000, studentsServed: 150, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Quality of service concerns.', category: 'Program', validScenarios: ['rural', 'urban'] },
    { id: 'r_c6', title: 'Fix Roof Leak', description: 'Emergency repair at County High.', cost: 300000, studentsServed: 800, isRecurring: false, riskFactor: 'Low', riskDescription: 'Must do.', category: 'Operations', validScenarios: ['all'] },
    { id: 'r_c7', title: 'Ag-Tech CTE Program', description: 'Launch agricultural drone program.', cost: 250000, studentsServed: 150, isRecurring: true, riskFactor: 'Low', riskDescription: 'Boosts enrollment & retention.', category: 'Program', validScenarios: ['rural'] },
    { id: 'r_c8', title: 'New Turf Field', description: 'Replace grass field for community use.', cost: 800000, studentsServed: 800, isRecurring: false, riskFactor: 'High', riskDescription: 'Expensive vanity project?', category: 'Operations', validScenarios: ['all'], unique: true },

    // Generic Extras
    { id: 'g_c1', title: 'Cut Arts & Music', description: 'Reduce elective teachers.', cost: -300000, studentsServed: 1000, isRecurring: true, riskFactor: 'High', riskDescription: 'Community will hate this.', category: 'Program', validScenarios: ['all'] },
    { id: 'g_c2', title: 'Freeze Hiring', description: 'Do not fill vacant positions.', cost: -500000, studentsServed: 5000, isRecurring: true, riskFactor: 'Medium', riskDescription: 'Increases class sizes naturally.', category: 'Personnel', validScenarios: ['all'] },
    { id: 'g_c3', title: 'Sell Advertising', description: 'Ads on school buses and gym.', cost: -50000, studentsServed: 0, isRecurring: true, riskFactor: 'Low', riskDescription: 'Tacky but harmless.', category: 'Operations', validScenarios: ['all'] },
];

export const SCENARIOS: Record<string, Scenario> = {
  urban: {
    id: 'urban',
    title: 'Urban / Declining',
    description: 'Shrinking enrollment and high fixed costs. You face a "Seniority Cliff" with expensive staff and a structural deficit.',
    icon: Building2,
    difficulty: 'Hard',
    initialState: {
      year: 2025,
      enrollment: 5000,
      revenue: { local: 45000000, state: 35000000, federalOneTime: 3000000 },
      expenditures: { personnel: 68000000, operations: 10000000, fixed: 5000000 },
      fundBalance: 4000000,
      structuralGap: -3000000,
      communityTrust: 75,
    },
    initialSchools: [
      { id: 's1', name: 'North High', type: 'High', enrollment: 1200, spendingPerPupil: 15500, academicOutcome: { math: 42, ela: 54 }, povertyRate: 0.75, principal: 'M. Ross', staffing: { senior: 60, junior: 20 } },
      { id: 's2', name: 'Lincoln Elem', type: 'Elementary', enrollment: 350, spendingPerPupil: 19500, academicOutcome: { math: 32, ela: 38 }, povertyRate: 0.85, principal: 'L. Davis', staffing: { senior: 25, junior: 5 } },
      { id: 's3', name: 'Eastside Middle', type: 'Middle', enrollment: 600, spendingPerPupil: 14200, academicOutcome: { math: 40, ela: 50 }, povertyRate: 0.80, principal: 'K. Johnson', staffing: { senior: 35, junior: 10 } },
      { id: 's4', name: 'Valley Elem', type: 'Elementary', enrollment: 400, spendingPerPupil: 17500, academicOutcome: { math: 70, ela: 80 }, povertyRate: 0.40, principal: 'S. Miller', staffing: { senior: 20, junior: 8 } },
      { id: 's5', name: 'Magnet Academy', type: 'High', enrollment: 900, spendingPerPupil: 12800, academicOutcome: { math: 95, ela: 89 }, povertyRate: 0.30, principal: 'A. Chen', staffing: { senior: 15, junior: 45 } },
      { id: 's6', name: 'Riverside Elem', type: 'Elementary', enrollment: 280, spendingPerPupil: 21000, academicOutcome: { math: 38, ela: 46 }, povertyRate: 0.90, principal: 'B. Wright', staffing: { senior: 18, junior: 2 } },
      { id: 's7', name: 'Tech High', type: 'High', enrollment: 800, spendingPerPupil: 13500, academicOutcome: { math: 75, ela: 61 }, povertyRate: 0.50, principal: 'T. Stark', staffing: { senior: 40, junior: 15 } },
      { id: 's8', name: 'West Elem', type: 'Elementary', enrollment: 450, spendingPerPupil: 14800, academicOutcome: { math: 55, ela: 61 }, povertyRate: 0.45, principal: 'C. Evans', staffing: { senior: 15, junior: 15 } },
    ],
    initialCards: [] // Populated dynamically from CARD_POOL
  },
  suburban: {
    id: 'suburban',
    title: 'Suburban / Growth',
    description: 'Exploding enrollment and overcrowding. You have a "One-Time Money Illusion" where stimulus funds are hiding a structural deficit.',
    icon: School,
    difficulty: 'Medium',
    initialState: {
      year: 2025,
      enrollment: 8000,
      revenue: { local: 70000000, state: 40000000, federalOneTime: 5000000 },
      expenditures: { personnel: 90000000, operations: 15000000, fixed: 5000000 },
      fundBalance: 6000000,
      structuralGap: 0, 
      communityTrust: 60, 
    },
    initialSchools: [
      { id: 's1', name: 'Creekside High', type: 'High', enrollment: 2400, spendingPerPupil: 11200, academicOutcome: { math: 82, ela: 88 }, povertyRate: 0.15, principal: 'J. Baker', staffing: { senior: 40, junior: 80 } }, 
      { id: 's2', name: 'Vista Elem', type: 'Elementary', enrollment: 850, spendingPerPupil: 11800, academicOutcome: { math: 79, ela: 85 }, povertyRate: 0.20, principal: 'R. Gomez', staffing: { senior: 15, junior: 35 } },
      { id: 's3', name: 'Heritage Middle', type: 'Middle', enrollment: 1200, spendingPerPupil: 12100, academicOutcome: { math: 75, ela: 83 }, povertyRate: 0.25, principal: 'T. Nguyen', staffing: { senior: 30, junior: 20 } },
      { id: 's4', name: 'New Hope Elem', type: 'Elementary', enrollment: 950, spendingPerPupil: 10500, academicOutcome: { math: 68, ela: 80 }, povertyRate: 0.30, principal: 'K. Patel', staffing: { senior: 5, junior: 45 } }, 
      { id: 's5', name: 'Legacy High', type: 'High', enrollment: 1800, spendingPerPupil: 14500, academicOutcome: { math: 89, ela: 87 }, povertyRate: 0.10, principal: 'B. O\'Malley', staffing: { senior: 70, junior: 20 } },
      { id: 's6', name: 'Oak Ridge Elem', type: 'Elementary', enrollment: 600, spendingPerPupil: 13200, academicOutcome: { math: 92, ela: 88 }, povertyRate: 0.05, principal: 'S. Connor', staffing: { senior: 25, junior: 10 } },
    ],
    initialCards: []
  },
  rural: {
    id: 'rural',
    title: 'Rural / Consolidated',
    description: 'Isolation and scale issues. High transportation costs per pupil are draining resources from the classroom.',
    icon: Trees,
    difficulty: 'Expert',
    initialState: {
      year: 2025,
      enrollment: 2500,
      revenue: { local: 15000000, state: 30000000, federalOneTime: 2000000 },
      expenditures: { personnel: 35000000, operations: 11000000, fixed: 2000000 },
      fundBalance: 1500000,
      structuralGap: -500000, 
      communityTrust: 85,
    },
    initialSchools: [
      { id: 's1', name: 'County High', type: 'High', enrollment: 800, spendingPerPupil: 17500, academicOutcome: { math: 58, ela: 66 }, povertyRate: 0.60, principal: 'D. Carter', staffing: { senior: 30, junior: 10 } },
      { id: 's2', name: 'Plains Elem', type: 'Elementary', enrollment: 400, spendingPerPupil: 18500, academicOutcome: { math: 55, ela: 61 }, povertyRate: 0.65, principal: 'S. Kim', staffing: { senior: 20, junior: 10 } },
      { id: 's3', name: 'Valley Middle', type: 'Middle', enrollment: 500, spendingPerPupil: 16800, academicOutcome: { math: 50, ela: 60 }, povertyRate: 0.70, principal: 'M. Rodriguez', staffing: { senior: 25, junior: 5 } },
      { id: 's4', name: 'Mountain View K-8', type: 'Elementary', enrollment: 300, spendingPerPupil: 21000, academicOutcome: { math: 62, ela: 68 }, povertyRate: 0.55, principal: 'A. Foster', staffing: { senior: 25, junior: 5 } },
      { id: 's5', name: 'Frontier Academy', type: 'High', enrollment: 150, spendingPerPupil: 22000, academicOutcome: { math: 78, ela: 82 }, povertyRate: 0.40, principal: 'L. Sky', staffing: { senior: 10, junior: 2 } },
    ],
    initialCards: []
  }
};

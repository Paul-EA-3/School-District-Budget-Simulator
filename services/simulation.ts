
import { CARD_POOL, PoolCard } from '../constants';
import { Card, SelectionState } from '../types';

/**
 * Generates a set of budget proposals based on the current scenario and structural gap.
 */
export const generateProposals = (scenarioId: string, structuralGap: number, fundedIds: Set<string>): Card[] => {
    const TARGET_COUNT = 8;
    let eligibleCards = CARD_POOL.filter(card =>
        card.validScenarios.includes('all') || card.validScenarios.includes(scenarioId as any)
    ).filter(card => !card.unique || !fundedIds.has(card.id));

    const isDeficitCrisis = structuralGap < -1000000;
    let finalSelection: PoolCard[] = [];
    const savingsCards = eligibleCards.filter(c => c.cost < 0);

    if (isDeficitCrisis) {
        finalSelection.push(...[...savingsCards].sort(() => Math.random() - 0.5).slice(0, 3));
    } else {
        finalSelection.push(...[...savingsCards].sort(() => Math.random() - 0.5).slice(0, 1));
    }

    const remainingPool = eligibleCards.filter(c => !finalSelection.find(f => f.id === c.id));
    finalSelection.push(...[...remainingPool].sort(() => Math.random() - 0.5).slice(0, TARGET_COUNT - finalSelection.length));

    return finalSelection.map(c => ({ ...c, selected: 'None' as SelectionState })).sort(() => Math.random() - 0.5);
};

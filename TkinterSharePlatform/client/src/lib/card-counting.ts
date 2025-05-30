import { Card } from "@shared/schema";

export interface CardCountState {
  running: number;
  true: number;
  decksRemaining: number;
}

export function getCardCountValue(card: Card): number {
  // Hi-Lo system
  if (['2', '3', '4', '5', '6'].includes(card.rank)) {
    return 1;
  } else if (['7', '8', '9'].includes(card.rank)) {
    return 0;
  } else if (['10', 'jack', 'queen', 'king', 'ace'].includes(card.rank)) {
    return -1;
  }
  return 0;
}

export function updateCardCount(
  currentCount: CardCountState,
  newCards: Card[],
  totalCardsPlayed: number,
  totalDecks: number
): CardCountState {
  let running = currentCount.running;
  
  // Add count values for new cards only
  for (const card of newCards) {
    running += getCardCountValue(card);
  }
  
  // Calculate decks remaining (approximately)
  const totalCards = totalDecks * 52;
  const cardsRemaining = totalCards - totalCardsPlayed;
  const decksRemaining = Math.max(0.5, cardsRemaining / 52);
  
  // Calculate true count
  const trueCount = decksRemaining > 0 ? running / decksRemaining : 0;
  
  return {
    running,
    true: Math.round(trueCount * 10) / 10, // Round to 1 decimal
    decksRemaining: Math.round(decksRemaining * 10) / 10
  };
}

export function getBasicStrategyHint(
  playerValue: number,
  dealerUpCard: Card,
  playerCards: Card[],
  canDoubleDown: boolean,
  canSplit: boolean
): string {
  const dealerValue = getDealerUpCardValue(dealerUpCard);
  
  // Check for splits first
  if (canSplit && playerCards.length === 2) {
    const firstCard = playerCards[0];
    if (firstCard.rank === 'ace' || firstCard.rank === '8') {
      return "Split these cards";
    }
    if (firstCard.rank === '10' || firstCard.rank === 'jack' || firstCard.rank === 'queen' || firstCard.rank === 'king') {
      return "Never split 10s - Stand";
    }
  }
  
  // Soft hands (with Ace counted as 11)
  if (hasAce(playerCards) && playerValue <= 21) {
    return getSoftHandStrategy(playerValue, dealerValue, canDoubleDown);
  }
  
  // Hard hands
  return getHardHandStrategy(playerValue, dealerValue, canDoubleDown);
}

function getDealerUpCardValue(card: Card): number {
  if (card.rank === 'ace') return 11;
  if (['jack', 'queen', 'king'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

function hasAce(cards: Card[]): boolean {
  return cards.some(card => card.rank === 'ace');
}

function getSoftHandStrategy(playerValue: number, dealerValue: number, canDoubleDown: boolean): string {
  // Simplified soft hand strategy
  if (playerValue >= 19) return "Stand";
  if (playerValue === 18) {
    if (dealerValue <= 6) return canDoubleDown ? "Double if possible, otherwise Stand" : "Stand";
    if (dealerValue <= 8) return "Stand";
    return "Hit";
  }
  if (playerValue >= 15 && dealerValue <= 6 && canDoubleDown) {
    return "Double if possible, otherwise Hit";
  }
  return "Hit";
}

function getHardHandStrategy(playerValue: number, dealerValue: number, canDoubleDown: boolean): string {
  if (playerValue >= 17) return "Stand";
  if (playerValue >= 13 && dealerValue <= 6) return "Stand";
  if (playerValue === 12 && dealerValue >= 4 && dealerValue <= 6) return "Stand";
  if (playerValue === 11 && canDoubleDown) return "Double if possible, otherwise Hit";
  if (playerValue === 10 && dealerValue <= 9 && canDoubleDown) return "Double if possible, otherwise Hit";
  if (playerValue === 9 && dealerValue >= 3 && dealerValue <= 6 && canDoubleDown) {
    return "Double if possible, otherwise Hit";
  }
  return "Hit";
}

export function getBettingAdvice(trueCount: number, baseBet: number): string {
  if (trueCount >= 2) {
    const multiplier = Math.min(5, Math.floor(trueCount));
    return `Favorable count! Consider betting ${multiplier}x base bet ($${baseBet * multiplier})`;
  } else if (trueCount <= -2) {
    return "Unfavorable count - consider minimum bet";
  }
  return "Neutral count - stick to base betting strategy";
}

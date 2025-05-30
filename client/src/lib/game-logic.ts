import { Card, Hand, GameState } from "@shared/schema";

const SUITS: Card['suit'][] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Card['rank'][] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king', 'ace'];

export function createDeck(numDecks: number = 1): Card[] {
  const deck: Card[] = [];
  
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          suit,
          rank,
          id: `${suit}_${rank}_${d}`
        });
      }
    }
  }
  
  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function getCardValue(card: Card): number {
  if (card.rank === 'ace') return 11;
  if (['jack', 'queen', 'king'].includes(card.rank)) return 10;
  return parseInt(card.rank);
}

export function calculateHandValue(cards: Card[]): { value: number; isBlackjack: boolean; isBust: boolean } {
  let value = 0;
  let aces = 0;
  
  // First pass: count non-aces
  for (const card of cards) {
    if (card.rank === 'ace') {
      aces++;
      value += 11;
    } else {
      value += getCardValue(card);
    }
  }
  
  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }
  
  const isBlackjack = value === 21 && cards.length === 2;
  const isBust = value > 21;
  
  return { value, isBlackjack, isBust };
}

export function createHand(cards: Card[] = []): Hand {
  const handValue = calculateHandValue(cards);
  return {
    cards,
    value: handValue.value,
    isBlackjack: handValue.isBlackjack,
    isBust: handValue.isBust
  };
}

export function drawCard(deck: Card[]): { card: Card; remainingDeck: Card[] } {
  if (deck.length === 0) {
    throw new Error('Cannot draw from empty deck');
  }
  
  const card = deck[0];
  const remainingDeck = deck.slice(1);
  
  return { card, remainingDeck };
}

export function initializeGame(numDecks: number = 2, startingBalance: number = 1000): GameState {
  const deck = createDeck(numDecks);
  
  return {
    deck,
    playerHand: createHand(),
    dealerHand: createHand(),
    currentBet: 0,
    balance: startingBalance,
    gamePhase: 'betting',
    canDoubleDown: false,
    canSplit: false,
    cardCount: {
      running: 0,
      true: 0,
      decksRemaining: numDecks
    },
    numDecks
  };
}

export function dealInitialCards(gameState: GameState): GameState {
  let { deck } = gameState;
  const playerCards: Card[] = [];
  const dealerCards: Card[] = [];
  
  // Deal two cards to player and dealer alternately
  for (let i = 0; i < 2; i++) {
    // Player card
    const { card: playerCard, remainingDeck: afterPlayerDraw } = drawCard(deck);
    playerCards.push(playerCard);
    deck = afterPlayerDraw;
    
    // Dealer card
    const { card: dealerCard, remainingDeck: afterDealerDraw } = drawCard(deck);
    dealerCards.push(dealerCard);
    deck = afterDealerDraw;
  }
  
  const playerHand = createHand(playerCards);
  const dealerHand = createHand(dealerCards);
  
  return {
    ...gameState,
    deck,
    playerHand,
    dealerHand,
    gamePhase: 'playing',
    canDoubleDown: true,
    canSplit: playerCards[0].rank === playerCards[1].rank
  };
}

export function hitPlayer(gameState: GameState): GameState {
  const { card, remainingDeck } = drawCard(gameState.deck);
  const newPlayerCards = [...gameState.playerHand.cards, card];
  const playerHand = createHand(newPlayerCards);
  
  let gamePhase = gameState.gamePhase;
  let gameResult = gameState.gameResult;
  
  if (playerHand.isBust) {
    gamePhase = 'finished';
    gameResult = 'lose';
  }
  
  return {
    ...gameState,
    deck: remainingDeck,
    playerHand,
    gamePhase,
    gameResult,
    canDoubleDown: false,
    canSplit: false
  };
}

export function dealerPlay(gameState: GameState): GameState {
  let { deck, dealerHand } = gameState;
  
  // Dealer must hit on 16 and stand on 17
  while (dealerHand.value < 17) {
    const { card, remainingDeck } = drawCard(deck);
    const newDealerCards = [...dealerHand.cards, card];
    dealerHand = createHand(newDealerCards);
    deck = remainingDeck;
  }
  
  // Determine game result
  let gameResult: GameState['gameResult'];
  
  if (dealerHand.isBust) {
    gameResult = 'win';
  } else if (gameState.playerHand.isBlackjack && !dealerHand.isBlackjack) {
    gameResult = 'blackjack';
  } else if (dealerHand.isBlackjack && !gameState.playerHand.isBlackjack) {
    gameResult = 'lose';
  } else if (gameState.playerHand.value > dealerHand.value) {
    gameResult = 'win';
  } else if (gameState.playerHand.value < dealerHand.value) {
    gameResult = 'lose';
  } else {
    gameResult = 'push';
  }
  
  return {
    ...gameState,
    deck,
    dealerHand,
    gamePhase: 'finished',
    gameResult
  };
}

export function doubleDown(gameState: GameState): GameState {
  // Double the bet
  const newBet = gameState.currentBet * 2;
  
  // Hit once
  const afterHit = hitPlayer(gameState);
  
  // If not bust, dealer plays
  let finalState = {
    ...afterHit,
    currentBet: newBet
  };
  
  if (!afterHit.playerHand.isBust) {
    finalState = dealerPlay(finalState);
  }
  
  return finalState;
}

export function getCardDisplay(card: Card): { rank: string; suit: string; color: string } {
  const rankMap: Record<Card['rank'], string> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
    '7': '7', '8': '8', '9': '9', '10': '10',
    'jack': 'J', 'queen': 'Q', 'king': 'K', 'ace': 'A'
  };
  
  const suitMap: Record<Card['suit'], string> = {
    'hearts': '♥',
    'diamonds': '♦',
    'clubs': '♣',
    'spades': '♠'
  };
  
  const color = card.suit === 'hearts' || card.suit === 'diamonds' ? 'red' : 'black';
  
  return {
    rank: rankMap[card.rank],
    suit: suitMap[card.suit],
    color
  };
}

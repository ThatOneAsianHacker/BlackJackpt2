import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

import GameTable from "@/components/game-table";
import CardCountingPanel from "@/components/card-counting-panel";
import StatisticsPanel from "@/components/statistics-panel";
import LearningPanel from "@/components/learning-panel";

import { 
  initializeGame, 
  dealInitialCards, 
  hitPlayer, 
  dealerPlay, 
  doubleDown,
  createDeck,
  shuffleDeck
} from "@/lib/game-logic";
import { 
  updateCardCount, 
  getBasicStrategyHint,
  type CardCountState 
} from "@/lib/card-counting";
import { apiRequest } from "@/lib/queryClient";
import { GameState, GameStats, Card } from "@shared/schema";

export default function BlackjackGame() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Game state
  const [gameState, setGameState] = useState<GameState>(() => initializeGame(2, 1000));
  const [cardCount, setCardCount] = useState<CardCountState>({
    running: 0,
    true: 0,
    decksRemaining: 2
  });
  const [cardsPlayed, setCardsPlayed] = useState<Card[]>([]);
  const [demoUserId, setDemoUserId] = useState<number | null>(null);

  // Initialize demo user
  const { data: demoData } = useQuery({
    queryKey: ['/api/init-demo'],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/init-demo');
      return await response.json();
    }
  });

  useEffect(() => {
    if (demoData?.user) {
      setDemoUserId(demoData.user.id);
    }
  }, [demoData]);

  // Get stats
  const { data: stats } = useQuery({
    queryKey: ['/api/stats', demoUserId],
    enabled: !!demoUserId,
    queryFn: async () => {
      const response = await fetch(`/api/stats/${demoUserId}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    }
  });

  // Update stats mutation
  const updateStatsMutation = useMutation({
    mutationFn: async (statsUpdate: Partial<GameStats>) => {
      const response = await apiRequest('PATCH', `/api/stats/${demoUserId}`, statsUpdate);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats', demoUserId] });
    }
  });

  // Sync game balance with database balance
  useEffect(() => {
    if (stats?.balance && stats.balance !== gameState.balance) {
      setGameState(prev => ({
        ...prev,
        balance: stats.balance
      }));
    }
  }, [stats?.balance, gameState.balance]);

  // Game actions
  const placeBet = (amount: number) => {
    if (amount > gameState.balance) {
      toast({
        title: "Insufficient funds",
        description: `You only have $${gameState.balance} available.`,
        variant: "destructive"
      });
      return;
    }

    if (amount < 5) {
      toast({
        title: "Minimum bet",
        description: "Minimum bet is $5",
        variant: "destructive"
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      currentBet: amount,
      balance: prev.balance - amount
    }));

    toast({
      title: "Bet placed",
      description: `$${amount} bet placed`,
    });
  };

  const deal = () => {
    if (gameState.currentBet === 0) {
      toast({
        title: "No bet placed",
        description: "Please place a bet before dealing",
        variant: "destructive"
      });
      return;
    }

    const newGameState = dealInitialCards(gameState);
    setGameState(newGameState);

    // Update card count with initial cards
    const initialCards = [...newGameState.playerHand.cards, ...newGameState.dealerHand.cards];
    const newCardsPlayed = [...cardsPlayed, ...initialCards];
    setCardsPlayed(newCardsPlayed);
    
    const newCardCount = updateCardCount(cardCount, initialCards, newCardsPlayed.length, gameState.numDecks);
    setCardCount(newCardCount);

    // Check for immediate blackjack
    if (newGameState.playerHand.isBlackjack) {
      setTimeout(() => finishGame(newGameState), 1000);
    }

    toast({
      title: "Cards dealt",
      description: "Good luck!",
    });
  };

  const hit = () => {
    const newGameState = hitPlayer(gameState);
    setGameState(newGameState);

    // Update cards played
    const lastCard = newGameState.playerHand.cards[newGameState.playerHand.cards.length - 1];
    const newCardsPlayed = [...cardsPlayed, lastCard];
    setCardsPlayed(newCardsPlayed);
    
    const newCardCount = updateCardCount(cardCount, [lastCard], newCardsPlayed.length, gameState.numDecks);
    setCardCount(newCardCount);

    if (newGameState.playerHand.isBust) {
      setTimeout(() => finishGame(newGameState), 1000);
    }
  };

  const stand = () => {
    setGameState(prev => ({ ...prev, gamePhase: 'dealer_turn' }));
    
    setTimeout(() => {
      const finalGameState = dealerPlay(gameState);
      setGameState(finalGameState);
      
      // Update card count with dealer's additional cards
      const dealerNewCards = finalGameState.dealerHand.cards.slice(gameState.dealerHand.cards.length);
      const newCardsPlayed = [...cardsPlayed, ...dealerNewCards];
      setCardsPlayed(newCardsPlayed);
      
      const newCardCount = updateCardCount(cardCount, dealerNewCards, newCardsPlayed.length, gameState.numDecks);
      setCardCount(newCardCount);
      
      setTimeout(() => finishGame(finalGameState), 1000);
    }, 1500);
  };

  const handleDoubleDown = () => {
    if (gameState.currentBet * 2 > gameState.balance + gameState.currentBet) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough money to double down",
        variant: "destructive"
      });
      return;
    }

    // Remove additional bet from balance
    setGameState(prev => ({
      ...prev,
      balance: prev.balance - prev.currentBet
    }));

    const newGameState = doubleDown(gameState);
    setGameState(newGameState);

    // Update card count
    const lastCard = newGameState.playerHand.cards[newGameState.playerHand.cards.length - 1];
    const newCardsPlayed = [...cardsPlayed, lastCard];
    
    if (newGameState.gamePhase === 'finished') {
      // If game finished immediately (bust), update card count
      setCardsPlayed(newCardsPlayed);
      const newCardCount = updateCardCount(cardCount, [lastCard], newCardsPlayed.length, gameState.numDecks);
      setCardCount(newCardCount);
      setTimeout(() => finishGame(newGameState), 1000);
    } else {
      // Dealer will play
      const dealerNewCards = newGameState.dealerHand.cards.slice(gameState.dealerHand.cards.length);
      const allNewCards = [lastCard, ...dealerNewCards];
      const finalCardsPlayed = [...cardsPlayed, ...allNewCards];
      setCardsPlayed(finalCardsPlayed);
      
      const newCardCount = updateCardCount(cardCount, allNewCards, finalCardsPlayed.length, gameState.numDecks);
      setCardCount(newCardCount);
      setTimeout(() => finishGame(newGameState), 1500);
    }
  };

  const handleSplit = () => {
    toast({
      title: "Split not implemented",
      description: "Split functionality coming soon!",
      variant: "default"
    });
  };

  const finishGame = (finalGameState: GameState) => {
    let winnings = 0;
    let message = "";
    let isWin = false;
    let isBlackjack = false;

    switch (finalGameState.gameResult) {
      case 'blackjack':
        winnings = Math.floor(finalGameState.currentBet * 2.5); // 3:2 payout
        message = "BLACKJACK! You win!";
        isWin = true;
        isBlackjack = true;
        break;
      case 'win':
        winnings = finalGameState.currentBet * 2;
        message = "You win!";
        isWin = true;
        break;
      case 'push':
        winnings = finalGameState.currentBet;
        message = "Push - it's a tie!";
        break;
      case 'lose':
        winnings = 0;
        message = "You lose!";
        break;
    }

    // Update balance
    setGameState(prev => ({
      ...prev,
      balance: prev.balance + winnings
    }));

    // Update statistics
    if (demoUserId && stats) {
      const statsUpdate = {
        totalHands: stats.totalHands + 1,
        handsWon: stats.handsWon + (isWin ? 1 : 0),
        blackjacks: stats.blackjacks + (isBlackjack ? 1 : 0),
        busts: stats.busts + (finalGameState.playerHand.isBust ? 1 : 0),
        netProfit: stats.netProfit + (winnings - finalGameState.currentBet),
        balance: stats.balance + winnings - finalGameState.currentBet
      };
      updateStatsMutation.mutate(statsUpdate);
    }

    toast({
      title: message,
      description: winnings > 0 ? `You won $${winnings}` : "",
      variant: isWin ? "default" : "destructive"
    });
  };

  const newGame = () => {
    setGameState(prev => ({
      ...initializeGame(prev.numDecks, prev.balance),
      balance: prev.balance
    }));
    
    toast({
      title: "New game started",
      description: "Place your bet to begin",
    });
  };

  const shuffleDeckAction = () => {
    const newDeck = shuffleDeck(createDeck(gameState.numDecks));
    setGameState(prev => ({ ...prev, deck: newDeck }));
    setCardsPlayed([]);
    setCardCount({
      running: 0,
      true: 0,
      decksRemaining: gameState.numDecks
    });
    
    toast({
      title: "Deck shuffled",
      description: "Card count reset",
    });
  };

  const changeDeckCount = (numDecks: number) => {
    const newGameState = initializeGame(numDecks, gameState.balance);
    setGameState(newGameState);
    setCardsPlayed([]);
    setCardCount({
      running: 0,
      true: 0,
      decksRemaining: numDecks
    });
    
    toast({
      title: "Deck configuration changed",
      description: `Now using ${numDecks} deck${numDecks > 1 ? 's' : ''}`,
    });
  };

  const regainMoney = () => {
    const addAmount = 1000;
    const newBalance = gameState.balance + addAmount;
    
    setGameState(prev => ({
      ...prev,
      balance: newBalance
    }));

    // Update database balance
    if (demoUserId && stats) {
      const statsUpdate = {
        balance: newBalance
      };
      updateStatsMutation.mutate(statsUpdate);
    }

    toast({
      title: "Money added",
      description: `Added $${addAmount} to your balance`,
    });
  };

  // Get strategy hint
  const strategyHint = gameState.playerHand.cards.length > 0 && gameState.dealerHand.cards.length > 0
    ? getBasicStrategyHint(
        gameState.playerHand.value,
        gameState.dealerHand.cards[0],
        gameState.playerHand.cards,
        gameState.canDoubleDown,
        gameState.canSplit
      )
    : "Place your bet and deal cards to start";

  const quickBetAmounts = [5, 25, 100, 500];

  return (
    <div className="bg-gray-900 font-body text-gray-100 min-h-screen">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="font-display text-2xl font-bold text-yellow-400">
              <i className="fas fa-spade mr-2"></i>
              Blackjack Trainer
            </h1>
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <span className="text-green-400">
                <i className="fas fa-coins mr-1"></i>
                Balance: ${gameState.balance}
              </span>
              {stats && (
                <>
                  <span className="text-gray-300">
                    Games: {stats.totalHands}
                  </span>
                  <span className="text-blue-400">
                    Win Rate: {stats.totalHands > 0 ? Math.round((stats.handsWon / stats.totalHands) * 100) : 0}%
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="secondary"
              size="sm"
              onClick={() => toast({ title: "Settings", description: "Settings panel coming soon!" })}
            >
              <i className="fas fa-cog mr-1"></i>
              Settings
            </Button>
            <Button 
              size="sm"
              className="bg-yellow-600 hover:bg-yellow-500"
              onClick={() => toast({ title: "Tutorial", description: "Tutorial coming soon!" })}
            >
              <i className="fas fa-graduation-cap mr-1"></i>
              Tutorial
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sidebar - Card Counting Education */}
        <aside className="lg:col-span-3 space-y-4">
          <CardCountingPanel cardCount={cardCount} currentBet={gameState.currentBet} />

          {/* Deck Configuration */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="font-display text-lg font-semibold text-yellow-400 mb-4">
              <i className="fas fa-layer-group mr-2"></i>
              Deck Setup
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Number of Decks</label>
                <Select value={gameState.numDecks.toString()} onValueChange={(value) => changeDeckCount(parseInt(value))}>
                  <SelectTrigger className="w-full bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Deck</SelectItem>
                    <SelectItem value="2">2 Decks</SelectItem>
                    <SelectItem value="4">4 Decks</SelectItem>
                    <SelectItem value="6">6 Decks</SelectItem>
                    <SelectItem value="8">8 Decks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={shuffleDeckAction}
                className="w-full bg-green-700 hover:bg-green-600"
              >
                <i className="fas fa-shuffle mr-2"></i>
                Shuffle Deck
              </Button>
            </div>
          </div>

          {/* Strategy Hint */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
            <h3 className="font-display text-lg font-semibold text-yellow-400 mb-4">
              <i className="fas fa-lightbulb mr-2"></i>
              Strategy Hint
            </h3>
            <p className="text-sm text-gray-300">{strategyHint}</p>
          </div>
        </aside>

        {/* Main Game Area */}
        <main className="lg:col-span-6 space-y-6">
          <GameTable
            playerHand={gameState.playerHand}
            dealerHand={gameState.dealerHand}
            gamePhase={gameState.gamePhase}
            canDoubleDown={gameState.canDoubleDown}
            canSplit={gameState.canSplit}
            hideSecondDealerCard={gameState.gamePhase !== 'finished' && gameState.gamePhase !== 'dealer_turn'}
            onHit={hit}
            onStand={stand}
            onDoubleDown={handleDoubleDown}
            onSplit={handleSplit}
          />

          {/* Betting Interface */}
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Bet */}
              <div className="text-center">
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">Current Bet</h4>
                <div className="bg-gray-700 rounded-lg p-4 mb-4">
                  <div className="text-3xl font-bold text-green-400">${gameState.currentBet}</div>
                </div>
                <Slider
                  value={[gameState.currentBet]}
                  onValueChange={(value) => placeBet(value[0])}
                  max={Math.min(500, gameState.balance + gameState.currentBet)}
                  min={5}
                  step={5}
                  className="w-full mb-3"
                  disabled={gameState.gamePhase !== 'betting'}
                />
                <div className="flex justify-between text-xs text-gray-400">
                  <span>$5</span>
                  <span>${Math.min(500, gameState.balance + gameState.currentBet)}</span>
                </div>
              </div>

              {/* Quick Bet Chips */}
              <div>
                <h4 className="text-lg font-semibold text-yellow-400 mb-3">Quick Bet</h4>
                <div className="grid grid-cols-4 gap-2">
                  {quickBetAmounts.map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => placeBet(amount)}
                      disabled={gameState.gamePhase !== 'betting' || amount > gameState.balance + gameState.currentBet}
                      className={`rounded-full w-12 h-12 font-bold text-sm chip-shadow transition-all transform hover:scale-110 ${
                        amount === 5 ? 'bg-yellow-600 hover:bg-yellow-500 text-gray-900' :
                        amount === 25 ? 'bg-red-600 hover:bg-red-700 text-white' :
                        amount === 100 ? 'bg-green-600 hover:bg-green-700 text-white' :
                        'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={deal}
                  disabled={gameState.gamePhase !== 'betting' || gameState.currentBet === 0}
                  className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-gray-900 py-3 font-bold text-lg glow-gold"
                >
                  <i className="fas fa-play mr-2"></i>
                  Deal Cards
                </Button>
              </div>
            </div>
          </div>

          {/* Game Status */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${
                  gameState.gamePhase === 'betting' ? 'bg-green-400 animate-pulse' :
                  gameState.gamePhase === 'playing' ? 'bg-blue-400 animate-pulse' :
                  gameState.gamePhase === 'dealer_turn' ? 'bg-yellow-400 animate-pulse' :
                  'bg-gray-400'
                }`}></div>
                <span className="text-gray-300">
                  {gameState.gamePhase === 'betting' && 'Ready to play - Place your bet!'}
                  {gameState.gamePhase === 'playing' && 'Your turn - Hit or Stand?'}
                  {gameState.gamePhase === 'dealer_turn' && 'Dealer is playing...'}
                  {gameState.gamePhase === 'finished' && 'Round finished'}
                </span>
              </div>
              <Button
                onClick={newGame}
                variant="secondary"
                size="sm"
              >
                <i className="fas fa-refresh mr-1"></i>
                New Game
              </Button>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Statistics & Learning */}
        <aside className="lg:col-span-3 space-y-4">
          {stats && <StatisticsPanel stats={stats} />}
          <LearningPanel />
        </aside>
      </div>

      {/* Regain Money Button - Bottom Left */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={regainMoney}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-all transform hover:scale-105"
          disabled={gameState.balance >= 10000} // Disable if balance is already high
        >
          <i className="fas fa-coins"></i>
          <span>Add $1000</span>
        </Button>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4">
        <div className="flex justify-around">
          <button className="flex flex-col items-center space-y-1 text-gray-400 hover:text-yellow-400">
            <i className="fas fa-play"></i>
            <span className="text-xs">Play</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400 hover:text-yellow-400">
            <i className="fas fa-brain"></i>
            <span className="text-xs">Count</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400 hover:text-yellow-400">
            <i className="fas fa-chart-line"></i>
            <span className="text-xs">Stats</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-gray-400 hover:text-yellow-400">
            <i className="fas fa-graduation-cap"></i>
            <span className="text-xs">Learn</span>
          </button>
        </div>
      </div>
    </div>
  );
}

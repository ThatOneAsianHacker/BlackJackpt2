import { Card, Hand } from "@shared/schema";
import { getCardDisplay } from "@/lib/game-logic";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface GameTableProps {
  playerHand: Hand;
  dealerHand: Hand;
  gamePhase: string;
  canDoubleDown: boolean;
  canSplit: boolean;
  hideSecondDealerCard?: boolean;
  onHit: () => void;
  onStand: () => void;
  onDoubleDown: () => void;
  onSplit: () => void;
}

interface PlayingCardProps {
  card?: Card;
  isHidden?: boolean;
  delay?: number;
}

function PlayingCard({ card, isHidden = false, delay = 0 }: PlayingCardProps) {
  if (isHidden) {
    return (
      <motion.div
        initial={{ scale: 0, rotateY: 180 }}
        animate={{ scale: 1, rotateY: 0 }}
        transition={{ duration: 0.5, delay }}
        className="bg-blue-900 rounded-lg w-16 h-24 card-shadow flex items-center justify-center card-animation"
      >
        <div className="text-white text-xs">🂠</div>
      </motion.div>
    );
  }

  if (!card) return null;

  const { rank, suit, color } = getCardDisplay(card);

  return (
    <motion.div
      initial={{ scale: 0, rotateY: 180 }}
      animate={{ scale: 1, rotateY: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-lg w-16 h-24 card-shadow flex flex-col items-center justify-center text-gray-900 card-animation"
    >
      <div className="text-2xl font-bold">{rank}</div>
      <div className={`text-lg ${color === 'red' ? 'text-red-500' : 'text-black'}`}>
        {suit}
      </div>
    </motion.div>
  );
}

export default function GameTable({
  playerHand,
  dealerHand,
  gamePhase,
  canDoubleDown,
  canSplit,
  hideSecondDealerCard = true,
  onHit,
  onStand,
  onDoubleDown,
  onSplit
}: GameTableProps) {
  const isPlaying = gamePhase === 'playing';
  const isDealerTurn = gamePhase === 'dealer_turn';
  
  return (
    <div className="felt-texture rounded-2xl p-6 min-h-96 relative overflow-hidden">
      {/* Dealer Section */}
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
          <i className="fas fa-user-tie mr-2"></i>
          Dealer {!hideSecondDealerCard && <span className="ml-2 text-yellow-400">({dealerHand.value})</span>}
        </h3>
        
        <div className="flex justify-center space-x-2 mb-4">
          {dealerHand.cards.map((card, index) => (
            <PlayingCard
              key={card.id}
              card={card}
              isHidden={hideSecondDealerCard && index === 1}
              delay={index * 0.2}
            />
          ))}
        </div>
      </div>

      {/* Center Line */}
      <div className="border-t border-white border-opacity-20 my-6"></div>

      {/* Player Section */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center">
          <i className="fas fa-user mr-2"></i>
          Your Hand <span className="ml-2 text-yellow-400">({playerHand.value})</span>
        </h3>
        
        <div className="flex justify-center space-x-2 mb-6">
          {playerHand.cards.map((card, index) => (
            <PlayingCard
              key={card.id}
              card={card}
              delay={(index + 2) * 0.2}
            />
          ))}
        </div>

        {/* Game Action Buttons */}
        {isPlaying && !playerHand.isBust && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex justify-center space-x-3 flex-wrap gap-2"
          >
            <Button
              onClick={onHit}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 font-medium transition-all transform hover:scale-105"
            >
              <i className="fas fa-plus mr-2"></i>
              Hit
            </Button>
            <Button
              onClick={onStand}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 font-medium transition-all transform hover:scale-105"
            >
              <i className="fas fa-hand-paper mr-2"></i>
              Stand
            </Button>
            {canDoubleDown && (
              <Button
                onClick={onDoubleDown}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium transition-all transform hover:scale-105"
              >
                <i className="fas fa-arrow-up mr-2"></i>
                Double
              </Button>
            )}
            {canSplit && (
              <Button
                onClick={onSplit}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 font-medium transition-all transform hover:scale-105"
              >
                <i className="fas fa-cut mr-2"></i>
                Split
              </Button>
            )}
          </motion.div>
        )}

        {/* Game Status Messages */}
        {playerHand.isBust && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-red-400 text-xl font-bold"
          >
            BUST! You lose!
          </motion.div>
        )}

        {playerHand.isBlackjack && gamePhase === 'finished' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-yellow-400 text-xl font-bold"
          >
            BLACKJACK!
          </motion.div>
        )}

        {isDealerTurn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-blue-400 text-lg"
          >
            Dealer is playing...
          </motion.div>
        )}
      </div>
    </div>
  );
}

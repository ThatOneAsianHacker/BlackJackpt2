import { CardCountState } from "@/lib/card-counting";
import { getBettingAdvice } from "@/lib/card-counting";

interface CardCountingPanelProps {
  cardCount: CardCountState;
  currentBet: number;
}

export default function CardCountingPanel({ cardCount, currentBet }: CardCountingPanelProps) {
  const bettingAdvice = getBettingAdvice(cardCount.true, currentBet);
  
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="font-display text-lg font-semibold text-yellow-400 mb-4 flex items-center">
        <i className="fas fa-brain mr-2"></i>
        Card Counting
      </h3>
      
      <div className="space-y-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">Running Count</span>
            <span className={`text-xl font-bold ${
              cardCount.running > 0 ? 'text-green-400' : 
              cardCount.running < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {cardCount.running > 0 ? '+' : ''}{cardCount.running}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-300">True Count</span>
            <span className={`text-lg font-semibold ${
              cardCount.true > 0 ? 'text-green-400' : 
              cardCount.true < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              {cardCount.true > 0 ? '+' : ''}{cardCount.true}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Decks Left</span>
            <span className="text-sm text-gray-400">{cardCount.decksRemaining}</span>
          </div>
        </div>
        
        <div className="bg-green-900 bg-opacity-30 rounded-lg p-3">
          <h4 className="font-medium text-white mb-2">Hi-Lo System</h4>
          <div className="grid grid-cols-3 gap-1 text-xs">
            <div className="text-center p-1 bg-red-500 bg-opacity-20 rounded">
              <div className="text-red-400">2-6</div>
              <div className="text-green-400">+1</div>
            </div>
            <div className="text-center p-1 bg-gray-500 bg-opacity-20 rounded">
              <div className="text-gray-300">7-9</div>
              <div className="text-gray-400">0</div>
            </div>
            <div className="text-center p-1 bg-blue-500 bg-opacity-20 rounded">
              <div className="text-blue-400">10-A</div>
              <div className="text-red-400">-1</div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3">
          <h4 className="font-medium text-white mb-2">Betting Advice</h4>
          <p className="text-sm text-gray-300">
            {bettingAdvice}
          </p>
        </div>
      </div>
    </div>
  );
}

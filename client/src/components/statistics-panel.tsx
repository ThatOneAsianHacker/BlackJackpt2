import { GameStats } from "@shared/schema";

interface StatisticsPanelProps {
  stats: GameStats;
}

export default function StatisticsPanel({ stats }: StatisticsPanelProps) {
  const winRate = stats.totalHands > 0 ? Math.round((stats.handsWon / stats.totalHands) * 100) : 0;
  
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
      <h3 className="font-display text-lg font-semibold text-yellow-400 mb-4 flex items-center">
        <i className="fas fa-chart-line mr-2"></i>
        Statistics
      </h3>
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-300">Total Hands</span>
          <span className="font-semibold text-white">{stats.totalHands}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Hands Won</span>
          <span className="font-semibold text-green-400">{stats.handsWon}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Win Rate</span>
          <span className="font-semibold text-blue-400">{winRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Blackjacks</span>
          <span className="font-semibold text-yellow-400">{stats.blackjacks}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Busts</span>
          <span className="font-semibold text-red-400">{stats.busts}</span>
        </div>
        <hr className="border-gray-600" />
        <div className="flex justify-between">
          <span className="text-gray-300">Net Profit</span>
          <span className={`font-bold ${stats.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.netProfit}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-300">Current Balance</span>
          <span className="font-bold text-green-400">${stats.balance}</span>
        </div>
      </div>
    </div>
  );
}

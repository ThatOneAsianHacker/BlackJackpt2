import { Button } from "@/components/ui/button";

export default function LearningPanel() {
  return (
    <div className="space-y-4">
      {/* Learning Progress */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="font-display text-lg font-semibold text-yellow-400 mb-4 flex items-center">
          <i className="fas fa-lightbulb mr-2"></i>
          Learning Progress
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Basic Strategy</span>
              <span className="text-yellow-400">75%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full w-3/4"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Card Counting</span>
              <span className="text-yellow-400">45%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full w-2/5"></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-300">Bankroll Management</span>
              <span className="text-yellow-400">30%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full w-1/3"></div>
            </div>
          </div>
        </div>
        <Button className="w-full mt-4 bg-green-700 hover:bg-green-600 text-white">
          <i className="fas fa-book-open mr-2"></i>
          Study Guide
        </Button>
      </div>

      {/* Pro Tips */}
      <div className="bg-gray-800 rounded-xl p-5 border border-gray-700">
        <h3 className="font-display text-lg font-semibold text-yellow-400 mb-4 flex items-center">
          <i className="fas fa-star mr-2"></i>
          Pro Tips
        </h3>
        <div className="space-y-3 text-sm">
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <i className="fas fa-star text-yellow-400 mt-1"></i>
              <p className="text-gray-300">Always split Aces and 8s, never split 10s or 5s.</p>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <i className="fas fa-star text-yellow-400 mt-1"></i>
              <p className="text-gray-300">Double down on 11 against any dealer upcard except Ace.</p>
            </div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <i className="fas fa-star text-yellow-400 mt-1"></i>
              <p className="text-gray-300">Insurance is generally a bad bet - avoid it.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

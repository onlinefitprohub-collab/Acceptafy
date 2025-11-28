import { AnalyticsIcon } from './icons/CategoryIcons';
import type { HistoryItem } from '../types';

interface ScoreHistoryChartProps {
    history: HistoryItem[];
}

export const ScoreHistoryChart: React.FC<ScoreHistoryChartProps> = ({ history }) => {
    const recentHistory = history.slice(0, 10).reverse();
    
    if (recentHistory.length === 0) {
        return (
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                    <AnalyticsIcon className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Score History</h3>
                </div>
                <div className="text-center py-8 text-gray-400">
                    <p>No analysis history yet.</p>
                    <p className="text-sm mt-1">Grade your first email to see your score trends.</p>
                </div>
            </div>
        );
    }

    const maxScore = 100;
    const chartHeight = 200;

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-6">
                <AnalyticsIcon className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Score History</h3>
            </div>

            <div className="relative" style={{ height: chartHeight }}>
                <div className="absolute left-0 top-0 h-full w-8 flex flex-col justify-between text-xs text-gray-500">
                    <span>100</span>
                    <span>75</span>
                    <span>50</span>
                    <span>25</span>
                    <span>0</span>
                </div>

                <div className="absolute left-10 right-0 top-0 h-full">
                    {[0, 25, 50, 75].map((value) => (
                        <div
                            key={value}
                            className="absolute w-full border-t border-white/5"
                            style={{ top: `${((100 - value) / 100) * 100}%` }}
                        />
                    ))}

                    <div className="absolute inset-0 flex items-end justify-around px-2">
                        {recentHistory.map((item, index) => {
                            const score = item.result.inboxPlacementScore.score;
                            const height = (score / maxScore) * 100;
                            const color = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500';
                            const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                            return (
                                <div key={item.id} className="flex flex-col items-center gap-1 flex-1 max-w-[60px]">
                                    <div 
                                        className={`w-full max-w-[40px] ${color} rounded-t transition-all duration-500 hover:opacity-80`}
                                        style={{ height: `${(height / 100) * (chartHeight - 30)}px` }}
                                        title={`Score: ${score}`}
                                    />
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10">
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className="text-2xl font-bold text-purple-400">
                            {recentHistory.length > 0 
                                ? Math.round(recentHistory.reduce((acc, item) => acc + item.result.inboxPlacementScore.score, 0) / recentHistory.length)
                                : 0
                            }
                        </div>
                        <div className="text-xs text-gray-400">Avg Score</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-green-400">
                            {recentHistory.length > 0 
                                ? Math.max(...recentHistory.map(item => item.result.inboxPlacementScore.score))
                                : 0
                            }
                        </div>
                        <div className="text-xs text-gray-400">Best Score</div>
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-gray-400">
                            {recentHistory.length}
                        </div>
                        <div className="text-xs text-gray-400">Analyses</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

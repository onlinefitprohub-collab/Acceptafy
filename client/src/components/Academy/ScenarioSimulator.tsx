import { useState } from 'react';
import { ModuleHeader } from './ModuleComponents';
import { CheckIcon, CloseIcon, PlayIcon } from '../icons/CategoryIcons';

interface Scenario {
    id: string;
    title: string;
    description: string;
    situation: string;
    options: {
        text: string;
        outcome: string;
        isOptimal: boolean;
        points: number;
    }[];
}

const scenarios: Scenario[] = [
    {
        id: 'bounce-spike',
        title: "Sudden Bounce Rate Spike",
        description: "Test your deliverability troubleshooting skills",
        situation: "You notice your bounce rate has jumped from 2% to 15% after your latest campaign. Your opens and clicks are also down significantly. What's your first move?",
        options: [
            {
                text: "Immediately pause all email sends and investigate",
                outcome: "Smart choice! Continuing to send while experiencing delivery issues can damage your sender reputation further. You discover a batch of bad emails was accidentally imported.",
                isOptimal: true,
                points: 100
            },
            {
                text: "Send another campaign to see if it was a one-time issue",
                outcome: "Risky move. Sending more emails during a delivery crisis compounds the problem. Your sender score drops further and recovery takes weeks longer.",
                isOptimal: false,
                points: 20
            },
            {
                text: "Switch to a new email service provider immediately",
                outcome: "Hasty decision. The problem was in your list, not your ESP. Now you've wasted time and money on migration while the real issue persists.",
                isOptimal: false,
                points: 30
            }
        ]
    },
    {
        id: 'low-engagement',
        title: "List Re-engagement Challenge",
        description: "Revive a cold email list effectively",
        situation: "You've inherited an email list of 50,000 subscribers, but open rates are at 8% and click rates below 0.5%. The list hasn't been emailed in 6 months. What's your strategy?",
        options: [
            {
                text: "Send a re-permission campaign, then remove non-responders",
                outcome: "Excellent! You're respecting subscriber consent while protecting deliverability. You end up with 12,000 engaged subscribers who actually want to hear from you.",
                isOptimal: true,
                points: 100
            },
            {
                text: "Start with your best promotional offer to maximize opens",
                outcome: "Not ideal. Sending promotions to a cold list often triggers spam complaints. Your sender reputation takes a hit and future campaigns suffer.",
                isOptimal: false,
                points: 40
            },
            {
                text: "Gradually email small segments to warm up the list",
                outcome: "Reasonable approach, but without re-permission you're still emailing people who may not want to hear from you. Better than blasting everyone, but not optimal.",
                isOptimal: false,
                points: 60
            }
        ]
    },
    {
        id: 'subject-test',
        title: "A/B Test Design",
        description: "Design an effective subject line test",
        situation: "You want to A/B test subject lines for an important product launch. Your list has 20,000 subscribers. How do you structure the test?",
        options: [
            {
                text: "Test with 10% of the list, then send the winner to the remaining 90%",
                outcome: "Perfect strategy! Testing on 2,000 subscribers gives you statistical significance while maximizing the impact of your winning subject line on the majority of your list.",
                isOptimal: true,
                points: 100
            },
            {
                text: "Split the entire list 50/50 between two subject lines",
                outcome: "Not optimal. You'll learn which subject line won, but you've already sent to everyone. You can't apply the learning to this campaign, only future ones.",
                isOptimal: false,
                points: 50
            },
            {
                text: "Test 5 different subject lines with 20% of the list each",
                outcome: "Too many variables. With 4,000 subscribers per variation, you might not reach statistical significance, and you can't send a winner to the remaining list.",
                isOptimal: false,
                points: 30
            }
        ]
    }
];

export const ScenarioSimulator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [currentScenario, setCurrentScenario] = useState<number>(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [totalScore, setTotalScore] = useState(0);
    const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());

    const scenario = scenarios[currentScenario];
    const isAnswered = selectedOption !== null;
    const isCompleted = completedScenarios.has(scenario.id);

    const handleSelect = (index: number) => {
        if (isAnswered) return;
        setSelectedOption(index);
        setTotalScore(prev => prev + scenario.options[index].points);
        setCompletedScenarios(prev => new Set([...prev, scenario.id]));
    };

    const nextScenario = () => {
        if (currentScenario < scenarios.length - 1) {
            setCurrentScenario(prev => prev + 1);
            setSelectedOption(null);
        }
    };

    const resetSimulator = () => {
        setCurrentScenario(0);
        setSelectedOption(null);
        setTotalScore(0);
        setCompletedScenarios(new Set());
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader onBack={onBack} title="Scenario Simulator" subtitle="Apply your knowledge in interactive, real-world email marketing challenges." />
            
            <div className="flex items-center justify-between bg-white/5 p-4 rounded-lg">
                <div>
                    <span className="text-sm text-gray-400">Scenario {currentScenario + 1} of {scenarios.length}</span>
                    <div className="text-lg font-bold text-white">{scenario.title}</div>
                </div>
                <div className="text-right">
                    <span className="text-sm text-gray-400">Total Score</span>
                    <div className="text-2xl font-bold text-purple-400">{totalScore}</div>
                </div>
            </div>

            <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <div className="flex items-center gap-2 mb-4">
                    <PlayIcon className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-purple-300">{scenario.description}</span>
                </div>
                <p className="text-gray-300 leading-relaxed">{scenario.situation}</p>
            </div>

            <div className="space-y-3">
                <h4 className="font-semibold text-gray-200">Choose your response:</h4>
                {scenario.options.map((option, index) => {
                    let buttonClass = 'bg-gray-900/50 border-gray-600 hover:bg-gray-800/60';
                    if (isAnswered) {
                        if (option.isOptimal) buttonClass = 'bg-green-500/20 border-green-500';
                        else if (selectedOption === index) buttonClass = 'bg-yellow-500/20 border-yellow-500';
                        else buttonClass = 'bg-gray-900/30 border-gray-700';
                    }
                    return (
                        <button
                            key={index}
                            onClick={() => handleSelect(index)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 rounded-lg border transition-all duration-300 ${buttonClass}`}
                        >
                            <div className="flex items-start gap-3">
                                <span className="font-mono text-purple-400 flex-shrink-0">[{index + 1}]</span>
                                <span className="text-gray-300">{option.text}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className="animate-fade-in space-y-4">
                    <div className={`p-4 rounded-lg border ${
                        scenario.options[selectedOption!].isOptimal 
                            ? 'bg-green-500/20 border-green-500' 
                            : 'bg-yellow-500/20 border-yellow-500'
                    }`}>
                        <div className="flex items-center gap-2 mb-2">
                            {scenario.options[selectedOption!].isOptimal ? (
                                <CheckIcon className="w-5 h-5 text-green-400" />
                            ) : (
                                <CloseIcon className="w-5 h-5 text-yellow-400" />
                            )}
                            <span className="font-bold">
                                {scenario.options[selectedOption!].isOptimal ? 'Optimal Choice!' : 'Not Quite Optimal'}
                            </span>
                            <span className="ml-auto text-sm">+{scenario.options[selectedOption!].points} points</span>
                        </div>
                        <p className="text-sm">{scenario.options[selectedOption!].outcome}</p>
                    </div>

                    {currentScenario < scenarios.length - 1 ? (
                        <button
                            onClick={nextScenario}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors"
                        >
                            Next Scenario →
                        </button>
                    ) : (
                        <div className="text-center space-y-4">
                            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-6">
                                <h4 className="text-xl font-bold text-white mb-2">Simulation Complete!</h4>
                                <p className="text-gray-300 mb-4">
                                    You scored <span className="text-purple-400 font-bold">{totalScore}</span> out of {scenarios.length * 100} possible points.
                                </p>
                                <button
                                    onClick={resetSimulator}
                                    className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-semibold text-white transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

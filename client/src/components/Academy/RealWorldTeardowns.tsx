import { useState } from 'react';
import { ModuleHeader, SectionWrapper } from './ModuleComponents';
import { CheckIcon, CloseIcon } from '../icons/CategoryIcons';

interface TeardownExample {
    title: string;
    email: {
        subject: string;
        previewText: string;
        body: string;
    };
    quiz: {
        question: string;
        options: string[];
        correctIndex: number;
    };
    analysis: {
        good: string[];
        bad: string[];
        overall: string;
    };
}

const teardowns: TeardownExample[] = [
    {
        title: "E-commerce Abandoned Cart",
        email: {
            subject: "Did you forget something? 👀",
            previewText: "Your cart is waiting...",
            body: "Hey there!\n\nWe noticed you left some items in your cart. Don't worry, we saved them for you!\n\nComplete your purchase now and get FREE shipping on your order.\n\n[Complete My Order]\n\nHurry—your cart will expire in 24 hours!"
        },
        quiz: {
            question: "What could be improved in this email?",
            options: [
                "The subject line is too long",
                "The email lacks specific product details",
                "There's no call to action",
                "The preview text repeats the subject"
            ],
            correctIndex: 1
        },
        analysis: {
            good: [
                "Creates urgency with the 24-hour deadline",
                "Offers a clear incentive (free shipping)",
                "Friendly, conversational tone",
                "Clear CTA button"
            ],
            bad: [
                "Doesn't mention specific products left in cart",
                "No personalization beyond basic greeting",
                "Could include product images for visual reminder"
            ],
            overall: "This is a solid abandoned cart email that hits the basics. To improve, include the actual products and their images to remind the customer exactly what they're missing."
        }
    },
    {
        title: "B2B Cold Outreach",
        email: {
            subject: "Quick question about [Company]'s lead gen",
            previewText: "I noticed something interesting...",
            body: "Hi [Name],\n\nI was researching [Company] and noticed you're scaling your sales team. Congrats on the growth!\n\nI'm curious—are you finding it challenging to keep your pipeline full while onboarding new reps?\n\nWe help companies like [Similar Company] generate 40% more qualified leads without adding headcount.\n\nWorth a 15-minute chat?\n\nBest,\n[Sender]"
        },
        quiz: {
            question: "What makes this cold email effective?",
            options: [
                "It's very long and detailed",
                "It shows research and ends with a low-commitment ask",
                "It focuses heavily on the sender's company",
                "It uses lots of statistics"
            ],
            correctIndex: 1
        },
        analysis: {
            good: [
                "Shows specific research about the company",
                "Asks a relevant question rather than pitching immediately",
                "Uses social proof (similar company reference)",
                "Low-friction CTA (15-minute chat)"
            ],
            bad: [
                "Could be more specific about the research finding",
                "The stat could be more compelling with context"
            ],
            overall: "This cold email follows best practices: personalization, curiosity-driven opening, social proof, and an easy ask. The key is that it feels like a conversation starter, not a sales pitch."
        }
    }
];

export const RealWorldTeardowns: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answered, setAnswered] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    const current = teardowns[currentIndex];

    const handleAnswer = (index: number) => {
        if (answered) return;
        setSelectedOption(index);
        setAnswered(true);
    };

    const nextTeardown = () => {
        if (currentIndex < teardowns.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setAnswered(false);
            setSelectedOption(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <ModuleHeader onBack={onBack} title="Interactive Case Studies" subtitle="Analyze real emails, test your knowledge, then see the expert breakdown." />
            
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Case Study {currentIndex + 1} of {teardowns.length}</span>
                <span className="text-sm font-semibold text-purple-400">{current.title}</span>
            </div>

            <SectionWrapper title="The Email" subtitle="Read it carefully, then answer the question below">
                <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                    <div className="mb-3">
                        <span className="text-xs text-gray-500">Subject:</span>
                        <p className="text-white font-semibold">{current.email.subject}</p>
                    </div>
                    <div className="mb-3">
                        <span className="text-xs text-gray-500">Preview:</span>
                        <p className="text-gray-400">{current.email.previewText}</p>
                    </div>
                    <div className="border-t border-gray-700 pt-3">
                        <span className="text-xs text-gray-500">Body:</span>
                        <p className="text-gray-300 whitespace-pre-line mt-1">{current.email.body}</p>
                    </div>
                </div>
            </SectionWrapper>

            <div className="bg-white/5 p-4 sm:p-6 rounded-lg border-2 border-dashed border-white/10">
                <h4 className="text-lg font-bold text-purple-300 mb-3">Quick Quiz</h4>
                <p className="font-semibold text-gray-200 mb-4">{current.quiz.question}</p>
                <div className="space-y-2">
                    {current.quiz.options.map((option, index) => {
                        let buttonClass = 'bg-gray-900/50 border-gray-600 hover:bg-gray-800/60';
                        if (answered) {
                            if (index === current.quiz.correctIndex) buttonClass = 'bg-green-500/20 border-green-500 text-green-300';
                            else if (selectedOption === index) buttonClass = 'bg-red-500/20 border-red-500 text-red-300';
                            else buttonClass = 'bg-gray-900/30 border-gray-700 text-gray-500';
                        }
                        return (
                            <button
                                key={index}
                                onClick={() => handleAnswer(index)}
                                disabled={answered}
                                className={`w-full text-left p-3 text-sm rounded-lg border transition-all duration-300 ${buttonClass}`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            {answered && (
                <div className="space-y-4 animate-fade-in">
                    <SectionWrapper title="Expert Analysis" subtitle="Here's what the pros see">
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-semibold text-green-400 flex items-center gap-2 mb-2">
                                    <CheckIcon className="w-4 h-4" /> What Works Well
                                </h5>
                                <ul className="list-disc list-inside space-y-1">
                                    {current.analysis.good.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold text-red-400 flex items-center gap-2 mb-2">
                                    <CloseIcon className="w-4 h-4" /> Areas for Improvement
                                </h5>
                                <ul className="list-disc list-inside space-y-1">
                                    {current.analysis.bad.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                                <h5 className="font-semibold text-purple-300 mb-2">Bottom Line</h5>
                                <p>{current.analysis.overall}</p>
                            </div>
                        </div>
                    </SectionWrapper>

                    {currentIndex < teardowns.length - 1 && (
                        <button
                            onClick={nextTeardown}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white transition-colors"
                        >
                            Next Case Study →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

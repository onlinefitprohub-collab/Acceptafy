import { useState } from 'react';
import { CheckIcon, CloseIcon } from '../icons/CategoryIcons';
import { ModuleHeader } from './ModuleComponents';

interface CaseStudy {
    type: 'good' | 'bad',
    title: string,
    subject: string,
    body: string,
    analysis: string[],
    interactive: {
        question: string,
        options: { text: string; isCorrect: boolean }[],
        explanation: string,
    }
}

const caseStudies: CaseStudy[] = [
    {
        type: 'good',
        title: "The Notion Welcome Email",
        subject: "Welcome to Notion! Here's how to get started.",
        body: `Hi Alex,\n\nWelcome! We're so excited to have you join the millions of people who use Notion to stay organized and productive.\n\nTo help you get started, here's a 2-minute video that covers the basics: [link]\n\nHave any questions? Just reply to this email, we're always happy to help.\n\nBest,\nThe Notion Team`,
        analysis: [
            "Clean, direct subject line that perfectly sets expectations.",
            "Personalized with the user's name (`Alex`) to establish rapport.",
            "Low-friction Call to Action ('2-minute video'). It provides immediate value without asking for a major commitment.",
            "Opens a channel for direct replies ('Just reply to this email'), which is excellent for building sender reputation.",
            "Contains zero common spam trigger words or deceptive formatting."
        ],
        interactive: {
            question: "What is the strongest element of this welcome email?",
            options: [
                { text: "The use of bright, engaging colors.", isCorrect: false },
                { text: "The low-friction Call to Action (a 2-minute video).", isCorrect: true },
                { text: "The detailed list of all product features.", isCorrect: false },
                { text: "The very formal and corporate tone.", isCorrect: false },
            ],
            explanation: "Correct! The '2-minute video' is a perfect CTA for a welcome email. It respects the user's time and provides immediate value without asking for a purchase or a lengthy commitment, which is key to building trust."
        }
    },
    {
        type: 'bad',
        title: "The Aggressive Sales Email",
        subject: "$$$ MAKE MONEY FAST - EXCLUSIVE OFFER JUST FOR YOU!!! $$$",
        body: `DON'T MISS OUT on this once-in-a-lifetime opportunity! Click here to claim your GUARANTEED success. This is not a scam, it is 100% legit.\n\nOur revolutionary system will make you rich overnight. ACT NOW before it's too late.\n\nClick this link: https://bit.ly/totally-safe-link`,
        analysis: [
            "Subject uses excessive capitalization and symbols, which are major spam filter red flags.",
            "Relies on classic spam trigger phrases like 'MAKE MONEY FAST' and 'GUARANTEED success'.",
            "Content is pure hype with no substance, creating distrust.",
            "Uses a shortened URL, a common tactic to hide the destination link that filters are highly suspicious of.",
            "Impersonal, desperate tone that alienates the reader."
        ],
        interactive: {
            question: "Besides the subject line, what is the biggest deliverability mistake in this email's body?",
            options: [
                { text: "The email is too short.", isCorrect: false },
                { text: "It doesn't include the sender's name.", isCorrect: false },
                { text: "It uses a public URL shortener (bit.ly).", isCorrect: true },
                { text: "The font is not a standard one.", isCorrect: false },
            ],
            explanation: "Exactly. Public URL shorteners are a massive red flag for spam filters because they obscure the link's true destination. Always use full, trustworthy URLs from your own domain."
        }
    }
];

const InteractiveCaseStudy: React.FC<{ caseStudy: CaseStudy }> = ({ caseStudy }) => {
    const { type, title, subject, body, analysis, interactive } = caseStudy;
    const [answered, setAnswered] = useState(false);
    const [selected, setSelected] = useState<number | null>(null);

    const isGood = type === 'good';
    const borderColor = isGood ? 'border-green-500/50' : 'border-red-500/50';
    const textColor = isGood ? 'text-green-300' : 'text-red-300';
    const bgColor = isGood ? 'bg-green-900/30' : 'bg-red-900/30';

    const handleSelect = (index: number) => {
        if (answered) return;
        setSelected(index);
        setAnswered(true);
    };

    return (
        <div className={`bg-white/5 p-4 sm:p-6 rounded-lg border ${borderColor}`}>
            <h4 className={`text-xl font-bold ${textColor}`}>{isGood ? '✅ Effective Example:' : '❌ Ineffective Example:'} {title}</h4>
            <div className="mt-4 space-y-4">
                <div className="p-3 bg-gray-900/50 rounded-lg border border-white/10">
                    <p className="text-sm font-semibold text-gray-400">Subject Line</p>
                    <p className="text-gray-200 font-mono text-sm">{subject}</p>
                </div>
                <div className="p-3 bg-gray-900/50 rounded-lg border border-white/10">
                     <p className="text-sm font-semibold text-gray-400 mb-2">Email Body</p>
                     <div className="whitespace-pre-wrap font-sans text-sm text-gray-300">{body}</div>
                </div>

                <div className="bg-white/5 p-4 rounded-lg border-2 border-dashed border-white/10">
                    <p className="font-semibold text-gray-200 mb-4">{interactive.question}</p>
                    <div className="space-y-2 mb-4">
                        {interactive.options.map((option, index) => {
                             let buttonClass = 'bg-gray-900/50 border-gray-600 hover:bg-gray-800/60';
                             if (answered) {
                                 if (option.isCorrect) buttonClass = 'bg-green-500/20 border-green-500 text-green-300';
                                 else if (selected === index) buttonClass = 'bg-red-500/20 border-red-500 text-red-300';
                                 else buttonClass = 'bg-gray-900/30 border-gray-700 text-gray-500';
                             }
                             return (
                                 <button
                                     key={index}
                                     onClick={() => handleSelect(index)}
                                     disabled={answered}
                                     className={`w-full text-left p-3 text-sm rounded-lg border transition-all duration-300 flex items-center gap-3 ${buttonClass}`}
                                 >
                                     <span className="font-mono text-purple-400">[{index + 1}]</span>
                                     <span>{option.text}</span>
                                 </button>
                             );
                        })}
                    </div>
                    {answered && (
                         <div className="p-3 bg-gray-900/50 rounded-md text-sm text-gray-300 animate-fade-in">
                            <p>{interactive.explanation}</p>
                        </div>
                    )}
                </div>

                {answered && (
                    <div className={`p-4 ${bgColor} border-l-4 ${borderColor} rounded-r-lg animate-fade-in`}>
                        <h5 className="font-bold text-gray-200 mb-2">Full Analysis: Why this {isGood ? 'Worked' : 'Failed'}</h5>
                        <ul className="space-y-2">
                            {analysis.map((point, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                    <div className={`mt-1 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isGood ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'}`}>
                                        {isGood ? <CheckIcon className="w-2 h-2" /> : <CloseIcon className="w-2 h-2" />}
                                    </div>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

interface ModuleProps {
    onBack: () => void;
}

export const RealWorldTeardowns: React.FC<ModuleProps> = ({ onBack }) => {
    return (
        <div className="space-y-8 animate-fade-in">
             <ModuleHeader
                onBack={onBack}
                title="Interactive Case Studies"
                subtitle="Theory is one thing, practice is another. Analyze these real-world emails and test your knowledge before we reveal the expert breakdown."
            />
            {caseStudies.map((cs, i) => <InteractiveCaseStudy key={i} caseStudy={cs} />)}
        </div>
    );
};

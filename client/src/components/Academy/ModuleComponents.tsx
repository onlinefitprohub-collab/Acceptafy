import { useState } from 'react';
import { BackArrowIcon } from '../icons/CategoryIcons';

export const ModuleHeader: React.FC<{ onBack: () => void; title: string; subtitle: string; }> = ({ onBack, title, subtitle }) => (
    <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-2 mt-1 sm:mt-0 text-gray-400 rounded-full hover:bg-white/10 hover:text-white transition-colors flex-shrink-0" data-testid="button-module-back">
            <BackArrowIcon className="w-6 h-6" />
        </button>
        <div>
            <h3 className="text-2xl font-bold text-gray-100">{title}</h3>
            <p className="text-gray-400 text-sm mt-1">{subtitle}</p>
        </div>
    </div>
);

export const ModuleCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-white/5 p-5 rounded-lg border border-white/10 text-left h-full flex flex-col group hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300"
        data-testid={`button-module-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
        <div className="text-purple-400 mb-3">{icon}</div>
        <h4 className="font-bold text-lg text-white mb-2 group-hover:text-purple-300 transition-colors">{title}</h4>
        <p className="text-sm text-gray-400 flex-grow">{description}</p>
        <div className="mt-4 text-sm font-semibold text-purple-400 group-hover:text-purple-200 transition-colors">
            Start Lesson &rarr;
        </div>
    </button>
);

export const SectionWrapper: React.FC<{ title: string, subtitle: string, children: React.ReactNode }> = ({ title, subtitle, children }) => (
     <div className="bg-white/5 p-4 sm:p-6 rounded-lg border border-white/10">
        <h4 className="text-xl font-bold text-gray-100">{title}</h4>
        <p className="text-purple-400 font-semibold mb-3">{subtitle}</p>
        <div className="space-y-3 text-gray-300 text-sm leading-relaxed border-t border-white/10 pt-3">
            {children}
        </div>
    </div>
);

export const InfoBox: React.FC<{ icon: React.ReactNode, children: React.ReactNode }> = ({ icon, children }) => (
    <div className="p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="text-purple-300 flex-shrink-0">{icon}</div>
        <div>{children}</div>
    </div>
);

export const KnowledgeCheck: React.FC<{ question: string; options: { text: string; isCorrect: boolean }[]; explanation: string; }> = ({ question, options, explanation }) => {
    const [selected, setSelected] = useState<number | null>(null);
    const [answered, setAnswered] = useState(false);

    const handleSelect = (index: number) => {
        if (answered) return;
        setSelected(index);
        setAnswered(true);
    };

    return (
        <div className="bg-white/5 p-4 sm:p-6 rounded-lg border-2 border-dashed border-white/10">
            <h4 className="text-lg font-bold text-purple-300 mb-3">Check Your Understanding</h4>
            <p className="font-semibold text-gray-200 mb-4">{question}</p>
            <div className="space-y-2 mb-4">
                {options.map((option, index) => {
                    let buttonClass = 'bg-gray-900/50 border-gray-600 hover:bg-gray-800/60 text-gray-200';
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
                            data-testid={`button-quiz-option-${index}`}
                        >
                            <span className="font-mono text-purple-400">[{index + 1}]</span>
                            <span>{option.text}</span>
                        </button>
                    );
                })}
            </div>
            {answered && (
                <div className="p-3 bg-gray-900/50 rounded-md text-sm text-gray-300 animate-fade-in">
                    <p className="font-bold text-gray-200">The Correct Answer:</p>
                    <p>{explanation}</p>
                </div>
            )}
        </div>
    );
};

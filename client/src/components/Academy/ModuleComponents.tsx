import { useState } from 'react';
import { BackArrowIcon } from '../icons/CategoryIcons';

export const ModuleHeader: React.FC<{ onBack: () => void; title: string; subtitle: string; }> = ({ onBack, title, subtitle }) => (
    <div className="flex items-start gap-4">
        <button onClick={onBack} className="p-2 mt-1 sm:mt-0 text-muted-foreground rounded-full hover:bg-muted hover:text-foreground transition-colors flex-shrink-0" data-testid="button-module-back">
            <BackArrowIcon className="w-6 h-6" />
        </button>
        <div>
            <h3 className="text-2xl font-bold text-foreground">{title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>
        </div>
    </div>
);

export const ModuleCard: React.FC<{ icon: React.ReactNode, title: string, description: string, onClick: () => void }> = ({ icon, title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="bg-card p-5 rounded-lg border border-border text-left h-full flex flex-col group hover:bg-muted hover:border-purple-500/50 transition-all duration-300"
        data-testid={`button-module-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
        <div className="text-purple-600 dark:text-purple-400 mb-3">{icon}</div>
        <h4 className="font-bold text-lg text-foreground mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors">{title}</h4>
        <p className="text-sm text-muted-foreground flex-grow">{description}</p>
        <div className="mt-4 text-sm font-semibold text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-200 transition-colors">
            Start Lesson &rarr;
        </div>
    </button>
);

export const SectionWrapper: React.FC<{ title: string, subtitle: string, children: React.ReactNode }> = ({ title, subtitle, children }) => (
     <div className="bg-card p-4 sm:p-6 rounded-lg border border-border">
        <h4 className="text-xl font-bold text-foreground">{title}</h4>
        <p className="text-purple-600 dark:text-purple-400 font-semibold mb-3">{subtitle}</p>
        <div className="space-y-3 text-muted-foreground text-sm leading-relaxed border-t border-border pt-3">
            {children}
        </div>
    </div>
);

export const InfoBox: React.FC<{ icon: React.ReactNode, children: React.ReactNode }> = ({ icon, children }) => (
    <div className="p-4 bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-500/50 rounded-lg flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="text-purple-600 dark:text-purple-300 flex-shrink-0">{icon}</div>
        <div className="text-foreground">{children}</div>
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

    const isCorrectAnswer = selected !== null && options[selected]?.isCorrect;

    return (
        <div className="bg-card p-4 sm:p-6 rounded-lg border-2 border-dashed border-border">
            <h4 className="text-lg font-bold text-purple-600 dark:text-purple-300 mb-3">Check Your Understanding</h4>
            <p className="font-semibold text-foreground mb-4">{question}</p>
            <div className="space-y-2 mb-4">
                {options.map((option, index) => {
                    let buttonClass = 'bg-muted border-border hover:bg-accent text-foreground';
                    if (answered) {
                        if (option.isCorrect) buttonClass = 'bg-green-100 dark:bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
                        else if (selected === index) buttonClass = 'bg-red-100 dark:bg-red-500/20 border-red-500 text-red-700 dark:text-red-300';
                        else buttonClass = 'bg-muted/50 border-border text-muted-foreground';
                    }
                    return (
                        <button
                            key={index}
                            onClick={() => handleSelect(index)}
                            disabled={answered}
                            className={`w-full text-left p-3 text-sm rounded-lg border transition-all duration-300 flex items-center gap-3 ${buttonClass}`}
                            data-testid={`button-quiz-option-${index}`}
                        >
                            <span className="font-mono text-purple-600 dark:text-purple-400">[{index + 1}]</span>
                            <span>{option.text}</span>
                        </button>
                    );
                })}
            </div>
            {answered && (
                <div className={`p-3 rounded-md text-sm animate-fade-in ${isCorrectAnswer ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/30' : 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-500/30'}`}>
                    <p className={`font-bold mb-1 ${isCorrectAnswer ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                        {isCorrectAnswer ? "That's correct!" : "Not quite right."}
                    </p>
                    <p className="text-muted-foreground">{explanation}</p>
                </div>
            )}
        </div>
    );
};

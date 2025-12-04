import { useState, useEffect } from 'react';

const defaultMessages = [
  "Checking for spam triggers...",
  "Analyzing subject line impact...",
  "Evaluating call-to-action clarity...",
  "Assessing personalization potential...",
  "Simulating A/B tests on your subject lines...",
  "Reviewing link reputation...",
  "Finalizing your inbox placement score...",
  "Almost there, just polishing the results!",
];

interface LoaderProps {
    messages?: string[];
}

export const Loader: React.FC<LoaderProps> = ({ messages = defaultMessages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    setCurrentMessageIndex(0);
    const intervalId = setInterval(() => {
      setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 2500);

    return () => clearInterval(intervalId);
  }, [messages]);

  return (
    <div className="mt-8 flex flex-col items-center justify-center space-y-4">
      <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg text-gray-400 text-center px-4">
        {messages[currentMessageIndex]}
      </p>
    </div>
  );
};

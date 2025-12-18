import { useState } from 'react';
import type { GradingResult } from '../types';
import { MonitorIcon, ChevronDownIcon, GmailIcon, OutlookIcon, AppleMailIcon, SunIcon, MoonIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface EmailClientPreviewProps {
  result: GradingResult;
  body: string;
}

type ClientType = 'gmail' | 'outlook' | 'apple_mail';

const ClientTab: React.FC<{
  client: ClientType;
  activeClient: ClientType;
  onClick: (client: ClientType) => void;
  children: React.ReactNode;
}> = ({ client, activeClient, onClick, children }) => {
  const isActive = client === activeClient;
  return (
    <button
      onClick={() => onClick(client)}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}
      data-testid={`button-client-${client}`}
    >
      {children}
    </button>
  );
};

const GmailPreview: React.FC<{ subject: string, previewText: string, body: string, isDark: boolean }> = ({ subject, previewText, body, isDark }) => (
  <div className={`dark-preview-container ${isDark ? 'dark' : ''} bg-[#f2f2f2] text-black rounded-lg p-3 font-sans text-sm`} data-testid="preview-gmail">
    <div className={`dark-preview-content ${isDark ? 'dark' : ''}`}>
      <div className="flex items-center gap-2 mb-4">
        <GmailIcon className="w-6 h-6 text-[#db4437] re-invert" />
        <span className="font-bold text-gray-700">Inbox</span>
      </div>
      <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold text-lg mr-3 re-invert">
            Y
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">Your Name</p>
            <p className="font-bold text-gray-600 truncate">{subject}</p>
            <p className="text-gray-500 truncate">{previewText} - {body.substring(0, 50)}...</p>
          </div>
        </div>
      </div>
      <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{subject}</h2>
        <div className="text-gray-700 whitespace-pre-wrap">{body}</div>
      </div>
    </div>
  </div>
);

const OutlookPreview: React.FC<{ subject: string, previewText: string, body: string, isDark: boolean }> = ({ subject, previewText, body, isDark }) => (
  <div className={`dark-preview-container ${isDark ? 'dark' : ''} bg-[#f3f2f1] text-black rounded-lg p-3 font-sans text-sm`} data-testid="preview-outlook">
    <div className={`dark-preview-content ${isDark ? 'dark' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
        <OutlookIcon className="w-6 h-6 text-[#0078d4] re-invert" />
        <span className="font-bold text-gray-800">Outlook</span>
        </div>
        <div className="bg-white p-3 shadow-sm border-l-4 border-blue-500 re-invert">
        <p className="font-semibold text-gray-800">Your Name</p>
        <p className="font-semibold text-gray-700">{subject}</p>
        <p className="text-gray-600 truncate">{previewText}...</p>
        </div>
        <div className="mt-4 p-4 bg-white border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Calibri, sans-serif' }}>{subject}</h2>
        <p className="text-xs text-gray-600 mb-4" style={{ fontFamily: 'Calibri, sans-serif' }}>From: Your Name &lt;you@yourdomain.com&gt;</p>
        <div className="text-gray-800 whitespace-pre-wrap" style={{ fontFamily: 'Calibri, sans-serif' }}>{body}</div>
        </div>
    </div>
  </div>
);

const AppleMailPreview: React.FC<{ subject: string, previewText: string, body: string, isDark: boolean }> = ({ subject, previewText, body, isDark }) => (
  <div className={`dark-preview-container ${isDark ? 'dark' : ''} bg-[#fafafa] text-black rounded-lg p-3 font-sans text-sm`} data-testid="preview-apple-mail">
    <div className={`dark-preview-content ${isDark ? 'dark' : ''}`}>
        <div className="flex items-center gap-2 mb-4">
        <AppleMailIcon className="w-6 h-6 text-blue-500 re-invert" />
        <span className="font-bold text-gray-800">Mail</span>
        </div>
        <div className="bg-white p-3 border-b border-gray-200">
        <p className="font-semibold text-gray-900">Your Name</p>
        <p className="font-semibold text-gray-800">{subject}</p>
        <p className="text-gray-600 truncate">{previewText}...</p>
        </div>
        <div className="mt-4 p-4 bg-white">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{subject}</h2>
        <div className="text-gray-800 whitespace-pre-wrap text-base" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>{body}</div>
        </div>
    </div>
  </div>
);

const DarkModeToggle: React.FC<{ isDark: boolean; setIsDark: (isDark: boolean) => void }> = ({ isDark, setIsDark }) => (
    <div className="flex items-center gap-2 p-1 rounded-lg bg-muted border border-border">
        <button
            onClick={() => setIsDark(false)}
            className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 transition-colors ${!isDark ? 'bg-background text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            data-testid="button-preview-light"
        >
            <SunIcon className="w-4 h-4" /> Light
        </button>
        <button
            onClick={() => setIsDark(true)}
            className={`px-3 py-1 text-sm rounded-md flex items-center gap-2 transition-colors ${isDark ? 'bg-purple-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}
            data-testid="button-preview-dark"
        >
            <MoonIcon className="w-4 h-4" /> Dark
        </button>
    </div>
);


export const EmailClientPreview: React.FC<EmailClientPreviewProps> = ({ result, body }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeClient, setActiveClient] = useState<ClientType>('gmail');
  const [isDark, setIsDark] = useState(false);

  const winner = result.subjectLineAnalysis?.find(v => v.isWinner) || result.subjectLineAnalysis?.[0];

  if (!winner) {
    return null;
  }

  const renderPreview = () => {
    switch (activeClient) {
      case 'gmail':
        return <GmailPreview subject={winner.subject} previewText={winner.previewText} body={body} isDark={isDark} />;
      case 'outlook':
        return <OutlookPreview subject={winner.subject} previewText={winner.previewText} body={body} isDark={isDark} />;
      case 'apple_mail':
        return <AppleMailPreview subject={winner.subject} previewText={winner.previewText} body={body} isDark={isDark} />;
      default:
        return null;
    }
  };

  return (
    <div className="mt-8 bg-card border border-border rounded-2xl shadow-lg" data-testid="email-client-preview">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-email-preview"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400"><MonitorIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Email Client Preview</h3>
          <InfoTooltip text="Simulates how your email will appear in popular inboxes like Gmail and Outlook. This helps catch formatting issues before you send." />
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="border-t border-border pt-4 mt-4">
              <p className="text-sm text-muted-foreground mb-4">See how your email will look in popular inboxes. Note: This is a simulation for formatting and may not be pixel-perfect.</p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2 border border-border p-1 rounded-lg bg-muted w-full sm:w-auto">
                    <ClientTab client="gmail" activeClient={activeClient} onClick={setActiveClient}>
                        <GmailIcon className="w-4 h-4" /> Gmail
                    </ClientTab>
                    <ClientTab client="outlook" activeClient={activeClient} onClick={setActiveClient}>
                        <OutlookIcon className="w-4 h-4" /> Outlook
                    </ClientTab>
                    <ClientTab client="apple_mail" activeClient={activeClient} onClick={setActiveClient}>
                        <AppleMailIcon className="w-4 h-4" /> Apple Mail
                    </ClientTab>
                </div>
                <DarkModeToggle isDark={isDark} setIsDark={setIsDark} />
              </div>
              <div className="transition-all duration-300">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

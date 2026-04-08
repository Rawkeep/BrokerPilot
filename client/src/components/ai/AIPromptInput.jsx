import { useState } from 'react';
import { GlassButton } from '../ui/GlassButton.jsx';
import { de } from '../../i18n/de.js';

/**
 * AIPromptInput — Textarea input with send button for AI prompts.
 * Enter to send, Shift+Enter for newline. Disabled when loading.
 *
 * @param {{onSend: (message: string) => void, isLoading: boolean}} props
 */
export function AIPromptInput({ onSend, isLoading }) {
  const [input, setInput] = useState('');
  const t = de.pages.aiAgents;

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ai-prompt-input">
      <textarea
        className="glass-input ai-prompt-input__textarea"
        placeholder={t.inputPlaceholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={3}
      />
      <GlassButton
        variant="primary"
        onClick={handleSend}
        disabled={isLoading || !input.trim()}
        className="ai-prompt-input__send"
      >
        {isLoading ? de.common.loading : t.sendTest}
      </GlassButton>
    </div>
  );
}

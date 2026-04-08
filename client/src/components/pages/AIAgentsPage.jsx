import { GlassCard } from '../ui/GlassCard.jsx';
import { AIResponsePanel } from '../ai/AIResponsePanel.jsx';
import { de } from '../../i18n/de.js';

export function AIAgentsPage() {
  const t = de.pages.aiAgents;
  return (
    <div>
      <h1>{t.title}</h1>
      <p className="page-subtitle">{t.subtitle}</p>

      <div className="ai-agents-sections">
        {/* AI Connection Test */}
        <section>
          <h2 className="ai-agents-section__title">{t.testSection}</h2>
          <p className="ai-agents-section__description">{t.testDescription}</p>
          <AIResponsePanel />
        </section>

        {/* Future Agents Placeholder */}
        <section>
          <GlassCard hoverable={false}>
            <p className="ai-agents-placeholder">{t.agentsPlaceholder}</p>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}

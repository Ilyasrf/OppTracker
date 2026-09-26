import { useState, type ReactNode } from 'react'
import OpportunityAnalyzer from '../components/ai/OpportunityAnalyzer'
import CoverLetterGenerator from '../components/ai/CoverLetterGenerator'
import ScamDetector from '../components/ai/ScamDetector'
import SmartChat from '../components/ai/SmartChat'

const tabs = [
  {
    id: 'analyze',
    label: 'Capture details',
    note: 'Turn a description into a draft'
  },
  {
    id: 'cover',
    label: 'Write a letter',
    note: 'Shape a personal first draft'
  },
  {
    id: 'chat',
    label: 'Plan with AI',
    note: 'Talk through your next step'
  },
  {
    id: 'scam',
    label: 'Check the signs',
    note: 'Review possible warning signs'
  }
] as const

type TabId = (typeof tabs)[number]['id']

function ToolSketch({ tool }: { tool: TabId }) {
  const drawings: Record<TabId, ReactNode> = {
    analyze: (
      <>
        <path d="M6 3.5h9l3 3V20H6z" />
        <path d="M15 3.5V7h3M9 11h6M9 15h4" />
      </>
    ),
    cover: (
      <>
        <path d="M3.5 6.5h17v12h-17z" />
        <path d="m4.5 8 7.5 5.5L19.5 8" />
      </>
    ),
    chat: (
      <>
        <path d="M4 5h16v11H9l-4.5 3 .8-3H4z" />
        <path d="M8 9.5h8M8 12.5h5" />
      </>
    ),
    scam: (
      <>
        <path d="M12 3.5 19 6v5.3c0 4.1-2.8 7.4-7 9.2-4.2-1.8-7-5.1-7-9.2V6z" />
        <path d="M9.2 12.1 11 14l4-4.2" />
      </>
    )
  }

  return (
    <span className="ai-tool-sketch" aria-hidden="true">
      <svg viewBox="0 0 24 24">{drawings[tool]}</svg>
    </span>
  )
}

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState<TabId>('chat')

  return (
    <div className="ai-workbench">
      <header className="ai-workbench-heading">
        <div>
          <p className="eyebrow">AI workbench / pick a tool</p>
          <h1>
            A little help with the <span className="marked">next step.</span>
          </h1>
          <p className="subtitle">
            Draft, think, and prepare with AI. Relevant opportunity and profile
            details are shared with Google Gemini when you ask for help.
          </p>
        </div>
        <p className="handwritten ai-margin-note" aria-hidden="true">
          choose a page &amp; begin
        </p>
      </header>

      <div className="ai-tool-tabs" role="tablist" aria-label="AI tools">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`ai-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`ai-panel-${tab.id}`}
            onClick={() => setActiveTab(tab.id)}
            className="ai-tool-tab"
          >
            <ToolSketch tool={tab.id} />
            <span>
              <strong>{tab.label}</strong>
              <small>{tab.note}</small>
            </span>
          </button>
        ))}
      </div>

      <section className="ai-tool-sheet">
        <div
          id="ai-panel-analyze"
          role="tabpanel"
          aria-labelledby="ai-tab-analyze"
          hidden={activeTab !== 'analyze'}
        >
          <OpportunityAnalyzer />
        </div>
        <div
          id="ai-panel-cover"
          role="tabpanel"
          aria-labelledby="ai-tab-cover"
          hidden={activeTab !== 'cover'}
        >
          <CoverLetterGenerator />
        </div>
        <div
          id="ai-panel-chat"
          role="tabpanel"
          aria-labelledby="ai-tab-chat"
          hidden={activeTab !== 'chat'}
        >
          <SmartChat />
        </div>
        <div
          id="ai-panel-scam"
          role="tabpanel"
          aria-labelledby="ai-tab-scam"
          hidden={activeTab !== 'scam'}
        >
          <ScamDetector />
        </div>
      </section>
    </div>
  )
}

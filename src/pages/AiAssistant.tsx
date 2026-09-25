import { useState } from 'react'
import OpportunityAnalyzer from '../components/ai/OpportunityAnalyzer'
import CoverLetterGenerator from '../components/ai/CoverLetterGenerator'
import ScamDetector from '../components/ai/ScamDetector'
import SmartChat from '../components/ai/SmartChat'

const tabs = [
  { id: 'analyze', label: 'Capture a draft' },
  { id: 'cover', label: 'Cover Letter' },
  { id: 'chat', label: 'Smart Chat' },
  { id: 'scam', label: 'Risk review' }
] as const

type TabId = (typeof tabs)[number]['id']

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState<TabId>('chat')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-ink">
          A little help with the next step.
        </h1>
        <p className="mt-1 text-gray-400">
          Draft, think, and prepare with AI. Requests share the relevant
          opportunity details and profile information with Google Gemini.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            aria-pressed={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`filter-tab flex items-center gap-2 ${activeTab === tab.id ? 'selected' : ''}`}
          >
            <span className="font-mono text-[10px]" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        <div hidden={activeTab !== 'analyze'}>
          <OpportunityAnalyzer />
        </div>
        <div hidden={activeTab !== 'cover'}>
          <CoverLetterGenerator />
        </div>
        <div hidden={activeTab !== 'chat'}>
          <SmartChat />
        </div>
        <div hidden={activeTab !== 'scam'}>
          <ScamDetector />
        </div>
      </div>
    </div>
  )
}

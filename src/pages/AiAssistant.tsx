import { useState } from 'react'
import OpportunityAnalyzer from '../components/ai/OpportunityAnalyzer'
import CoverLetterGenerator from '../components/ai/CoverLetterGenerator'
import ScamDetector from '../components/ai/ScamDetector'
import SmartChat from '../components/ai/SmartChat'

const tabs = [
  { id: 'analyze', label: 'Analyze URL', icon: '🔍' },
  { id: 'cover', label: 'Cover Letter', icon: '📝' },
  { id: 'chat', label: 'Smart Chat', icon: '💬' },
  { id: 'scam', label: 'Scam Detector', icon: '🛡️' },
] as const

type TabId = typeof tabs[number]['id']

export default function AiAssistant() {
  const [activeTab, setActiveTab] = useState<TabId>('chat')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Assistant</h1>
        <p className="mt-1 text-gray-400">Powered by Google Gemini</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-accent text-white shadow-lg shadow-accent/20'
                : 'border border-dark-border bg-dark-card text-gray-400 hover:text-white hover:border-accent/30'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'analyze' && <OpportunityAnalyzer />}
        {activeTab === 'cover' && <CoverLetterGenerator />}
        {activeTab === 'chat' && <SmartChat />}
        {activeTab === 'scam' && <ScamDetector />}
      </div>
    </div>
  )
}

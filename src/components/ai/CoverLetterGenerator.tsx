import { useState } from 'react'
import { useGemini, saveProfile, type UserProfile } from '../../hooks/useGemini'
import { useOpportunities } from '../../hooks/useOpportunities'
import { FUNDING_LABELS, CATEGORY_LABELS } from '../../lib/types'

export default function CoverLetterGenerator() {
  const { loading, error, generateCoverLetter } = useGemini()
  const { opportunities } = useOpportunities()
  const [selectedId, setSelectedId] = useState('')
  const [extraContext, setExtraContext] = useState('')
  const [letter, setLetter] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('user_profile')
    return saved ? JSON.parse(saved) : { name: '', email: '', skills: '', background: '', interests: '' }
  })

  const selected = opportunities.find(o => o.id === selectedId)

  const handleGenerate = async () => {
    if (!selected) return
    const result = await generateCoverLetter(selected, extraContext || undefined)
    if (result) setLetter(result)
  }

  const handleSaveProfile = () => {
    saveProfile(profile)
    setShowProfile(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(letter)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-mono text-lg font-semibold text-white">Cover Letter Generator</h3>
          <p className="mt-1 text-sm text-gray-400">Generate a personalized cover letter for any opportunity</p>
        </div>
        <button
          onClick={() => setShowProfile(!showProfile)}
          className="rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-400 hover:text-white"
        >
          {showProfile ? 'Hide Profile' : 'Edit Profile'}
        </button>
      </div>

      {showProfile && (
        <div className="rounded-xl border border-dark-border bg-dark-card p-4 backdrop-blur-sm space-y-3">
          <p className="text-xs font-medium text-gray-400">Your profile helps generate better letters</p>
          <input
            type="text"
            placeholder="Your name"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <textarea
            placeholder="Your background (education, experience)"
            value={profile.background}
            onChange={e => setProfile(p => ({ ...p, background: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <textarea
            placeholder="Your skills (technical and soft skills)"
            value={profile.skills}
            onChange={e => setProfile(p => ({ ...p, skills: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <textarea
            placeholder="Your interests and goals"
            value={profile.interests}
            onChange={e => setProfile(p => ({ ...p, interests: e.target.value }))}
            rows={2}
            className="w-full rounded-lg border border-dark-border bg-dark px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
          />
          <button
            onClick={handleSaveProfile}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
          >
            Save Profile
          </button>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Select Opportunity</label>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white outline-none focus:border-accent/50"
        >
          <option value="">Choose an opportunity...</option>
          {opportunities.map(o => (
            <option key={o.id} value={o.id}>{o.title}</option>
          ))}
        </select>
      </div>

      {selected && (
        <div className="rounded-lg border border-dark-border bg-dark/50 p-3 text-xs text-gray-400">
          {CATEGORY_LABELS[selected.category]} · {FUNDING_LABELS[selected.funding_type]} · {selected.location || 'N/A'}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-300">Additional Context (optional)</label>
        <textarea
          value={extraContext}
          onChange={e => setExtraContext(e.target.value)}
          rows={2}
          placeholder="Any specific points you want to highlight..."
          className="w-full rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50"
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !selected}
        className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent/90 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Generate Cover Letter'}
      </button>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {letter && (
        <div className="rounded-xl border border-dark-border bg-dark-card p-6 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-400">Generated Cover Letter</h4>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-400 hover:text-white"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
            {letter}
          </div>
        </div>
      )}
    </div>
  )
}

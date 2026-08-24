import { useState, useRef, useEffect } from 'react'
import { useGemini, type ChatMessage } from '../../hooks/useGemini'
import { useOpportunities } from '../../hooks/useOpportunities'
import ChatMessageComponent from './ChatMessage'

export default function SmartChat() {
  const { loading, error, chat } = useGemini()
  const { opportunities } = useOpportunities()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')

    const reply = await chat(text, opportunities, messages)
    if (reply) {
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMsg])
    }
  }

  const suggestions = [
    'What fully funded opportunities do I have?',
    'Which deadlines are coming up soon?',
    'What should I apply to next?',
    'Summarize my application status',
  ]

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="mb-4">
        <h3 className="font-mono text-lg font-semibold text-white">Smart Chat</h3>
        <p className="mt-1 text-sm text-gray-400">Ask anything about your opportunities</p>
      </div>

      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-accent/10">
              <svg className="h-8 w-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-gray-400">Ask me anything about your opportunities</p>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); }}
                  className="rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-accent/30 hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-2 space-y-1">
        {messages.map(msg => (
          <ChatMessageComponent
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Ask about your opportunities..."
          disabled={loading}
          className="flex-1 rounded-lg border border-dark-border bg-dark-card px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-accent/50 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

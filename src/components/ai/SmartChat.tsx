import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useGemini } from '../../hooks/useGemini'
import { useOpportunities } from '../../hooks/useOpportunities'
import { useNotebook, type NotebookRow } from '../../hooks/useNotebook'
import { useAuth } from '../../contexts/AuthContext'
import { downloadFile } from '../../lib/notifications'
import ChatMessageComponent from './ChatMessage'

interface Conversation extends NotebookRow {
  title: string
  messages: {
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }[]
}

export default function SmartChat() {
  const { user } = useAuth()
  const location = useLocation()
  const { error: aiError, chat, clearError } = useGemini()
  const {
    opportunities,
    loading: opportunitiesLoading,
    error: opportunitiesError
  } = useOpportunities()
  const { rows, loading, error, refresh, save } =
    useNotebook<Conversation>('ai_conversations')
  const [active, setActive] = useState<Conversation | null>(null)
  const [pending, setPending] = useState(false)
  const [busy, setBusy] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [input, setInput] = useState(
    typeof location.state?.prompt === 'string'
      ? location.state.prompt.slice(0, 10000)
      : ''
  )
  const [search, setSearch] = useState('')
  const lock = useRef(false)
  const end = useRef<HTMLDivElement>(null)
  const recoveryKey = `oppnote-chat-draft:${user?.id}`

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(recoveryKey)
      if (stored) {
        const draft = JSON.parse(stored) as Conversation
        if (draft.user_id === user?.id && Array.isArray(draft.messages)) {
          setActive(draft)
          setPending(true)
          setSaveError(
            'Recovered an unsaved conversation. Retry saving or export it before leaving.'
          )
        }
      }
    } catch {
      setSaveError(
        'Could not restore the unsaved conversation from this browser.'
      )
    }
  }, [recoveryKey, user?.id])

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
  }, [active?.messages.length])
  useEffect(() => {
    if (!pending && !busy) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [pending, busy])

  async function persist(draft: Conversation) {
    setActive(draft)
    setPending(true)
    try {
      sessionStorage.setItem(recoveryKey, JSON.stringify(draft))
    } catch {
      /* The visible draft remains available for export. */
    }
    const saved = await save(draft)
    setActive(saved)
    setPending(false)
    try {
      sessionStorage.removeItem(recoveryKey)
    } catch {
      /* Storage can be disabled. */
    }
    return saved
  }

  async function send(retry = false) {
    if (
      lock.current ||
      !user ||
      loading ||
      error ||
      pending ||
      opportunitiesLoading ||
      opportunitiesError
    )
      return
    const text = retry ? active?.messages.at(-1)?.content : input.trim()
    if (!text || (active?.messages.length || 0) >= (retry ? 200 : 199)) return
    lock.current = true
    setBusy(true)
    setSaveError('')
    try {
      let current = active || {
        id: crypto.randomUUID(),
        user_id: user.id,
        updated_at: '',
        title: Array.from(text).slice(0, 120).join(''),
        messages: []
      }
      if (!retry) {
        current = await persist({
          ...current,
          messages: [
            ...current.messages,
            {
              id: crypto.randomUUID(),
              role: 'user',
              content: text,
              timestamp: new Date().toISOString()
            }
          ]
        })
        setInput('')
      }
      const history = current.messages.slice(0, -1).map((message) => ({
        ...message,
        timestamp: new Date(message.timestamp)
      }))
      const reply = await chat(text, opportunities, history)
      if (reply)
        await persist({
          ...current,
          messages: [
            ...current.messages,
            {
              id: crypto.randomUUID(),
              role: 'assistant',
              content: reply,
              timestamp: new Date().toISOString()
            }
          ]
        })
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Could not save this conversation.'
      )
    } finally {
      lock.current = false
      setBusy(false)
    }
  }

  const messages = active?.messages || []
  const needsReply = messages.at(-1)?.role === 'user'
  return (
    <div className="notebook-workspace">
      <aside
        className="paper-panel notebook-sidebar"
        aria-label="Conversation history"
      >
        <div className="section-heading">
          <h2>Conversations</h2>
          <span className="handwritten text-2xl">saved here</span>
        </div>
        <button
          className="button primary w-full"
          disabled={busy || pending}
          onClick={() => {
            setActive(null)
            setInput('')
            setSaveError('')
            clearError()
          }}
        >
          + New chat
        </button>
        <label className="block mt-5">
          Search conversations
          <input
            className="w-full mt-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
          />
        </label>
        {loading && (
          <p role="status" className="subtitle">
            Loading history…
          </p>
        )}
        {error && (
          <div className="error-notice mt-4" role="alert">
            {error}
            <button
              className="text-link block mt-2"
              onClick={() => void refresh()}
            >
              Retry history
            </button>
          </div>
        )}
        {!loading && !error && !rows.length && (
          <p className="empty-note">
            Your first conversation starts a new page.
          </p>
        )}
        <div className="conversation-list">
          {rows
            .filter((row) =>
              row.title.toLowerCase().includes(search.toLowerCase())
            )
            .map((row) => (
              <button
                key={row.id}
                className={`conversation-item ${active?.id === row.id ? 'selected' : ''}`}
                disabled={busy || pending}
                aria-pressed={active?.id === row.id}
                onClick={() => {
                  setActive(row)
                  setInput('')
                  setSaveError('')
                  clearError()
                }}
              >
                <strong>{row.title}</strong>
                <span>
                  {new Date(row.updated_at).toLocaleDateString()} ·{' '}
                  {row.messages.length} messages
                </span>
              </button>
            ))}
        </div>
        <p className="field-hint">
          Saved to your account across devices. Each conversation holds up to
          200 messages (2 MB); the assistant uses the latest 10 for context.
        </p>
      </aside>
      <section className="paper-panel chat-workspace" aria-label="Smart Chat">
        <div className="section-heading">
          <h2>{active?.title || 'A fresh page.'}</h2>
          {active && (
            <button
              className="text-link"
              onClick={() =>
                downloadFile(
                  'oppnote-conversation.json',
                  JSON.stringify(active, null, 2),
                  'application/json'
                )
              }
            >
              Export chat
            </button>
          )}
        </div>
        {!messages.length && (
          <div className="empty-note">
            <p className="handwritten text-4xl">What’s your next step?</p>
            <p className="mt-4">
              Talk through an application, study plan, or interview.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {[
                'Which deadlines are coming up soon?',
                'Help me prepare for a job interview',
                'Help me plan my certificate study'
              ].map((text) => (
                <button
                  key={text}
                  className="filter-tab"
                  onClick={() => setInput(text)}
                >
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="chat-scroll" aria-live="polite">
          {messages.map((message) => (
            <ChatMessageComponent
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={new Date(message.timestamp)}
            />
          ))}
          {busy && (
            <p role="status" className="subtitle">
              Saving / thinking…
            </p>
          )}
          <div ref={end} />
        </div>
        {(saveError || aiError || opportunitiesError) && (
          <div role="alert" className="error-notice">
            {saveError || aiError || opportunitiesError}
          </div>
        )}
        {pending && (
          <button
            className="button mt-3"
            disabled={busy}
            onClick={async () => {
              if (!active || lock.current) return
              lock.current = true
              setBusy(true)
              setSaveError('')
              try {
                await persist(active)
                setInput('')
              } catch (err) {
                setSaveError(
                  err instanceof Error ? err.message : 'Could not save.'
                )
              } finally {
                lock.current = false
                setBusy(false)
              }
            }}
          >
            Retry saving conversation
          </button>
        )}
        {pending && (
          <button
            className="text-link mt-3 self-start"
            disabled={busy}
            onClick={() => {
              if (
                !window.confirm(
                  'Discard the unsaved draft and reload saved conversations? Export the chat first if you want to keep this draft.'
                )
              )
                return
              try {
                sessionStorage.removeItem(recoveryKey)
              } catch {
                /* Storage may be disabled. */
              }
              setPending(false)
              setActive(null)
              setInput('')
              setSaveError('')
              void refresh()
            }}
          >
            Discard draft & reload saved history
          </button>
        )}
        {needsReply && !pending && (
          <button
            className="text-link mt-3 self-start"
            disabled={busy || loading || !!error}
            onClick={() => void send(true)}
          >
            Get a reply to the last message
          </button>
        )}
        {messages.length >= 200 && (
          <p className="field-hint">
            This page is full. Start a new chat to continue; this history stays
            saved.
          </p>
        )}
        <form
          className="flex gap-2 mt-4"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <input
            className="min-w-0 flex-1"
            aria-label="Message to your assistant"
            maxLength={10000}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask, plan, prepare…"
            disabled={busy || pending}
          />
          <button
            className="button primary"
            aria-label="Send message"
            disabled={
              busy ||
              pending ||
              loading ||
              !!error ||
              opportunitiesLoading ||
              !!opportunitiesError ||
              !input.trim() ||
              messages.length >= 199
            }
          >
            Send
          </button>
        </form>
        <p className="field-hint">
          {pending
            ? 'Unsaved draft — retry saving before leaving.'
            : active
              ? 'Conversation saved to your account.'
              : 'Your conversation is saved when you send a message.'}
        </p>
      </section>
    </div>
  )
}

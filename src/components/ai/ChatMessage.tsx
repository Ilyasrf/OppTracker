import React, { useMemo } from 'react'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

function parseMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-1 ml-4 list-disc space-y-0.5 text-sm text-gray-200">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
          ))}
        </ul>
      )
      listItems = []
    }
  }

  const formatInline = (text: string): string => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="rounded bg-dark px-1 py-0.5 text-xs text-accent">$1</code>')
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // Headers
    if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={i} className="mb-1 mt-3 font-mono text-sm font-bold text-white">
          {trimmed.slice(4)}
        </h4>
      )
    } else if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={i} className="mb-1 mt-3 font-mono text-base font-bold text-white">
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.startsWith('# ')) {
      flushList()
      elements.push(
        <h2 key={i} className="mb-1 mt-3 font-mono text-lg font-bold text-white">
          {trimmed.slice(2)}
        </h2>
      )
    }
    // List items
    else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s/, ''))
    }
    // Empty line
    else if (trimmed === '') {
      flushList()
      if (elements.length > 0) {
        elements.push(<div key={i} className="h-2" />)
      }
    }
    // Regular text
    else {
      flushList()
      elements.push(
        <p
          key={i}
          className="text-sm leading-relaxed text-gray-200"
          dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }}
        />
      )
    }
  })

  flushList()
  return elements
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user'

  const rendered = useMemo(() => {
    if (isUser) return null
    return parseMarkdown(content)
  }, [content, isUser])

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-accent text-white rounded-br-md'
          : 'bg-dark-card border border-dark-border text-gray-200 rounded-bl-md'
      }`}>
        {!isUser && (
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-accent/20 text-accent">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-xs font-medium text-accent">AI Assistant</span>
          </div>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        ) : (
          <div className="space-y-0">{rendered}</div>
        )}
        <p className={`mt-2 text-xs ${isUser ? 'text-blue-200' : 'text-gray-500'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

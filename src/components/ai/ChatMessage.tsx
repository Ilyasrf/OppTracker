import type { ReactNode } from 'react'

function inline(text: string): ReactNode[] {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .map((part, i) =>
      part.startsWith('**') ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : part.startsWith('`') ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : (
        part
      )
    )
}

export default function ChatMessage({
  role,
  content,
  timestamp
}: {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}) {
  return (
    <article className={`chat-message ${role}`}>
      <p className="eyebrow">{role === 'user' ? 'You' : 'Your assistant'}</p>
      <div className="space-y-2">
        {content.split('\n').map((line, i) => (
          <p key={i} className="whitespace-pre-wrap break-words">
            {inline(line.replace(/^#{1,6} /, ''))}
          </p>
        ))}
      </div>
      <time className="mt-3 block text-xs text-gray-500">
        {timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </time>
    </article>
  )
}

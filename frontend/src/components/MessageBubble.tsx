interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
}

export function MessageBubble({ role, content }: MessageBubbleProps) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
          isAssistant
            ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
            : 'bg-brand text-white rounded-tr-sm'
        }`}
        role="article"
        aria-label={isAssistant ? 'NavyaSathi says' : 'You said'}
      >
        {content}
      </div>
    </div>
  )
}

interface MessageBubbleProps {
  role: 'user' | 'assistant'
  content: string
  onSpeak?: () => void
  speaking?: boolean
}

export function MessageBubble({ role, content, onSpeak, speaking }: MessageBubbleProps) {
  const isAssistant = role === 'assistant'

  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`flex flex-col gap-1 max-w-[80%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
            isAssistant
              ? 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
              : 'bg-brand text-white rounded-tr-sm'
          }`}
          role="article"
          aria-label={isAssistant ? 'NavyaSathi says' : 'You said'}
        >
          {content}
        </div>
        {isAssistant && onSpeak && (
          <button
            onClick={onSpeak}
            aria-label={speaking ? 'Speaking…' : 'Read aloud'}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full transition-colors min-h-[32px] ${
              speaking
                ? 'text-brand bg-brand/10 animate-pulse'
                : 'text-gray-400 hover:text-brand hover:bg-gray-100'
            }`}
          >
            <SpeakerIcon />
            {speaking ? '…' : ''}
          </button>
        )}
      </div>
    </div>
  )
}

function SpeakerIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
      <path d="M10.5 3.75a.75.75 0 00-1.264-.546L5.203 7H2.667a.75.75 0 00-.7.48A6.985 6.985 0 002 10c0 .887.165 1.737.468 2.52.111.29.39.48.7.48h2.535l4.033 3.796A.75.75 0 0010.5 16.25V3.75zM13.5 6.75a.75.75 0 00-1.06 1.06A3.5 3.5 0 0113.5 10a3.5 3.5 0 01-1.06 2.19.75.75 0 101.06 1.06A5 5 0 0015 10a5 5 0 00-1.5-3.25zm2.03-2.03a.75.75 0 10-1.06 1.061A6.5 6.5 0 0116.5 10a6.5 6.5 0 01-2.03 4.719.75.75 0 101.061 1.06A8 8 0 0018 10a8 8 0 00-2.47-5.78z" />
    </svg>
  )
}

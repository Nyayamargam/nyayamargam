import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageBubble } from '../components/MessageBubble'
import { VoiceInput } from '../components/VoiceInput'
import { type CaseMessage, api } from '../services/api'
import { type SarvamLanguage } from '../services/sarvam'

function ReasoningChip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="ml-3 mb-3 -mt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs text-gray-400 hover:text-brand flex items-center gap-1 transition-colors"
      >
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
        Why am I being asked this?
      </button>
      {open && (
        <p className="mt-1.5 text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 max-w-xs leading-relaxed">
          {text}
        </p>
      )}
    </div>
  )
}

const LANG_TO_SARVAM: Record<string, SarvamLanguage> = {
  en: 'en-IN',
  hi: 'hi-IN',
  te: 'te-IN',
}

export function Intake() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<CaseMessage[]>([])
  const [reasonings, setReasonings] = useState<Record<number, string>>({})
  const [textInput, setTextInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<string>(localStorage.getItem('navyasathi_lang') || 'en')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load or create case on mount
  useEffect(() => {
    if (!code) return
    ;(async () => {
      try {
        const caseData = await api.getCase(code)
        setMessages(caseData.messages)
        setLang(caseData.language)
      } catch {
        setError('Could not load this case. The code may be invalid.')
      }
    })()
  }, [code])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function submit(content: string) {
    if (!content.trim() || !code || sending) return
    setSending(true)
    setError('')

    // Capture indices before any state mutations so they're stable across the await
    const assistantIndex = messages.length + 1

    const optimistic: CaseMessage = { role: 'user', content, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, optimistic])
    setTextInput('')

    try {
      const res = await api.sendMessage(code, content, lang)
      const assistantMsg: CaseMessage = {
        role: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      if (res.reasoning) {
        setReasonings((prev) => ({ ...prev, [assistantIndex]: res.reasoning }))
      }
      if (res.intake_complete) {
        setTimeout(() => navigate(`/case/${code}`), 1800)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit(textInput)
    }
  }

  const sarvamLang = LANG_TO_SARVAM[lang] ?? 'en-IN'

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand text-white px-4 py-3 flex items-center gap-3 shadow">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="text-white/80 hover:text-white"
        >
          ←
        </button>
        <div>
          <p className="font-semibold text-sm">NavyaSathi</p>
          {code && (
            <p className="text-xs text-blue-200 font-mono tracking-wider">Case #{code}</p>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-label="Conversation">
        {messages.map((m, i) => (
          <div key={i}>
            <MessageBubble role={m.role} content={m.content} />
            {m.role === 'assistant' && reasonings[i] && (
              <ReasoningChip text={reasonings[i]} />
            )}
          </div>
        ))}
        {sending && (
          <div className="flex justify-start mb-3">
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
              <span className="text-gray-400 text-sm animate-pulse">NavyaSathi is thinking…</span>
            </div>
          </div>
        )}
        {error && (
          <p className="text-center text-sm text-red-500 my-2" role="alert">{error}</p>
        )}
        <div ref={bottomRef} />
      </main>

      {/* Input bar */}
      <footer className="bg-white border-t border-gray-100 px-4 py-3 flex items-end gap-2 shadow-sm">
        <VoiceInput
          language={sarvamLang}
          onConfirm={submit}
          disabled={sending}
        />
        <textarea
          className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand max-h-32"
          rows={1}
          placeholder="Type your answer…"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          aria-label="Your answer"
        />
        <button
          onClick={() => submit(textInput)}
          disabled={sending || !textInput.trim()}
          aria-label="Send message"
          className="bg-brand text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-brand-dark transition-colors disabled:opacity-40"
        >
          <SendIcon />
        </button>
      </footer>
    </div>
  )
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
    </svg>
  )
}

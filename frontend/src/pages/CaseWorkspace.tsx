import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { MessageBubble } from '../components/MessageBubble'
import { type CaseDetail, api } from '../services/api'

const STATUS_LABEL: Record<string, string> = {
  intake: 'Intake in progress',
  pending_docs: 'Awaiting documents',
  ready: 'Ready for action',
  closed: 'Closed',
}

const STATUS_COLOR: Record<string, string> = {
  intake: 'bg-yellow-100 text-yellow-800',
  pending_docs: 'bg-blue-100 text-blue-800',
  ready: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
}

export function CaseWorkspace() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<CaseDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code) return
    api
      .getCase(code)
      .then(setCaseData)
      .catch(() => setError('Could not load case. Please check the code.'))
  }, [code])

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => navigate('/')} className="text-brand underline">
          Go home
        </button>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse">Loading…</p>
      </div>
    )
  }

  const filledSlots = Object.entries(caseData.slots).filter(
    ([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand text-white px-4 py-4 shadow">
        <button
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="text-white/70 hover:text-white text-sm mb-1"
        >
          ← Home
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">Case Workspace</h1>
            <p className="text-blue-200 text-xs font-mono tracking-widest mt-0.5">#{caseData.code}</p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[caseData.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {STATUS_LABEL[caseData.status] ?? caseData.status}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        {/* Case details summary */}
        {filledSlots.length > 0 && (
          <section aria-label="Case details">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              What we recorded
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {filledSlots.map(([key, value]) => (
                <div key={key} className="flex justify-between px-4 py-3 gap-4">
                  <span className="text-sm text-gray-500 capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-900 font-medium text-right">
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conversation history */}
        <section aria-label="Conversation history">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Conversation
          </h2>
          <div className="flex flex-col">
            {caseData.messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
          </div>
        </section>

        {/* Continue intake if still active */}
        {caseData.status === 'intake' && (
          <button
            onClick={() => navigate(`/intake/${caseData.code}`)}
            className="w-full bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-dark transition-colors"
          >
            Continue Intake
          </button>
        )}

        {/* Phase 2 placeholder — document upload */}
        {caseData.status === 'pending_docs' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-700">
            <p className="font-medium mb-1">Documents needed</p>
            <p>Document upload will be available in the next update (Phase 2).</p>
          </div>
        )}
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCard } from '../components/AlertCard'
import { DocumentReviewCard } from '../components/DocumentReviewCard'
import { DocumentUpload } from '../components/DocumentUpload'
import { DraftDownloadButton } from '../components/DraftDownloadButton'
import { MessageBubble } from '../components/MessageBubble'
import { PushSubscriptionButton } from '../components/PushSubscriptionButton'
import { RejectionExplainerCard } from '../components/RejectionExplainerCard'
import { getT, setHtmlLang, type Lang } from '../i18n'
import { type CaseAlert, type CaseDetail, type DocumentRecord, api } from '../services/api'

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
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [alerts, setAlerts] = useState<CaseAlert[]>([])
  const [closing, setClosing] = useState(false)
  const [error, setError] = useState('')

  const lang = caseData?.language ?? localStorage.getItem('navyasathi_lang') ?? 'en'
  const t = getT(lang)

  useEffect(() => {
    if (!code) return
    api.getCase(code).then((c) => {
      setCaseData(c)
      setAlerts((c.alerts ?? []).filter((a) => !a.dismissed))
      setHtmlLang((c.language || 'en') as Lang)
    }).catch(() => setError(t.errorLoadCase))
    api.getDocuments(code).then(setDocuments).catch(() => {})
  }, [code]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleClose() {
    if (!code) return
    setClosing(true)
    try {
      await api.closeCase(code)
      setCaseData((prev) => prev ? { ...prev, status: 'closed' } : prev)
    } finally {
      setClosing(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <p className="text-red-500 mb-4" role="alert">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="text-brand underline min-h-[44px]"
        >
          {t.goHome}
        </button>
      </div>
    )
  }

  if (!caseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400 animate-pulse" aria-live="polite">{t.loading}</p>
      </div>
    )
  }

  const filledSlots = Object.entries(caseData.slots).filter(
    ([, v]) => v !== null && v !== '' && !(Array.isArray(v) && v.length === 0),
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-brand text-white px-4 py-4 shadow">
        <button
          onClick={() => navigate('/')}
          aria-label={lang === 'hi' ? 'होम पर वापस' : lang === 'te' ? 'హోమ్‌కు తిరిగి' : 'Back to home'}
          className="text-white/70 hover:text-white text-sm mb-1 min-h-[44px] flex items-center"
        >
          ← {lang === 'hi' ? 'होम' : lang === 'te' ? 'హోమ్' : 'Home'}
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              {lang === 'hi' ? 'केस वर्कस्पेस' : lang === 'te' ? 'కేసు వర్క్‌స్పేస్' : 'Case Workspace'}
            </h1>
            <p className="text-blue-200 text-xs font-mono tracking-widest mt-0.5">
              <span className="sr-only">Case code: </span>#{caseData.code}
            </p>
          </div>
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_COLOR[caseData.status] ?? 'bg-gray-100 text-gray-600'}`}
          >
            {t.statusLabel[caseData.status] ?? caseData.status}
          </span>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">

        {alerts.length > 0 && (
          <section aria-label={t.sectionAlerts}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t.sectionAlerts}
            </h2>
            <div className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  caseCode={caseData.code}
                  lang={lang}
                  onDismissed={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
                />
              ))}
            </div>
          </section>
        )}

        {filledSlots.length > 0 && (
          <section aria-label={t.sectionRecorded}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t.sectionRecorded}
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

        <section aria-label={t.sectionConversation}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {t.sectionConversation}
          </h2>
          <div className="flex flex-col" aria-live="polite">
            {caseData.messages.map((m, i) => (
              <MessageBubble key={i} role={m.role} content={m.content} />
            ))}
          </div>
        </section>

        {caseData.status === 'intake' && (
          <button
            onClick={() => navigate(`/intake/${caseData.code}`)}
            className="w-full bg-brand text-white font-semibold rounded-xl py-3 hover:bg-brand-dark transition-colors min-h-[52px]"
          >
            {t.btnContinueIntake}
          </button>
        )}

        {(caseData.status === 'pending_docs' || caseData.status === 'ready') && (
          <section aria-label={t.sectionDocuments}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {t.sectionDocuments}
            </h2>
            <div className="flex flex-col gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-2">
                  <DocumentReviewCard record={doc} lang={lang} />
                  {doc.document_type === 'rejection_slip' && doc.rejection_explanation && (
                    <RejectionExplainerCard explanation={doc.rejection_explanation} lang={lang} />
                  )}
                </div>
              ))}
              <DocumentUpload
                caseCode={caseData.code}
                lang={lang}
                onUploaded={(rec) => setDocuments((prev) => [...prev, rec])}
              />
            </div>
          </section>
        )}

        {caseData.status !== 'intake' && caseData.status !== 'closed' && (
          <section aria-label={t.sectionCaseWatch} className="flex flex-col gap-3">
            <DraftDownloadButton caseCode={caseData.code} lang={lang} />
            <PushSubscriptionButton caseCode={caseData.code} lang={lang} />
            <button
              onClick={handleClose}
              disabled={closing}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 disabled:opacity-40 min-h-[44px]"
            >
              {closing ? t.btnClosing : t.btnMarkResolved}
            </button>
          </section>
        )}
      </div>
    </div>
  )
}

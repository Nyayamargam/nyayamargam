import { useState } from 'react'
import { getT } from '../i18n'
import { type CaseAlert, api } from '../services/api'

interface Props {
  alert: CaseAlert
  caseCode: string
  lang?: string
  onDismissed: (alertId: string) => void
}

const ALERT_STYLE: Record<string, string> = {
  document_expired: 'bg-red-50 border-red-100',
  document_expiring_soon: 'bg-orange-50 border-orange-100',
  action_required: 'bg-yellow-50 border-yellow-100',
}

const ALERT_TEXT: Record<string, string> = {
  document_expired: 'text-red-800',
  document_expiring_soon: 'text-orange-800',
  action_required: 'text-yellow-800',
}

export function AlertCard({ alert, caseCode, lang, onDismissed }: Props) {
  const [dismissing, setDismissing] = useState(false)
  const t = getT(lang)

  async function handleDismiss() {
    setDismissing(true)
    try {
      await api.dismissAlert(caseCode, alert.id)
      onDismissed(alert.id)
    } catch {
      setDismissing(false)
    }
  }

  const containerStyle = ALERT_STYLE[alert.type] ?? 'bg-yellow-50 border-yellow-100'
  const textStyle = ALERT_TEXT[alert.type] ?? 'text-yellow-800'

  return (
    <div className={`border rounded-2xl p-4 flex items-start gap-3 ${containerStyle}`}>
      <div className="flex-1">
        <p className={`text-xs font-medium leading-relaxed ${textStyle}`}>{alert.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        disabled={dismissing}
        aria-label={t.dismissAriaLabel}
        className="text-gray-400 hover:text-gray-600 shrink-0 disabled:opacity-40 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-black/5 transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

import { useState } from 'react'
import { getT } from '../i18n'
import { api } from '../services/api'

interface Props {
  caseCode: string
  lang?: string
}

export function DraftDownloadButton({ caseCode, lang }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const t = getT(lang)

  async function handleDownload() {
    setBusy(true)
    setError('')
    try {
      await api.downloadDraft(caseCode)
    } catch (e) {
      setError(e instanceof Error ? e.message : t.draftError)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDownload}
        disabled={busy}
        className="w-full border border-brand text-brand text-sm font-medium rounded-xl py-2.5 hover:bg-brand/5 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px]"
      >
        <span aria-hidden="true">⬇</span>
        {busy ? t.draftGenerating : t.draftDownload}
      </button>
      {error && <p className="text-xs text-red-500 text-center" role="alert">{error}</p>}
    </div>
  )
}

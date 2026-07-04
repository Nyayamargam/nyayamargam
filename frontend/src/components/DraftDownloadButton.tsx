import { useState } from 'react'
import { api } from '../services/api'

interface Props {
  caseCode: string
}

export function DraftDownloadButton({ caseCode }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleDownload() {
    setBusy(true)
    setError('')
    try {
      await api.downloadDraft(caseCode)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Download failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleDownload}
        disabled={busy}
        className="w-full border border-brand text-brand text-sm font-medium rounded-xl py-2.5 hover:bg-brand/5 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <span>⬇</span>
        {busy ? 'Generating PDF…' : 'Download Draft Letter'}
      </button>
      {error && <p className="text-xs text-red-500 text-center" role="alert">{error}</p>}
    </div>
  )
}

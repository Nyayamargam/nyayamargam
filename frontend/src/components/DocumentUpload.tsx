import { useRef, useState } from 'react'
import { type DocumentRecord, api } from '../services/api'

const DOC_TYPE_LABELS: Record<string, string> = {
  insurance: 'Insurance Certificate',
  dl: 'Driving Licence',
  rc_book: 'RC Book',
  puc: 'PUC Certificate',
  challan_receipt: 'Challan Receipt',
}

async function compressImage(file: File): Promise<Blob> {
  const MAX_PX = 1600
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > MAX_PX || height > MAX_PX) {
        const ratio = Math.min(MAX_PX / width, MAX_PX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', 0.85)
    }
    img.src = url
  })
}

interface Props {
  caseCode: string
  onUploaded: (record: DocumentRecord) => void
}

export function DocumentUpload({ caseCode, onUploaded }: Props) {
  const [docType, setDocType] = useState('insurance')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function pickFile(f: File) {
    if (preview) URL.revokeObjectURL(preview)
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setError('')
  }

  function clearFile() {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const compressed = await compressImage(file)
      const record = await api.uploadDocument(caseCode, compressed, docType)
      onUploaded(record)
      clearFile()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col gap-4">
      <h3 className="font-semibold text-gray-800 text-sm">Upload a Document</h3>

      <div>
        <label className="text-xs font-medium text-gray-500 mb-1 block">Document type</label>
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
        >
          {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {preview ? (
        <div className="relative">
          <img src={preview} alt="Selected document" className="w-full rounded-xl object-cover max-h-48" />
          <button
            onClick={clearFile}
            aria-label="Remove image"
            className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs hover:bg-black/70"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl py-8 text-sm text-gray-400 hover:border-brand hover:text-brand transition-colors"
        >
          Tap to select an image
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) pickFile(f)
        }}
      />

      {error && <p className="text-xs text-red-500" role="alert">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="w-full bg-brand text-white font-semibold rounded-xl py-3 text-sm hover:bg-brand-dark transition-colors disabled:opacity-40"
      >
        {uploading ? 'Analysing…' : 'Upload & Analyse'}
      </button>
    </div>
  )
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type SarvamLanguage = 'te-IN' | 'hi-IN' | 'en-IN'

export interface STTResult {
  transcript: string
  language_code: string
}

export async function transcribeAudio(
  blob: Blob,
  language: SarvamLanguage = 'te-IN',
): Promise<STTResult> {
  const form = new FormData()
  // Use the blob's own MIME type so the backend forwards it correctly
  form.append('audio', blob, 'recording.webm')
  form.append('language', language)

  const url = `${BASE}/speech/stt`
  console.log('[STT] POST', url, '| blob size:', blob.size, '| type:', blob.type, '| language:', language)

  const res = await fetch(url, {
    method: 'POST',
    body: form,
    // No Content-Type header — browser sets multipart boundary automatically
  })

  console.log('[STT] response status:', res.status)
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    console.error('[STT] error body:', text)
    throw new Error(`STT ${res.status}: ${text}`)
  }
  const data = await res.json()
  console.log('[STT] success response:', data)
  return data
}

// TTS stub — Phase 7 wires Sarvam TTS and plays audio
export async function speak(_text: string, _language: SarvamLanguage): Promise<void> {
  return Promise.resolve()
}

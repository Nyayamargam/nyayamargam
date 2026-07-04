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

  const res = await fetch(`${BASE}/speech/stt`, {
    method: 'POST',
    body: form,
    // No Content-Type header — browser sets multipart boundary automatically
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`STT ${res.status}: ${text}`)
  }
  return res.json()
}

// TTS stub — Phase 7 wires Sarvam TTS and plays audio
export async function speak(_text: string, _language: SarvamLanguage): Promise<void> {
  return Promise.resolve()
}

const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export interface CreateCaseResponse {
  code: string
  status: string
  first_message: string
}

export interface SendMessageResponse {
  reply: string
  status: string
  slots_filled: Record<string, unknown>
  intake_complete: boolean
}

export interface CaseMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CaseDetail {
  code: string
  domain: string | null
  status: string
  language: string
  slots: Record<string, unknown>
  messages: CaseMessage[]
  created_at: string
  updated_at: string
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  createCase: (language: string) =>
    post<CreateCaseResponse>('/case', { language }),

  sendMessage: (code: string, content: string, language?: string) =>
    post<SendMessageResponse>(`/case/${code}/message`, { content, language }),

  getCase: (code: string): Promise<CaseDetail> =>
    fetch(`${BASE}/case/${code}`).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
      return r.json()
    }),
}

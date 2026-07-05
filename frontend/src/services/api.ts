const BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

export type ValidityStatus = 'pending' | 'valid' | 'expired' | 'invalid' | 'needs_review'

export type RouterAction =
  | 'SHOW_HELPLINE_NOW'
  | 'ASK_CLARIFYING_QUESTION'
  | 'START_INTAKE'
  | 'START_GROUNDED_INTAKE'
  | 'LEGAL_NAVIGATOR'
  | 'OUT_OF_SCOPE_FALLBACK'

export interface Helpline {
  number: string
  name: string
}

export interface RouterDispatch {
  action: RouterAction
  tier?: 'GREEN' | 'AMBER'
  domain?: string | null
  language?: string
  // EMERGENCY
  helpline?: Helpline
  emergency_type?: string
  // CLARIFY
  question?: string
  // AMBER / LEGAL
  unverified_disclaimer?: boolean
  legal_aid?: { name: string; portal: string; note: string }
  // OUT_OF_SCOPE
  general_helpline?: Helpline
}

export interface RejectionExplanation {
  reason_plain: string
  action_plan: string
  relevant_section: string
}

export interface DocumentRecord {
  id: string
  document_type: string
  extracted_fields: Record<string, string | number | null>
  validity_status: ValidityStatus
  expiry_date: string | null
  uploaded_at: string
  rejection_explanation?: RejectionExplanation | null
}

export interface CreateCaseResponse {
  code: string
  domain: string
  status: string
  first_message: string
}

export interface SendMessageResponse {
  reply: string
  reasoning: string
  status: string
  slots_filled: Record<string, unknown>
  intake_complete: boolean
}

export interface CaseMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface CaseAlert {
  id: string
  type: 'document_expired' | 'document_expiring_soon' | 'action_required'
  message: string
  document_id?: string
  created_at: string
  dismissed: boolean
}

export interface CaseDetail {
  code: string
  domain: string | null
  status: string
  language: string
  slots: Record<string, unknown>
  messages: CaseMessage[]
  alerts: CaseAlert[]
  push_subscription: unknown | null
  last_rescanned_at: string | null
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
  createCase: (language: string, domain: string) =>
    post<CreateCaseResponse>('/case', { language, domain }),

  sendMessage: (code: string, content: string, language?: string) =>
    post<SendMessageResponse>(`/case/${code}/message`, { content, language }),

  getCase: (code: string): Promise<CaseDetail> =>
    fetch(`${BASE}/case/${code}`).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
      return r.json()
    }),

  uploadDocument: async (code: string, file: Blob, documentType: string): Promise<DocumentRecord> => {
    const form = new FormData()
    form.append('file', file, 'document.jpg')
    form.append('document_type', documentType)
    const res = await fetch(`${BASE}/case/${code}/document`, { method: 'POST', body: form })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Upload ${res.status}: ${text}`)
    }
    return res.json()
  },

  getDocuments: (code: string): Promise<DocumentRecord[]> =>
    fetch(`${BASE}/case/${code}/documents`).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
      return r.json()
    }),

  closeCase: (code: string): Promise<void> =>
    fetch(`${BASE}/case/${code}/close`, { method: 'POST' }).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
    }),

  dismissAlert: (code: string, alertId: string): Promise<void> =>
    fetch(`${BASE}/case/${code}/alerts/${alertId}/dismiss`, { method: 'POST' }).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
    }),

  savePushSubscription: (code: string, subscription: PushSubscriptionJSON): Promise<void> =>
    fetch(`${BASE}/case/${code}/push-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    }).then((r) => {
      if (!r.ok) throw new Error(`API ${r.status}`)
    }),

  classifyProblem: (problem: string, language: string) =>
    post<RouterDispatch>('/classify', { problem, language }),

  downloadDraft: async (code: string): Promise<void> => {
    const res = await fetch(`${BASE}/case/${code}/draft.pdf`)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`Draft ${res.status}: ${text}`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `navyasathi-${code.toLowerCase()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  },
}

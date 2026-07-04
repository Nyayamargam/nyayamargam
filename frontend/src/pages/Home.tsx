import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

type Lang = 'en' | 'hi' | 'te'

const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
}

const COPY: Record<Lang, { tagline: string; start: string; resume: string; resumePlaceholder: string; resumeBtn: string; notFound: string }> = {
  en: {
    tagline: 'Your legal companion for government procedures',
    start: 'Start a New Case',
    resume: 'Resume an Existing Case',
    resumePlaceholder: 'Enter your 6-character case code',
    resumeBtn: 'Open Case',
    notFound: 'Case not found. Please check your code.',
  },
  hi: {
    tagline: 'सरकारी प्रक्रियाओं के लिए आपका कानूनी साथी',
    start: 'नया केस शुरू करें',
    resume: 'मौजूदा केस फिर से खोलें',
    resumePlaceholder: '6 अक्षरों का केस कोड दर्ज करें',
    resumeBtn: 'केस खोलें',
    notFound: 'केस नहीं मिला। कृपया अपना कोड जांचें।',
  },
  te: {
    tagline: 'ప్రభుత్వ విధానాలకు మీ చట్టపరమైన సహచరుడు',
    start: 'కొత్త కేసు ప్రారంభించండి',
    resume: 'ఉన్న కేసు తిరిగి తెరవండి',
    resumePlaceholder: '6 అక్షరాల కేసు కోడ్ నమోదు చేయండి',
    resumeBtn: 'కేసు తెరవండి',
    notFound: 'కేసు కనుగొనబడలేదు. మీ కోడ్‌ని తనిఖీ చేయండి.',
  },
}

export function Home() {
  const navigate = useNavigate()
  const storedLang = (localStorage.getItem('navyasathi_lang') as Lang) || 'en'
  const [lang, setLang] = useState<Lang>(storedLang)
  const [resumeCode, setResumeCode] = useState('')
  const [starting, setStarting] = useState(false)
  const [resumeError, setResumeError] = useState('')

  function selectLang(l: Lang) {
    setLang(l)
    localStorage.setItem('navyasathi_lang', l)
  }

  async function startCase() {
    setStarting(true)
    try {
      const res = await api.createCase(lang)
      navigate(`/intake/${res.code}`)
    } finally {
      setStarting(false)
    }
  }

  async function openCase() {
    setResumeError('')
    const code = resumeCode.trim().toUpperCase()
    if (code.length !== 6) {
      setResumeError(COPY[lang].notFound)
      return
    }
    try {
      await api.getCase(code)
      navigate(`/case/${code}`)
    } catch {
      setResumeError(COPY[lang].notFound)
    }
  }

  const t = COPY[lang]

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand to-brand-light flex flex-col items-center justify-center px-4 py-12">
      {/* Logo / header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-white tracking-tight">NavyaSathi</h1>
        <p className="mt-2 text-blue-100 text-base">{t.tagline}</p>
      </div>

      {/* Language selector */}
      <div className="flex gap-2 mb-8" role="group" aria-label="Select language">
        {(Object.keys(LANG_LABELS) as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => selectLang(l)}
            aria-pressed={lang === l}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              lang === l
                ? 'bg-white text-brand shadow'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5">
        {/* Start new case */}
        <button
          onClick={startCase}
          disabled={starting}
          className="w-full bg-brand text-white font-semibold rounded-xl py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60"
        >
          {starting ? '…' : t.start}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Resume existing case */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{t.resume}</p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={resumeCode}
              onChange={(e) => setResumeCode(e.target.value.toUpperCase())}
              placeholder={t.resumePlaceholder}
              aria-label={t.resumePlaceholder}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand uppercase tracking-widest font-mono"
              onKeyDown={(e) => e.key === 'Enter' && openCase()}
            />
            <button
              onClick={openCase}
              className="bg-gray-100 text-gray-700 font-medium text-sm rounded-xl px-4 hover:bg-gray-200 transition-colors"
            >
              {t.resumeBtn}
            </button>
          </div>
          {resumeError && (
            <p className="mt-2 text-xs text-red-500" role="alert">
              {resumeError}
            </p>
          )}
        </div>
      </div>

      <p className="mt-8 text-blue-100 text-xs text-center max-w-xs">
        NavyaSathi provides factual procedural information, not legal advice.
        Always verify with a licensed advocate for your specific situation.
      </p>
    </div>
  )
}

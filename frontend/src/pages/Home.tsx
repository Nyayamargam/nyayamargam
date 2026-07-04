import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLang, getT, setHtmlLang, type Lang } from '../i18n'
import { api } from '../services/api'

type Domain = 'vehicle_traffic' | 'pension_welfare' | 'utility_consumer'

const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
}

const DOMAIN_IDS: Domain[] = ['vehicle_traffic', 'pension_welfare', 'utility_consumer']

const COPY: Record<Lang, {
  tagline: string
  chooseDomain: string
  start: string
  resume: string
  resumePlaceholder: string
  resumeBtn: string
  notFound: string
  disclaimer: string
  orSeparator: string
}> = {
  en: {
    tagline: 'Your legal companion for government procedures',
    chooseDomain: 'What is your matter about?',
    start: 'Start a New Case',
    resume: 'Resume an Existing Case',
    resumePlaceholder: 'Enter your 6-character case code',
    resumeBtn: 'Open Case',
    notFound: 'Case not found. Please check your code.',
    disclaimer: 'NavyaSathi provides factual procedural information, not legal advice. Always verify with a licensed advocate for your specific situation.',
    orSeparator: 'or',
  },
  hi: {
    tagline: 'सरकारी प्रक्रियाओं के लिए आपका कानूनी साथी',
    chooseDomain: 'आपका मामला किस बारे में है?',
    start: 'नया केस शुरू करें',
    resume: 'मौजूदा केस फिर से खोलें',
    resumePlaceholder: '6 अक्षरों का केस कोड दर्ज करें',
    resumeBtn: 'केस खोलें',
    notFound: 'केस नहीं मिला। कृपया अपना कोड जांचें।',
    disclaimer: 'NavyaSathi प्रक्रियात्मक जानकारी देता है, कानूनी सलाह नहीं। अपनी स्थिति के लिए हमेशा किसी वकील से सत्यापित करें।',
    orSeparator: 'या',
  },
  te: {
    tagline: 'ప్రభుత్వ విధానాలకు మీ చట్టపరమైన సహచరుడు',
    chooseDomain: 'మీ విషయం దేని గురించి?',
    start: 'కొత్త కేసు ప్రారంభించండి',
    resume: 'ఉన్న కేసు తిరిగి తెరవండి',
    resumePlaceholder: '6 అక్షరాల కేసు కోడ్ నమోదు చేయండి',
    resumeBtn: 'కేసు తెరవండి',
    notFound: 'కేసు కనుగొనబడలేదు. మీ కోడ్‌ని తనిఖీ చేయండి.',
    disclaimer: 'NavyaSathi ప్రక్రియాత్మక సమాచారం అందిస్తుంది, చట్టపరమైన సలహా కాదు. మీ పరిస్థితికి లైసెన్స్ పొందిన న్యాయవాదితో ధ్రువీకరించండి.',
    orSeparator: 'లేదా',
  },
}

export function Home() {
  const navigate = useNavigate()
  const [lang, setLangState] = useState<Lang>(getLang())
  const [domain, setDomain] = useState<Domain>(
    (localStorage.getItem('navyasathi_domain') as Domain) || 'vehicle_traffic',
  )
  const [resumeCode, setResumeCode] = useState('')
  const [starting, setStarting] = useState(false)
  const [resumeError, setResumeError] = useState('')

  const t = COPY[lang]
  const gt = getT(lang)

  function selectLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('navyasathi_lang', l)
    setHtmlLang(l)
  }

  function selectDomain(d: Domain) {
    setDomain(d)
    localStorage.setItem('navyasathi_domain', d)
  }

  async function startCase() {
    setStarting(true)
    try {
      const res = await api.createCase(lang, domain)
      navigate(`/intake/${res.code}`)
    } finally {
      setStarting(false)
    }
  }

  async function openCase() {
    setResumeError('')
    const code = resumeCode.trim().toUpperCase()
    if (code.length !== 6) {
      setResumeError(t.notFound)
      return
    }
    try {
      await api.getCase(code)
      navigate(`/case/${code}`)
    } catch {
      setResumeError(t.notFound)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand to-brand-light flex flex-col items-center justify-center px-4 py-12">
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
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
              lang === l ? 'bg-white text-brand shadow' : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {LANG_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5">

        {/* Domain picker */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{t.chooseDomain}</p>
          <div className="flex flex-col gap-2" role="group" aria-label={t.chooseDomain}>
            {DOMAIN_IDS.map((id) => {
              const dl = gt.domains[id]
              return (
                <button
                  key={id}
                  onClick={() => selectDomain(id)}
                  aria-pressed={domain === id}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all min-h-[56px] ${
                    domain === id
                      ? 'border-brand bg-brand/5'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <p className={`text-sm font-semibold ${domain === id ? 'text-brand' : 'text-gray-800'}`}>
                    {dl.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{dl.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={startCase}
          disabled={starting}
          className="w-full bg-brand text-white font-semibold rounded-xl py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-60 min-h-[52px]"
        >
          {starting ? '…' : t.start}
        </button>

        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">{t.orSeparator}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Resume case */}
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2" id="resume-label">{t.resume}</p>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={resumeCode}
              onChange={(e) => setResumeCode(e.target.value.toUpperCase())}
              placeholder={t.resumePlaceholder}
              aria-labelledby="resume-label"
              aria-describedby={resumeError ? 'resume-error' : undefined}
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand uppercase tracking-widest font-mono min-h-[44px]"
              onKeyDown={(e) => e.key === 'Enter' && openCase()}
            />
            <button
              onClick={openCase}
              className="bg-gray-100 text-gray-700 font-medium text-sm rounded-xl px-4 hover:bg-gray-200 transition-colors min-h-[44px]"
            >
              {t.resumeBtn}
            </button>
          </div>
          {resumeError && (
            <p id="resume-error" className="mt-2 text-xs text-red-500" role="alert">{resumeError}</p>
          )}
        </div>
      </div>

      <p className="mt-8 text-blue-100 text-xs text-center max-w-xs">
        {t.disclaimer}
      </p>
    </div>
  )
}

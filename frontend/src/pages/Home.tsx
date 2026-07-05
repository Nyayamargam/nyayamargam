import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLang, getT, setHtmlLang, type Lang } from '../i18n'
import { type RouterDispatch, api } from '../services/api'

type Domain = 'vehicle_traffic' | 'pension_welfare' | 'utility_consumer'

const LANG_LABELS: Record<Lang, string> = {
  en: 'English',
  hi: 'हिंदी',
  te: 'తెలుగు',
}

const DOMAIN_IDS: Domain[] = ['vehicle_traffic', 'pension_welfare', 'utility_consumer']

const COPY: Record<Lang, {
  tagline: string
  problemPlaceholder: string
  findHelp: string
  orSeparator: string
  chooseDomain: string
  start: string
  resume: string
  resumePlaceholder: string
  resumeBtn: string
  notFound: string
  disclaimer: string
  emergencyCallNow: string
  emergencyNote: string
  amberTitle: string
  amberNote: string
  amberConfirm: string
  legalTitle: string
  legalNote: string
  legalPortal: string
  outOfScopeTitle: string
  outOfScopeNote: string
  clarifyLabel: string
}> = {
  en: {
    tagline: 'Your legal companion for government procedures',
    problemPlaceholder: 'Describe your problem — e.g. "my vehicle was seized" or "pension payments stopped"',
    findHelp: 'Find Help',
    orSeparator: 'or pick a category directly',
    chooseDomain: 'I know my category',
    start: 'Start Case',
    resume: 'Resume an Existing Case',
    resumePlaceholder: 'Enter your 6-character case code',
    resumeBtn: 'Open Case',
    notFound: 'Case not found. Please check your code.',
    disclaimer: 'NavyaSathi provides factual procedural information, not legal advice. Always verify with a licensed advocate for your specific situation.',
    emergencyCallNow: 'Call now:',
    emergencyNote: 'This is a time-sensitive situation. Please call the helpline immediately.',
    amberTitle: 'We found some information — please verify before you act',
    amberNote: 'This topic isn\'t one of our fully verified areas yet. We can guide you to official sources, but please confirm the exact steps with the relevant office before travelling.',
    amberConfirm: 'Continue anyway',
    legalTitle: 'This sounds like a legal matter — get a free lawyer',
    legalNote: 'NavyaSathi does not give legal strategy or predict outcomes. For disputes like this, you have the right to a free lawyer through NALSA.',
    legalPortal: 'Visit nalsa.gov.in',
    outOfScopeTitle: 'We\'re not able to help with this yet',
    outOfScopeNote: 'This doesn\'t match a government procedure we can guide you through. For general emergencies, call 112.',
    clarifyLabel: 'Could you tell us a bit more?',
  },
  hi: {
    tagline: 'सरकारी प्रक्रियाओं के लिए आपका कानूनी साथी',
    problemPlaceholder: 'अपनी समस्या बताएं — जैसे "मेरा वाहन जब्त हो गया" या "पेंशन बंद हो गई"',
    findHelp: 'मदद खोजें',
    orSeparator: 'या सीधे श्रेणी चुनें',
    chooseDomain: 'मुझे श्रेणी पता है',
    start: 'केस शुरू करें',
    resume: 'मौजूदा केस फिर से खोलें',
    resumePlaceholder: '6 अक्षरों का केस कोड दर्ज करें',
    resumeBtn: 'केस खोलें',
    notFound: 'केस नहीं मिला। कृपया अपना कोड जांचें।',
    disclaimer: 'NavyaSathi प्रक्रियात्मक जानकारी देता है, कानूनी सलाह नहीं।',
    emergencyCallNow: 'अभी कॉल करें:',
    emergencyNote: 'यह जरूरी स्थिति है। तुरंत हेल्पलाइन पर कॉल करें।',
    amberTitle: 'जानकारी मिली — कार्रवाई से पहले सत्यापित करें',
    amberNote: 'यह हमारे सत्यापित क्षेत्रों में से एक नहीं है। कार्यालय से पुष्टि करके ही आगे बढ़ें।',
    amberConfirm: 'फिर भी जारी रखें',
    legalTitle: 'यह कानूनी मामला लगता है — मुफ्त वकील लें',
    legalNote: 'NavyaSathi कानूनी रणनीति नहीं देता। NALSA के माध्यम से मुफ्त वकील पाएं।',
    legalPortal: 'nalsa.gov.in पर जाएं',
    outOfScopeTitle: 'हम अभी इसमें मदद नहीं कर सकते',
    outOfScopeNote: 'यह किसी सरकारी प्रक्रिया से मेल नहीं खाता। आपातकाल में 112 पर कॉल करें।',
    clarifyLabel: 'क्या आप थोड़ा और बता सकते हैं?',
  },
  te: {
    tagline: 'ప్రభుత్వ విధానాలకు మీ చట్టపరమైన సహచరుడు',
    problemPlaceholder: 'మీ సమస్యను వివరించండి — ఉదా. "నా వాహనం జప్తు చేయబడింది" లేదా "పెన్షన్ ఆగిపోయింది"',
    findHelp: 'సహాయం వెతకండి',
    orSeparator: 'లేదా నేరుగా వర్గాన్ని ఎంచుకోండి',
    chooseDomain: 'నాకు వర్గం తెలుసు',
    start: 'కేసు ప్రారంభించండి',
    resume: 'ఉన్న కేసు తిరిగి తెరవండి',
    resumePlaceholder: '6 అక్షరాల కేసు కోడ్ నమోదు చేయండి',
    resumeBtn: 'కేసు తెరవండి',
    notFound: 'కేసు కనుగొనబడలేదు. మీ కోడ్‌ని తనిఖీ చేయండి.',
    disclaimer: 'NavyaSathi ప్రక్రియాత్మక సమాచారం అందిస్తుంది, చట్టపరమైన సలహా కాదు.',
    emergencyCallNow: 'ఇప్పుడే కాల్ చేయండి:',
    emergencyNote: 'ఇది అత్యవసర పరిస్థితి. వెంటనే హెల్ప్‌లైన్‌కు కాల్ చేయండి.',
    amberTitle: 'సమాచారం దొరికింది — చర్య తీసుకునే ముందు నిర్ధారించుకోండి',
    amberNote: 'ఇది మా ధృవీకరించిన ప్రాంతాలలో ఒకటి కాదు. కార్యాలయంలో నిర్ధారించుకున్న తర్వాత ముందుకు వెళ్ళండి.',
    amberConfirm: 'అయినా కొనసాగించండి',
    legalTitle: 'ఇది చట్టపరమైన వ్యవహారం — ఉచిత న్యాయవాదిని పొందండి',
    legalNote: 'NavyaSathi చట్టపరమైన వ్యూహం ఇవ్వదు. NALSA ద్వారా ఉచిత న్యాయవాదిని పొందండి.',
    legalPortal: 'nalsa.gov.in సందర్శించండి',
    outOfScopeTitle: 'మేము ఇప్పుడు దీనికి సహాయం చేయలేకపోతున్నాము',
    outOfScopeNote: 'ఇది మేము మార్గనిర్దేశం చేయగల ప్రభుత్వ విధానంతో సరిపోలడం లేదు. అత్యవసర పరిస్థితికి 112కి కాల్ చేయండి.',
    clarifyLabel: 'మీరు కొంచెం ఎక్కువ చెప్పగలరా?',
  },
}

function EmergencyCard({ dispatch, t }: { dispatch: RouterDispatch; t: typeof COPY['en'] }) {
  const h = dispatch.helpline!
  return (
    <div className="bg-red-50 border-2 border-red-400 rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-red-700 font-bold text-sm uppercase tracking-wide">⚠ {h.name}</p>
      <p className="text-red-600 text-xs">{t.emergencyNote}</p>
      <a
        href={`tel:${h.number}`}
        className="flex items-center justify-center gap-2 bg-red-600 text-white font-bold text-lg rounded-xl py-3 hover:bg-red-700 transition-colors min-h-[52px]"
      >
        📞 {t.emergencyCallNow} {h.number}
      </a>
    </div>
  )
}

function AmberCard({ t, onContinue }: { dispatch?: RouterDispatch; t: typeof COPY['en']; onContinue: () => void }) {
  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-amber-800 font-bold text-sm">⚡ {t.amberTitle}</p>
      <p className="text-amber-700 text-xs leading-relaxed">{t.amberNote}</p>
      <button
        onClick={onContinue}
        className="bg-amber-500 text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-amber-600 transition-colors min-h-[44px]"
      >
        {t.amberConfirm}
      </button>
    </div>
  )
}

function LegalCard({ dispatch, t }: { dispatch: RouterDispatch; t: typeof COPY['en'] }) {
  const aid = dispatch.legal_aid!
  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-blue-800 font-bold text-sm">⚖ {t.legalTitle}</p>
      <p className="text-blue-600 text-xs leading-relaxed">{t.legalNote}</p>
      <p className="text-blue-500 text-xs">{aid.note}</p>
      <a
        href={aid.portal}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-600 text-white font-semibold text-sm rounded-xl py-2.5 text-center hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center"
      >
        {t.legalPortal}
      </a>
    </div>
  )
}

function OutOfScopeCard({ t }: { t: typeof COPY['en'] }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 flex flex-col gap-2">
      <p className="text-gray-700 font-semibold text-sm">{t.outOfScopeTitle}</p>
      <p className="text-gray-500 text-xs leading-relaxed">{t.outOfScopeNote}</p>
    </div>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [lang, setLangState] = useState<Lang>(getLang())
  const [domain, setDomain] = useState<Domain>(
    (localStorage.getItem('navyasathi_domain') as Domain) || 'vehicle_traffic',
  )
  const [problem, setProblem] = useState('')
  const [finding, setFinding] = useState(false)
  const [routeResult, setRouteResult] = useState<RouterDispatch | null>(null)
  const [resumeCode, setResumeCode] = useState('')
  const [starting, setStarting] = useState(false)
  const [resumeError, setResumeError] = useState('')

  const t = COPY[lang]
  const gt = getT(lang)

  function selectLang(l: Lang) {
    setLangState(l)
    localStorage.setItem('navyasathi_lang', l)
    setHtmlLang(l)
    setRouteResult(null)
  }

  function selectDomain(d: Domain) {
    setDomain(d)
    localStorage.setItem('navyasathi_domain', d)
  }

  async function findHelp() {
    if (!problem.trim()) return
    setFinding(true)
    setRouteResult(null)
    try {
      const result = await api.classifyProblem(problem.trim(), lang)
      if (result.action === 'START_INTAKE' && result.domain) {
        // GREEN — create case immediately and navigate
        const res = await api.createCase(lang, result.domain)
        navigate(`/intake/${res.code}`)
        return
      }
      setRouteResult(result)
    } finally {
      setFinding(false)
    }
  }

  async function startAmberCase() {
    // Amber: create a best-effort case in the closest domain, or vehicle_traffic as fallback
    const d = (routeResult?.domain as Domain) || 'vehicle_traffic'
    setStarting(true)
    try {
      const res = await api.createCase(lang, d)
      navigate(`/intake/${res.code}`)
    } finally {
      setStarting(false)
    }
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
    if (code.length !== 6) { setResumeError(t.notFound); return }
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

        {/* Primary path — free-text router */}
        <div className="flex flex-col gap-2">
          <textarea
            rows={3}
            value={problem}
            onChange={(e) => { setProblem(e.target.value); setRouteResult(null) }}
            placeholder={t.problemPlaceholder}
            className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            aria-label={t.problemPlaceholder}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); findHelp() } }}
          />
          <button
            onClick={findHelp}
            disabled={finding || !problem.trim()}
            className="w-full bg-brand text-white font-semibold rounded-xl py-3 text-base hover:bg-brand-dark transition-colors disabled:opacity-50 min-h-[52px]"
          >
            {finding ? '…' : t.findHelp}
          </button>
        </div>

        {/* Router result cards */}
        {routeResult && (
          <div className="animate-fade-in">
            {routeResult.action === 'SHOW_HELPLINE_NOW' && (
              <EmergencyCard dispatch={routeResult} t={t} />
            )}
            {routeResult.action === 'ASK_CLARIFYING_QUESTION' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col gap-2">
                <p className="text-blue-700 text-sm font-medium">{t.clarifyLabel}</p>
                <p className="text-blue-600 text-sm">{routeResult.question}</p>
              </div>
            )}
            {routeResult.action === 'START_GROUNDED_INTAKE' && (
              <AmberCard dispatch={routeResult} t={t} onContinue={startAmberCase} />
            )}
            {routeResult.action === 'LEGAL_NAVIGATOR' && (
              <LegalCard dispatch={routeResult} t={t} />
            )}
            {routeResult.action === 'OUT_OF_SCOPE_FALLBACK' && (
              <OutOfScopeCard t={t} />
            )}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">{t.orSeparator}</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Secondary path — domain picker */}
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
                    domain === id ? 'border-brand bg-brand/5' : 'border-gray-100 hover:border-gray-200'
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
          <button
            onClick={startCase}
            disabled={starting}
            className="mt-3 w-full bg-gray-100 text-gray-700 font-semibold rounded-xl py-2.5 text-sm hover:bg-gray-200 transition-colors disabled:opacity-60 min-h-[44px]"
          >
            {starting ? '…' : t.start}
          </button>
        </div>

        <div className="flex items-center gap-3" aria-hidden="true">
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

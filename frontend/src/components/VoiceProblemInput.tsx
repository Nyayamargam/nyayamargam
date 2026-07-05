import { useState, useRef, useEffect } from 'react'
import { transcribeAudio, type SarvamLanguage } from '../services/sarvam'
import { api, type RouterDispatch } from '../services/api'

type Phase = 'idle' | 'recording' | 'transcribing' | 'review' | 'editing' | 'submitting'

const STRINGS: Record<string, {
  prompt: string
  micIdle: string
  micRecording: string
  transcribing: string
  typeInstead: string
  youSaid: string
  correct: string
  edit: string
  submit: string
  micError: string
  noMic: string
  placeholder: string
  submitError: string
}> = {
  en: {
    prompt: 'Describe your problem in your own words',
    micIdle: 'Tap to speak',
    micRecording: 'Listening… tap to stop',
    transcribing: 'Getting your words…',
    typeInstead: 'Type instead',
    youSaid: 'You said:',
    correct: 'That\'s right',
    edit: 'Edit',
    submit: 'Continue',
    micError: 'I couldn\'t hear that clearly. Please try again in a quieter spot, or type instead.',
    noMic: 'Voice isn\'t available on this device. You can type your problem below.',
    placeholder: 'Type your problem here…',
    submitError: 'Something went wrong. Please try again.',
  },
  hi: {
    prompt: 'अपनी समस्या अपने शब्दों में बताएं',
    micIdle: 'बोलने के लिए टैप करें',
    micRecording: 'सुन रहा हूँ… रोकने के लिए टैप करें',
    transcribing: 'आपकी बात सुन रहे हैं…',
    typeInstead: 'टाइप करें',
    youSaid: 'आपने कहा:',
    correct: 'हाँ, सही है',
    edit: 'बदलें',
    submit: 'आगे बढ़ें',
    micError: 'आवाज़ स्पष्ट नहीं आई। कृपया शांत जगह से दोबारा कोशिश करें, या टाइप करें।',
    noMic: 'इस डिवाइस पर आवाज़ उपलब्ध नहीं है। नीचे टाइप करें।',
    placeholder: 'यहाँ अपनी समस्या टाइप करें…',
    submitError: 'कुछ गड़बड़ हुई। कृपया दोबारा कोशिश करें।',
  },
  te: {
    prompt: 'మీ సమస్యను మీ మాటల్లో వివరించండి',
    micIdle: 'మాట్లాడటానికి నొక్కండి',
    micRecording: 'వింటున్నాను… ఆపడానికి నొక్కండి',
    transcribing: 'మీ మాటలు వింటున్నాం…',
    typeInstead: 'టైప్ చేయండి',
    youSaid: 'మీరు చెప్పింది:',
    correct: 'అవును, సరే',
    edit: 'మార్చండి',
    submit: 'కొనసాగించండి',
    micError: 'స్పష్టంగా వినబడలేదు.조용한 ప్రదేశంలో మళ్ళీ ప్రయత్నించండి, లేదా టైప్ చేయండి.',
    noMic: 'ఈ పరికరంలో వాయిస్ అందుబాటులో లేదు. దిగువ టైప్ చేయండి.',
    placeholder: 'మీ సమస్యను ఇక్కడ టైప్ చేయండి…',
    submitError: 'ఏదో తప్పు జరిగింది. మళ్ళీ ప్రయత్నించండి.',
  },
}

interface Props {
  language: SarvamLanguage
  onRouted: (result: RouterDispatch) => void
}

export default function VoiceProblemInput({ language, onRouted }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [micSupported, setMicSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const isoLang = language.split('-')[0] // 'en-IN' → 'en'
  const str = STRINGS[isoLang] ?? STRINGS.en

  useEffect(() => {
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
      setMicSupported(false)
    }
  }, [])

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        uploadForTranscription(new Blob(chunksRef.current, { type: 'audio/webm' }))
      }
      mediaRecorderRef.current = mr
      mr.start()
      setPhase('recording')
    } catch {
      setMicSupported(false)
      setError(str.noMic)
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setPhase('transcribing')
    }
  }

  async function uploadForTranscription(blob: Blob) {
    try {
      const result = await transcribeAudio(blob, language)
      if (!result.transcript?.trim()) throw new Error('empty transcript')
      setText(result.transcript.trim())
      setPhase('review')
    } catch {
      setError(str.micError)
      setPhase('idle')
    }
  }

  async function submitToRouter() {
    if (!text.trim()) return
    setPhase('submitting')
    setError('')
    try {
      const result = await api.classifyProblem(text.trim(), isoLang)
      onRouted(result)
      // Reset so the user can start fresh (GREEN route navigates away; others show result card)
      setPhase('idle')
      setText('')
    } catch {
      setError(str.submitError)
      setPhase('review')
    }
  }

  const showMicUI = micSupported && (['idle', 'recording', 'transcribing'] as Phase[]).includes(phase)

  return (
    <div className="flex flex-col gap-4">
      {/* Voice capture */}
      {showMicUI && (
        <>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={phase === 'recording' ? stopRecording : startRecording}
              disabled={phase === 'transcribing'}
              aria-label={phase === 'recording' ? str.micRecording : str.micIdle}
              className={`w-16 h-16 rounded-full text-white text-2xl flex items-center justify-center shadow-md transition-colors disabled:opacity-60 ${
                phase === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-brand hover:bg-brand-dark'
              }`}
            >
              {phase === 'transcribing' ? '…' : '🎤'}
            </button>
            <p className="text-xs text-gray-500 text-center" aria-live="polite">
              {phase === 'recording'
                ? str.micRecording
                : phase === 'transcribing'
                ? str.transcribing
                : str.micIdle}
            </p>
          </div>
          <button
            onClick={() => { setText(''); setPhase('editing') }}
            className="text-brand text-sm underline text-center py-1 min-h-[44px]"
          >
            {str.typeInstead}
          </button>
        </>
      )}

      {/* Confirmation step */}
      {phase === 'review' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
          <p className="text-xs text-gray-500">{str.youSaid}</p>
          <p className="text-sm text-gray-800 leading-relaxed" aria-live="polite">{text}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPhase('editing')}
              className="flex-1 border-2 border-brand text-brand font-semibold rounded-xl py-2 text-sm hover:bg-brand/5 transition-colors min-h-[44px]"
            >
              {str.edit}
            </button>
            <button
              onClick={submitToRouter}
              className="flex-1 bg-brand text-white font-semibold rounded-xl py-2 text-sm hover:bg-brand-dark transition-colors min-h-[44px]"
            >
              {str.correct}
            </button>
          </div>
        </div>
      )}

      {/* Text input */}
      {(phase === 'editing' || (!micSupported && phase === 'idle')) && (
        <div className="flex flex-col gap-2">
          {!micSupported && <p className="text-xs text-gray-400 text-center">{str.noMic}</p>}
          <textarea
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={str.placeholder}
            aria-label={str.prompt}
            autoFocus
            className="w-full resize-none border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitToRouter() } }}
          />
          <button
            onClick={submitToRouter}
            disabled={!text.trim()}
            className="w-full bg-brand text-white font-semibold rounded-xl py-2.5 text-sm hover:bg-brand-dark transition-colors disabled:opacity-50 min-h-[44px]"
          >
            {str.submit}
          </button>
        </div>
      )}

      {phase === 'submitting' && (
        <p className="text-xs text-gray-400 text-center animate-pulse" aria-live="polite">
          {str.transcribing}
        </p>
      )}

      {error && (
        <p className="text-xs text-amber-600 text-center" role="alert">{error}</p>
      )}
    </div>
  )
}

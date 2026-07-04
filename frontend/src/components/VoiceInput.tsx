import { useRef, useState } from 'react'
import { type SarvamLanguage, transcribeAudio } from '../services/sarvam'

type Phase = 'idle' | 'recording' | 'transcribing' | 'confirming' | 'error'

interface VoiceInputProps {
  language: SarvamLanguage
  onConfirm: (transcript: string) => void
  disabled?: boolean
}

export function VoiceInput({ language, onConfirm, disabled = false }: VoiceInputProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [transcript, setTranscript] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/mp4'

      const mr = new MediaRecorder(stream, { mimeType })
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = handleStop
      mediaRef.current = mr
      mr.start(250) // collect data every 250ms
      setPhase('recording')
    } catch {
      setErrorMsg('Microphone access denied. Please allow microphone access and try again.')
      setPhase('error')
    }
  }

  function stopRecording() {
    mediaRef.current?.stop()
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop())
    setPhase('transcribing')
  }

  async function handleStop() {
    const mimeType = chunksRef.current[0]?.type || 'audio/webm'
    const blob = new Blob(chunksRef.current, { type: mimeType })
    try {
      const result = await transcribeAudio(blob, language)
      setTranscript(result.transcript)
      setPhase('confirming')
    } catch {
      setErrorMsg('Could not understand the audio. Please try again or type your answer.')
      setPhase('error')
    }
  }

  function confirm() {
    if (transcript.trim()) {
      onConfirm(transcript.trim())
    }
    setTranscript('')
    setPhase('idle')
  }

  function retry() {
    setTranscript('')
    setErrorMsg('')
    setPhase('idle')
  }

  if (phase === 'confirming') {
    return (
      <div className="flex flex-col gap-2 p-3 bg-blue-50 rounded-xl border border-blue-200">
        <p className="text-xs text-blue-600 font-medium">Confirm your message:</p>
        <textarea
          className="w-full resize-none text-sm text-gray-800 bg-white rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-2 focus:ring-brand"
          rows={2}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          aria-label="Edit transcript before sending"
        />
        <div className="flex gap-2">
          <button
            onClick={confirm}
            className="flex-1 bg-brand text-white text-sm font-medium rounded-lg py-2 hover:bg-brand-dark transition-colors"
            aria-label="Confirm and send"
          >
            Send
          </button>
          <button
            onClick={retry}
            className="flex-1 bg-white text-gray-600 text-sm font-medium rounded-lg py-2 border border-gray-200 hover:bg-gray-50 transition-colors"
            aria-label="Try recording again"
          >
            Re-record
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'error') {
    return (
      <div className="flex flex-col gap-2 p-3 bg-red-50 rounded-xl border border-red-200">
        <p className="text-xs text-red-600">{errorMsg}</p>
        <button
          onClick={retry}
          className="self-start text-sm text-red-600 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={phase === 'idle' ? startRecording : stopRecording}
      disabled={disabled || phase === 'transcribing'}
      aria-label={
        phase === 'idle'
          ? 'Start voice input'
          : phase === 'recording'
            ? 'Stop recording'
            : 'Transcribing…'
      }
      className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
        phase === 'recording'
          ? 'bg-red-500 text-white animate-pulse'
          : phase === 'transcribing'
            ? 'bg-gray-300 text-gray-500 cursor-wait'
            : 'bg-brand-light text-white hover:bg-brand'
      }`}
    >
      {phase === 'transcribing' ? (
        <span className="text-xs">…</span>
      ) : (
        <MicIcon />
      )}
    </button>
  )
}

function MicIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-5 h-5"
      aria-hidden="true"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
    </svg>
  )
}

import type { RejectionExplanation } from '../services/api'

interface Props {
  explanation: RejectionExplanation
}

export function RejectionExplainerCard({ explanation }: Props) {
  const steps = explanation.action_plan
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-base">📋</span>
        <h3 className="font-semibold text-orange-900 text-sm">Why was it rejected?</h3>
      </div>

      <p className="text-sm text-orange-800 leading-relaxed">{explanation.reason_plain}</p>

      {explanation.relevant_section && (
        <p className="text-xs text-orange-600 font-medium">
          Rule / Section: {explanation.relevant_section}
        </p>
      )}

      <div>
        <p className="text-xs font-semibold text-orange-900 uppercase tracking-wide mb-2">
          What to do next
        </p>
        <ol className="flex flex-col gap-1.5">
          {steps.map((step, i) => (
            <li key={i} className="text-sm text-orange-800 leading-relaxed">
              {step.replace(/^\d+\.\s*/, `${i + 1}. `)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

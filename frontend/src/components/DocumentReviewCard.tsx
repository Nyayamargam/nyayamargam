import { type DocumentRecord } from '../services/api'

const DOC_TYPE_LABELS: Record<string, string> = {
  rc_book: 'RC Book',
  insurance: 'Insurance Certificate',
  dl: 'Driving Licence',
  puc: 'PUC Certificate',
  challan_receipt: 'Challan Receipt',
}

const FIELD_LABELS: Record<string, string> = {
  vehicle_reg_number: 'Vehicle Reg.',
  owner_name: 'Owner',
  registration_date: 'Registration Date',
  validity_upto: 'Valid Until',
  vehicle_class: 'Vehicle Class',
  engine_number: 'Engine No.',
  chassis_number: 'Chassis No.',
  policy_number: 'Policy No.',
  insurer_name: 'Insurer',
  vehicle_reg: 'Vehicle Reg.',
  insured_name: 'Insured',
  policy_start: 'Policy Start',
  policy_expiry: 'Policy Expiry',
  vehicle_type: 'Vehicle Type',
  dl_number: 'DL Number',
  holder_name: 'Holder',
  dob: 'Date of Birth',
  valid_from: 'Valid From',
  valid_to: 'Valid Until',
  vehicle_classes: 'Vehicle Classes',
  issuing_authority: 'Issuing Authority',
  certificate_number: 'Certificate No.',
  test_date: 'Test Date',
  testing_centre: 'Testing Centre',
  challan_number: 'Challan No.',
  offence_date: 'Offence Date',
  offence_section: 'Section',
  fine_amount: 'Fine Amount',
  court_date: 'Court Date',
}

const REMEDIATION: Record<string, string> = {
  insurance:
    'Insurance is mandatory under the Motor Vehicles Act. Renew your policy immediately — contact your insurer or use their app/website.',
  dl: 'An expired licence is an offence under MV Act Section 3. Visit your nearest RTO with Form 9, your old licence, and supporting documents to renew.',
  puc: 'A valid PUC certificate is required under MV Act Section 190. Visit any authorised PUC testing centre — renewal usually takes about 15 minutes.',
  rc_book:
    'Your vehicle registration has expired. Visit your nearest RTO to renew the registration before driving.',
}

const VALIDITY_STYLE: Record<string, string> = {
  valid: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  needs_review: 'bg-yellow-100 text-yellow-800',
  pending: 'bg-gray-100 text-gray-600',
  invalid: 'bg-red-100 text-red-800',
}

const VALIDITY_LABEL: Record<string, string> = {
  valid: 'Valid',
  expired: 'Expired',
  needs_review: 'Needs Review',
  pending: 'Pending',
  invalid: 'Invalid',
}

interface Props {
  record: DocumentRecord
}

export function DocumentReviewCard({ record }: Props) {
  const visibleFields = Object.entries(record.extracted_fields).filter(
    ([k, v]) => k !== 'confidence' && v !== null && v !== '',
  )

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
        <span className="font-medium text-gray-800 text-sm">
          {DOC_TYPE_LABELS[record.document_type] ?? record.document_type}
        </span>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${VALIDITY_STYLE[record.validity_status] ?? 'bg-gray-100 text-gray-600'}`}
        >
          {VALIDITY_LABEL[record.validity_status] ?? record.validity_status}
        </span>
      </div>

      {record.validity_status === 'expired' && (
        <div className="mx-4 mt-3 bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-700">
          <p className="font-semibold mb-0.5">Action required</p>
          <p>{REMEDIATION[record.document_type] ?? 'This document has expired. Please renew it.'}</p>
        </div>
      )}

      {record.validity_status === 'needs_review' && (
        <div className="mx-4 mt-3 bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-xs text-yellow-800">
          Some fields could not be read clearly. Please verify the details below.
        </div>
      )}

      {visibleFields.length > 0 ? (
        <div className="divide-y divide-gray-50 py-1">
          {visibleFields.map(([key, value]) => (
            <div key={key} className="flex justify-between px-4 py-2.5 gap-4">
              <span className="text-xs text-gray-500">
                {FIELD_LABELS[key] ?? key.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-gray-900 font-medium text-right">
                {String(value)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-xs text-gray-400">No fields could be extracted from this image.</p>
      )}
    </div>
  )
}

export type Lang = 'en' | 'hi' | 'te'

export function getLang(override?: string | null): Lang {
  const v = override ?? localStorage.getItem('navyasathi_lang') ?? 'en'
  return (v === 'hi' || v === 'te' ? v : 'en') as Lang
}

export function setHtmlLang(lang: Lang) {
  document.documentElement.lang = lang === 'hi' ? 'hi' : lang === 'te' ? 'te' : 'en'
}

const STRINGS = {
  en: {
    // Intake page
    reasoningChip: 'Why am I being asked this?',
    thinking: 'NavyaSathi is thinking…',
    errorSend: 'Something went wrong. Please try again.',
    errorLoad: 'Could not load this case. The code may be invalid.',
    inputPlaceholder: 'Type your answer…',

    // Workspace page
    statusLabel: {
      intake: 'Intake in progress',
      pending_docs: 'Awaiting documents',
      ready: 'Ready for action',
      closed: 'Closed',
    } as Record<string, string>,
    sectionAlerts: 'Alerts',
    sectionRecorded: 'What we recorded',
    sectionConversation: 'Conversation',
    sectionDocuments: 'Documents',
    sectionCaseWatch: 'Case Watch',
    btnContinueIntake: 'Continue Intake',
    btnMarkResolved: 'Mark as Resolved',
    btnClosing: 'Closing…',
    loading: 'Loading…',
    errorLoadCase: 'Could not load case. Please check the code.',
    goHome: 'Go home',

    // DocumentUpload
    uploadTitle: 'Upload a Document',
    docTypeLabel: 'Document type',
    tapToSelect: 'Tap to select an image',
    btnUpload: 'Upload & Analyse',
    btnUploading: 'Analysing…',

    // DocumentReviewCard
    validityValid: 'Valid',
    validityExpired: 'Expired',
    validityNeedsReview: 'Needs Review',
    validityPending: 'Pending',
    validityInvalid: 'Invalid',
    actionRequired: 'Action required',
    needsReviewMsg:
      'Some fields could not be read clearly. Please verify the details below.',
    noFields: 'No fields could be extracted from this image.',
    remediationInsurance:
      'Insurance is mandatory under the Motor Vehicles Act. Renew your policy immediately — contact your insurer or use their app/website.',
    remediationDl:
      'An expired licence is an offence under MV Act Section 3. Visit your nearest RTO with Form 9, your old licence, and supporting documents to renew.',
    remediationPuc:
      'A valid PUC certificate is required under MV Act Section 190. Visit any authorised PUC testing centre — renewal usually takes about 15 minutes.',
    remediationRcBook:
      'Your vehicle registration has expired. Visit your nearest RTO to renew the registration before driving.',

    // PushSubscriptionButton
    notifBlocked: 'Notifications blocked in browser settings.',
    notifEnabled: 'Notifications enabled for this case.',
    notifEnable: 'Enable Notifications',
    notifEnabling: 'Enabling…',

    // DraftDownloadButton
    draftDownload: 'Download Draft Letter',
    draftGenerating: 'Generating PDF…',
    draftError: 'Download failed. Please try again.',

    // RejectionExplainerCard
    rejectionTitle: 'Why was it rejected?',
    rejectionNextSteps: 'What to do next',
    rejectionRuleSection: 'Rule / Section:',

    // AlertCard
    dismissAriaLabel: 'Dismiss alert',

    // VoiceInput
    voiceDenied: 'Microphone access denied. Please allow microphone access and try again.',
    voiceError: 'Could not understand the audio. Please try again or type your answer.',
    voiceConfirmLabel: 'Confirm your message:',
    voiceSend: 'Send',
    voiceReRecord: 'Re-record',
    voiceTryAgain: 'Try again',
    voiceStartLabel: 'Start voice input',
    voiceStopLabel: 'Stop recording',
    voiceTranscribingLabel: 'Transcribing…',
    voiceEditLabel: 'Edit transcript before sending',
    voiceConfirmSendLabel: 'Confirm and send',

    // Document type labels (glossary)
    docTypes: {
      insurance: 'Insurance Certificate',
      dl: 'Driving Licence',
      rc_book: 'RC Book',
      puc: 'PUC Certificate',
      challan_receipt: 'Challan Receipt',
      rejection_slip: 'Rejection Slip / Letter',
    } as Record<string, string>,

    // Domain labels
    domains: {
      vehicle_traffic: {
        label: 'Vehicle / Traffic',
        description: 'Challans, seizures, licence & RC issues',
      },
      pension_welfare: {
        label: 'Pension / Welfare',
        description: 'Government pensions, welfare schemes, Ayushman Bharat',
      },
      utility_consumer: {
        label: 'Consumer / Utility',
        description: 'Electricity, water, billing disputes, consumer complaints',
      },
    } as Record<string, { label: string; description: string }>,
  },

  hi: {
    reasoningChip: 'यह सवाल क्यों पूछा जा रहा है?',
    thinking: 'NavyaSathi सोच रही है…',
    errorSend: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    errorLoad: 'यह केस लोड नहीं हो सका। कोड सही है या नहीं, जांचें।',
    inputPlaceholder: 'अपना उत्तर टाइप करें…',

    statusLabel: {
      intake: 'जानकारी ली जा रही है',
      pending_docs: 'दस्तावेड़़ों का इंतड़़ार है',
      ready: 'कार्रवाई के लिए तैयार',
      closed: 'बंद',
    } as Record<string, string>,
    sectionAlerts: 'सूचनाएं',
    sectionRecorded: 'हमने जो दर्ज किया',
    sectionConversation: 'बातचीत',
    sectionDocuments: 'दस्तावेड़़',
    sectionCaseWatch: 'केस वॉच',
    btnContinueIntake: 'जानकारी जारी रखें',
    btnMarkResolved: 'हल हुआ चिह्नित करें',
    btnClosing: 'बंद हो रहा है…',
    loading: 'लोड हो रहा है…',
    errorLoadCase: 'केस लोड नहीं हो सका। अपना कोड जांचें।',
    goHome: 'होम पर जाएं',

    uploadTitle: 'एक दस्तावेड़़ अपलोड करें',
    docTypeLabel: 'दस्तावेड़़ का प्रकार',
    tapToSelect: 'छवि चुनने के लिए टैप करें',
    btnUpload: 'अपलोड करें और जांचें',
    btnUploading: 'जांच हो रही है…',

    validityValid: 'वैध',
    validityExpired: 'समाप्त',
    validityNeedsReview: 'समीक्षा आवश्यक',
    validityPending: 'प्रतीक्षा',
    validityInvalid: 'अमान्य',
    actionRequired: 'कार्रवाई आवश्यक',
    needsReviewMsg:
      'कुछ जानकारी स्पष्ट नहीं पड़ी जा सकी। कृपया नीचे दी गई जानकारी सत्यापित करें।',
    noFields: 'इस छवि से कोई जानकारी निकाली नहीं जा सकी।',
    remediationInsurance:
      'मोटर वाहन अधिनियम के तहत बीमा अनिवार्य है। अपनी पॉलिसी तुरंत नवीनीकृत करें।',
    remediationDl:
      'समाप्त लाइसेंस MV अधिनियम धारा 3 के तहत अपराध है। फॉर्म 9, पुराना लाइसेंस और दस्तावेड़़ लेकर नज़दीकी RTO जाएं।',
    remediationPuc:
      'MV अधिनियम धारा 190 के तहत वैध PUC प्रमाण-पत्र आवश्यक है। किसी अधिकृत PUC केंद्र जाएं — नवीनीकरण में लगभग 15 मिनट लगते हैं।',
    remediationRcBook:
      'आपके वाहन का पंजीकरण समाप्त हो गया है। वाहन चलाने से पहले नज़दीकी RTO से नवीनीकरण करवाएं।',

    notifBlocked: 'ब्राउज़र सेटिंग में सूचनाएं अवरुद्ध हैं।',
    notifEnabled: 'इस केस के लिए सूचनाएं सक्षम हैं।',
    notifEnable: 'सूचनाएं सक्षम करें',
    notifEnabling: 'सक्षम हो रहा है…',

    draftDownload: 'ड्राफ़्ट पत्र डाउनलोड करें',
    draftGenerating: 'PDF बन रही है…',
    draftError: 'डाउनलोड विफल। कृपया फिर से कोशिश करें।',

    rejectionTitle: 'अस्वीकार क्यों हुआ?',
    rejectionNextSteps: 'आगे क्या करें',
    rejectionRuleSection: 'नियम / धारा:',

    dismissAriaLabel: 'सूचना खारिज करें',

    voiceDenied: 'माइक्रोफ़ोन एक्सेस अस्वीकृत। कृपया माइक्रोफ़ोन की अनुमति दें और फिर से कोशिश करें।',
    voiceError: 'ऑडियो समझ नहीं आई। कृपया फिर से कोशिश करें या उत्तर टाइप करें।',
    voiceConfirmLabel: 'अपना संदेश पुष्टि करें:',
    voiceSend: 'भेजें',
    voiceReRecord: 'फिर से रिकॉर्ड करें',
    voiceTryAgain: 'फिर कोशिश करें',
    voiceStartLabel: 'वॉइस इनपुट शुरू करें',
    voiceStopLabel: 'रिकॉर्डिंग रोकें',
    voiceTranscribingLabel: 'ट्रांसक्राइब हो रहा है…',
    voiceEditLabel: 'भेजने से पहले संपादित करें',
    voiceConfirmSendLabel: 'पुष्टि करें और भेजें',

    docTypes: {
      insurance: 'बीमा प्रमाण-पत्र',
      dl: 'ड्राइविंग लाइसेंस',
      rc_book: 'RC बुक',
      puc: 'PUC प्रमाण-पत्र',
      challan_receipt: 'चालान रसीद',
      rejection_slip: 'अस्वीकृति पत्र',
    } as Record<string, string>,

    domains: {
      vehicle_traffic: {
        label: 'वाहन / यातायात',
        description: 'चालान, जब्ती, लाइसेंस और RC समस्याएं',
      },
      pension_welfare: {
        label: 'पेंशन / कल्याण',
        description: 'सरकारी पेंशन, कल्याण योजनाएं, आयुष्मान भारत',
      },
      utility_consumer: {
        label: 'उपभोक्ता / उपयोगिता',
        description: 'बिजली, पानी, बिलिंग विवाद, उपभोक्ता शिकायतें',
      },
    } as Record<string, { label: string; description: string }>,
  },

  te: {
    reasoningChip: 'ఇది ఎందుకు అడుగుతున్నారు?',
    thinking: 'NavyaSathi ఆలోచిస్తోంది…',
    errorSend: 'ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.',
    errorLoad: 'ఈ కేసు లోడ్ కాలేదు. కోడ్ సరిగ్గా ఉందో తనిఖీ చేయండి.',
    inputPlaceholder: 'మీ సమాధానం టైప్ చేయండి…',

    statusLabel: {
      intake: 'సమాచారం సేకరిస్తున్నారు',
      pending_docs: 'పత్రాల కోసం వేచి ఉన్నారు',
      ready: 'చర్యకు సిద్ధంగా ఉంది',
      closed: 'మూసివేయబడింది',
    } as Record<string, string>,
    sectionAlerts: 'హెచ్చరికలు',
    sectionRecorded: 'మేము నమోదు చేసినది',
    sectionConversation: 'సంభాషణ',
    sectionDocuments: 'పత్రాలు',
    sectionCaseWatch: 'కేసు వాచ్',
    btnContinueIntake: 'సమాచారం కొనసాగించండి',
    btnMarkResolved: 'పరిష్కరించబడిందని గుర్తించండి',
    btnClosing: 'మూసివేస్తున్నారు…',
    loading: 'లోడ్ అవుతోంది…',
    errorLoadCase: 'కేసు లోడ్ కాలేదు. మీ కోడ్ తనిఖీ చేయండి.',
    goHome: 'హోమ్కు వెళ్ళండి',

    uploadTitle: 'ఒక పత్రాన్ని అప్‌లోడ్ చేయండి',
    docTypeLabel: 'పత్రం రకం',
    tapToSelect: 'చిత్రాన్ని ఎంచుకోవడానికి నొక్కండి',
    btnUpload: 'అప్‌లోడ్ చేసి విశ్లేషించండి',
    btnUploading: 'విశ్లేషిస్తున్నారు…',

    validityValid: 'చెల్లుబాటు',
    validityExpired: 'గడువు మించింది',
    validityNeedsReview: 'సమీక్ష అవసరం',
    validityPending: 'పెండింగ్',
    validityInvalid: 'చెల్లదు',
    actionRequired: 'చర్య అవసరం',
    needsReviewMsg:
      'కొన్ని ఫీల్డ్‌లు స్పష్టంగా చదవలేదు. దయచేసి దిగువ వివరాలు ధ్రువీకరించండి.',
    noFields: 'ఈ చిత్రం నుండి ఏ ఫీల్డ్‌లు సేకరించలేదు.',
    remediationInsurance:
      'మోటారు వాహనాల చట్టం కింద బీమా తప్పనిసరి. మీ పాలసీని వెంటనే పునరుద్ధరించండి.',
    remediationDl:
      'గడువు మించిన లైసెన్స్ MV చట్టం సెక్షన్ 3 కింద నేరం. ఫార్మ 9, పాత లైసెన్స్ మరియు పత్రాలతో సమీప ఆర్‌టీఓకి వెళ్ళండి.',
    remediationPuc:
      'MV చట్టం సెక్షన్ 190 కింద PUC సర్టిఫికేట్ అవసరం. అధికృత PUC కేంద్రానికి వెళ్ళండి — 15 నిమిషాల్లో పూర్తవుతుంది.',
    remediationRcBook:
      'మీ వాహన పంజీకరణ గడువు మించింది. వాహనం నడపడానికి ముందు సమీప ఆర్‌టీఓ నుండి పునరుద్ధరించండి.',

    notifBlocked: 'బ్రౌజర్ సెట్టింగ్‌లలో నోటిఫికేషన్‌లు బ్లాక్ చేయబడ్డాయి.',
    notifEnabled: 'ఈ కేసుకు నోటిఫికేషన్‌లు ప్రారంభించబడ్డాయి.',
    notifEnable: 'నోటిఫికేషన్‌లు ప్రారంభించండి',
    notifEnabling: 'ప్రారంభిస్తున్నారు…',

    draftDownload: 'డ్రాఫ్ట్ లేఖ డౌన్‌లోడ్ చేయండి',
    draftGenerating: 'PDF తయారవుతోంది…',
    draftError: 'డౌన్‌లోడ్ విఫలమైంది. దయచేసి మళ్ళీ ప్రయత్నించండి.',

    rejectionTitle: 'ఎందుకు తిరస్కరించారు?',
    rejectionNextSteps: 'తర్వాత ఏం చేయాలి',
    rejectionRuleSection: 'నిబంధన / సెక్షన్:',

    dismissAriaLabel: 'హెచ్చరికను తొలగించండి',

    voiceDenied: 'మైక్రోఫోన్ యాక్సెస్ తిరస్కరించబడింది. దయచేసి మైక్రోఫోన్‌ను అనుమతించి మళ్ళీ ప్రయత్నించండి.',
    voiceError: 'ఆడియో అర్థం కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి లేదా సమాధానం టైప్ చేయండి.',
    voiceConfirmLabel: 'మీ సందేశాన్ని నిర్ధారించండి:',
    voiceSend: 'పంపండి',
    voiceReRecord: 'మళ్ళీ రికార్డ్ చేయండి',
    voiceTryAgain: 'మళ్ళీ ప్రయత్నించండి',
    voiceStartLabel: 'వాయిస్ ఇన్‌పుట్ ప్రారంభించండి',
    voiceStopLabel: 'రికార్డింగ్ ఆపండి',
    voiceTranscribingLabel: 'ట్రాన్స్‌క్రైబ్ అవుతోంది…',
    voiceEditLabel: 'పంపే ముందు సవరించండి',
    voiceConfirmSendLabel: 'నిర్ధారించి పంపండి',

    docTypes: {
      insurance: 'బీమా సర్టిఫికేట్',
      dl: 'డ్రైవింగ్ లైసెన్స్',
      rc_book: 'ఆర్‌సీ బుక్',
      puc: 'పీయూసీ సర్టిఫికేట్',
      challan_receipt: 'చలాన్ రసీదు',
      rejection_slip: 'తిరస్కరణ పత్రం',
    } as Record<string, string>,

    domains: {
      vehicle_traffic: {
        label: 'వాహనం / ట్రాఫిక్',
        description: 'చలాన్, జప్తు, లైసెన్స్ మరియు ఆర్‌సీ సమస్యలు',
      },
      pension_welfare: {
        label: 'పెన్షన్ / సంక్షేమం',
        description: 'ప్రభుత్వ పెన్షన్‌లు, సంక్షేమ పథకాలు, ఆయుష్మాన్ భారత్',
      },
      utility_consumer: {
        label: 'వినియోగదారు / యుటిలిటీ',
        description: 'విద్యుత్, నీరు, బిల్లింగ్ వివాదాలు, వినియోగదారు ఫిర్యాదులు',
      },
    } as Record<string, { label: string; description: string }>,
  },
}

export type Translations = typeof STRINGS.en

export function getT(lang?: string | null): Translations {
  const l = getLang(lang)
  return STRINGS[l] as Translations
}


# Complete FAQ Internationalization for Landing Page and Product Tour

## Overview
Add full internationalization for the FAQ sections across both the Landing Page and Product Tour pages in all 3 languages (English, Hindi, Marathi).

---

## Current Issues Identified

### 1. TourFAQ Component (Product Tour Page)
The `TourFAQ.tsx` component has **8 FAQ questions/answers hardcoded in English**:

| Question | Currently |
|----------|-----------|
| "How long does it take to set up LabFlow?" | Hardcoded English |
| "Can I migrate my existing patient data?" | Hardcoded English |
| "What training is provided?" | Hardcoded English |
| "Is there a contract or commitment?" | Hardcoded English |
| "What if I need help during setup?" | Hardcoded English |
| "How secure is my patient data?" | Hardcoded English |
| "Can I use LabFlow on mobile devices?" | Hardcoded English |
| "What happens if I exceed my plan limits?" | Hardcoded English |

### 2. Landing Page FAQs
The landing page FAQs come from the database (`landing_faqs` table). These are CMS-managed and won't be translated via i18n files - they require database-level localization (separate task).

---

## Implementation Plan

### Files to Modify

| File | Changes |
|------|---------|
| `src/i18n/locales/en.json` | Add `productTour.tourFaq.items` array with all 8 Q&A pairs |
| `src/i18n/locales/hi.json` | Add Hindi translations for all 8 Q&A pairs |
| `src/i18n/locales/mr.json` | Add Marathi translations for all 8 Q&A pairs |
| `src/components/product-tour/TourFAQ.tsx` | Replace hardcoded array with translation keys |

---

## Translation Content

### New Keys to Add

Add under `productTour.tourFaq.items`:

```json
"items": [
  {
    "question": "How long does it take to set up LabFlow?",
    "answer": "Most labs are fully operational within 3 days..."
  },
  // ... 7 more items
]
```

### Hindi Translations

```json
"items": [
  {
    "question": "LabFlow सेटअप करने में कितना समय लगता है?",
    "answer": "अधिकांश लैब 3 दिनों के भीतर पूरी तरह से चालू हो जाती हैं। दिन 1 में खाता सेटअप और बुनियादी कॉन्फ़िगरेशन (लगभग 30 मिनट)। दिन 2 स्टाफ जोड़ने और सेटिंग्स कस्टमाइज़ करने के लिए। दिन 3, आप मरीज पंजीकरण और रिपोर्टिंग के लिए तैयार हैं।"
  },
  {
    "question": "क्या मैं अपने मौजूदा मरीज डेटा को माइग्रेट कर सकता हूं?",
    "answer": "हां! हम सभी नए ग्राहकों के लिए मुफ्त डेटा माइग्रेशन सहायता प्रदान करते हैं। हमारी टीम Excel शीट या अन्य सिस्टम से मरीज रिकॉर्ड, टेस्ट हिस्ट्री और बिलिंग डेटा इम्पोर्ट करने में मदद कर सकती है। डेटा वॉल्यूम के आधार पर प्रक्रिया में आमतौर पर 1-2 दिन लगते हैं।"
  },
  {
    "question": "कौन सी ट्रेनिंग प्रदान की जाती है?",
    "answer": "हम व्यापक प्रशिक्षण प्रदान करते हैं जिसमें शामिल हैं: सभी सुविधाओं के लिए वीडियो ट्यूटोरियल, आपकी टीम के लिए लाइव ऑनबोर्डिंग सेशन, 24/7 चैट सपोर्ट, और विस्तृत दस्तावेज़ीकरण। अधिकांश उपयोगकर्ता नियमित उपयोग के 2-3 दिनों के भीतर कुशल हो जाते हैं।"
  },
  {
    "question": "क्या कोई अनुबंध या प्रतिबद्धता है?",
    "answer": "कोई दीर्घकालिक अनुबंध आवश्यक नहीं है। हम लचीली मासिक और वार्षिक योजनाएं प्रदान करते हैं। सभी सुविधाओं का अनुभव करने के लिए 14-दिन के मुफ्त ट्रायल से शुरू करें। बिना किसी छिपी फीस के कभी भी रद्द करें। वार्षिक योजनाओं के साथ 2 महीने मुफ्त मिलते हैं।"
  },
  {
    "question": "अगर मुझे सेटअप के दौरान मदद चाहिए तो क्या होगा?",
    "answer": "हमारी सपोर्ट टीम बिजनेस आवर्स के दौरान चैट, ईमेल और फोन पर उपलब्ध है। गंभीर मुद्दों के लिए, हम प्राथमिकता सपोर्ट प्रदान करते हैं। एंटरप्राइज ग्राहकों को व्यक्तिगत सहायता के लिए एक समर्पित अकाउंट मैनेजर मिलता है।"
  },
  {
    "question": "मेरा मरीज डेटा कितना सुरक्षित है?",
    "answer": "सुरक्षा हमारी सर्वोच्च प्राथमिकता है। हम बैंक-ग्रेड एन्क्रिप्शन (AES-256), नियमित स्वचालित बैकअप, भूमिका-आधारित एक्सेस नियंत्रण, पूर्ण ऑडिट लॉग, और HIPAA-तैयार इंफ्रास्ट्रक्चर का उपयोग करते हैं। आपका डेटा SOC 2 प्रमाणित डेटा सेंटर में संग्रहीत है।"
  },
  {
    "question": "क्या मैं मोबाइल डिवाइस पर LabFlow का उपयोग कर सकता हूं?",
    "answer": "हां! LabFlow पूरी तरह से रिस्पॉन्सिव है और स्मार्टफोन और टैबलेट पर काम करता है। हम एक प्रोग्रेसिव वेब ऐप (PWA) भी प्रदान करते हैं जिसे आप ऐप स्टोर से डाउनलोड किए बिना ऐप जैसे अनुभव के लिए अपने डिवाइस पर इंस्टॉल कर सकते हैं।"
  },
  {
    "question": "अगर मैं अपनी योजना की सीमा पार कर दूं तो क्या होगा?",
    "answer": "सीमा के करीब पहुंचने पर हम आपको सूचित करेंगे। आप विकास को समायोजित करने के लिए किसी भी समय आसानी से अपनी योजना अपग्रेड कर सकते हैं। कोई छिपी ओवरेज चार्ज नहीं है - हम बिना किसी आश्चर्य के पारदर्शी मूल्य निर्धारण में विश्वास करते हैं।"
  }
]
```

### Marathi Translations

```json
"items": [
  {
    "question": "LabFlow सेटअप करायला किती वेळ लागतो?",
    "answer": "बहुतेक लॅब 3 दिवसांत पूर्णपणे ऑपरेशनल होतात. दिवस 1 मध्ये खाते सेटअप आणि मूलभूत कॉन्फिगरेशन (सुमारे 30 मिनिटे). दिवस 2 स्टाफ जोडणे आणि सेटिंग्ज सानुकूलित करण्यासाठी. दिवस 3, तुम्ही रुग्ण नोंदणी आणि रिपोर्टिंगसाठी तयार आहात."
  },
  {
    "question": "मी माझा विद्यमान रुग्ण डेटा मायग्रेट करू शकतो का?",
    "answer": "होय! आम्ही सर्व नवीन ग्राहकांसाठी मोफत डेटा मायग्रेशन सहाय्य देतो. आमची टीम Excel शीट्स किंवा इतर सिस्टम्समधून रुग्ण रेकॉर्ड्स, चाचणी इतिहास आणि बिलिंग डेटा इम्पोर्ट करण्यात मदत करू शकते. डेटा व्हॉल्यूमवर अवलंबून प्रक्रियेला साधारणपणे 1-2 दिवस लागतात."
  },
  {
    "question": "कोणते प्रशिक्षण दिले जाते?",
    "answer": "आम्ही सर्वसमावेशक प्रशिक्षण देतो ज्यात समाविष्ट आहे: सर्व वैशिष्ट्यांसाठी व्हिडिओ ट्यूटोरियल, तुमच्या टीमसाठी लाइव्ह ऑनबोर्डिंग सेशन्स, 24/7 चॅट सपोर्ट आणि तपशीलवार दस्तऐवजीकरण. बहुतेक वापरकर्ते नियमित वापराच्या 2-3 दिवसांत प्रवीण होतात."
  },
  {
    "question": "करार किंवा बांधिलकी आहे का?",
    "answer": "दीर्घकालीन करार आवश्यक नाहीत. आम्ही लवचिक मासिक आणि वार्षिक योजना देतो. सर्व वैशिष्ट्यांचा अनुभव घेण्यासाठी 14-दिवसांच्या मोफत ट्रायलने सुरू करा. कोणत्याही लपविलेल्या शुल्काशिवाय कधीही रद्द करा. वार्षिक योजनांसह 2 महिने मोफत मिळतात."
  },
  {
    "question": "सेटअप दरम्यान मला मदत हवी असल्यास काय?",
    "answer": "आमची सपोर्ट टीम बिझनेस अवर्समध्ये चॅट, ईमेल आणि फोनद्वारे उपलब्ध आहे. गंभीर समस्यांसाठी, आम्ही प्राधान्य सपोर्ट देतो. एंटरप्राइज ग्राहकांना वैयक्तिक सहाय्यासाठी समर्पित अकाउंट मॅनेजर मिळतो."
  },
  {
    "question": "माझा रुग्ण डेटा किती सुरक्षित आहे?",
    "answer": "सुरक्षितता ही आमची सर्वोच्च प्राधान्य आहे. आम्ही बँक-ग्रेड एनक्रिप्शन (AES-256), नियमित स्वयंचलित बॅकअप्स, भूमिका-आधारित ऍक्सेस नियंत्रण, संपूर्ण ऑडिट लॉग्स आणि HIPAA-तयार इन्फ्रास्ट्रक्चर वापरतो. तुमचा डेटा SOC 2 प्रमाणित डेटा सेंटर्समध्ये संग्रहित आहे."
  },
  {
    "question": "मी मोबाइल डिव्हाइसवर LabFlow वापरू शकतो का?",
    "answer": "होय! LabFlow पूर्णपणे रिस्पॉन्सिव्ह आहे आणि स्मार्टफोन आणि टॅबलेटवर काम करतो. आम्ही प्रोग्रेसिव्ह वेब अॅप (PWA) देखील देतो जे तुम्ही अॅप स्टोअर्समधून डाउनलोड न करता अॅपसारख्या अनुभवासाठी तुमच्या डिव्हाइसवर इंस्टॉल करू शकता."
  },
  {
    "question": "मी माझ्या प्लॅनच्या मर्यादा ओलांडल्यास काय होईल?",
    "answer": "मर्यादेच्या जवळ येताना आम्ही तुम्हाला सूचित करू. वाढ सामावून घेण्यासाठी तुम्ही कधीही सहजपणे तुमची योजना अपग्रेड करू शकता. कोणतेही लपविलेले ओव्हरेज चार्जेस नाहीत - आम्ही कोणत्याही आश्चर्याशिवाय पारदर्शक किंमतीवर विश्वास ठेवतो."
  }
]
```

---

## Component Update

### TourFAQ.tsx Changes

Replace the hardcoded `faqItems` array with translations:

```tsx
const TourFAQ = () => {
  const { t } = useTranslation();
  
  // Get FAQ items from translations (returns array)
  const faqItems = t('productTour.tourFaq.items', { returnObjects: true }) as Array<{
    question: string;
    answer: string;
  }>;

  return (
    <section className="py-20 px-4" aria-labelledby="faq-heading">
      {/* ... header using existing t() calls ... */}
      
      <Accordion type="single" collapsible className="space-y-4">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`} ...>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};
```

---

## Note on Landing Page FAQs

The landing page FAQ section (`FAQSection.tsx`) receives FAQ data from the database (`landing_faqs` table). To internationalize those:

**Option A (Recommended)**: Add `question_hi`, `question_mr`, `answer_hi`, `answer_mr` columns to the `landing_faqs` table and update the query to select based on current language.

**Option B**: Replace database FAQs with static translations like TourFAQ.

This plan focuses on TourFAQ. Landing page database-driven FAQs can be addressed in a separate task.

---

## Summary of Changes

| File | Action |
|------|--------|
| `src/i18n/locales/en.json` | Add `productTour.tourFaq.items` array (8 Q&A pairs) |
| `src/i18n/locales/hi.json` | Add Hindi `productTour.tourFaq.items` translations |
| `src/i18n/locales/mr.json` | Add Marathi `productTour.tourFaq.items` translations |
| `src/components/product-tour/TourFAQ.tsx` | Use `t('productTour.tourFaq.items', { returnObjects: true })` |

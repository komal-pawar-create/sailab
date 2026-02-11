

# Localize Landing Page FAQs (Database-Level i18n)

## Overview
Add Hindi and Marathi translation columns to the `landing_faqs` database table, then update the frontend to display FAQ content in the user's selected language.

---

## Step 1: Database Migration

Add 4 new nullable columns to `landing_faqs`:

```sql
ALTER TABLE landing_faqs
  ADD COLUMN question_hi text,
  ADD COLUMN answer_hi text,
  ADD COLUMN question_mr text,
  ADD COLUMN answer_mr text;
```

Then populate them with Hindi/Marathi translations for the existing 8 FAQ rows using UPDATE statements.

### Translation Data

| English Question | Hindi | Marathi |
|---|---|---|
| What payment methods do you accept? | आप कौन से भुगतान तरीके स्वीकार करते हैं? | तुम्ही कोणत्या पेमेंट पद्धती स्वीकारता? |
| Is there a free trial available? | क्या मुफ्त ट्रायल उपलब्ध है? | मोफत ट्रायल उपलब्ध आहे का? |
| Can I upgrade or downgrade my plan? | क्या मैं अपनी योजना अपग्रेड या डाउनग्रेड कर सकता हूं? | मी माझा प्लॅन अपग्रेड किंवा डाउनग्रेड करू शकतो का? |
| Is my data secure? | क्या मेरा डेटा सुरक्षित है? | माझा डेटा सुरक्षित आहे का? |
| Can I integrate with other software? | क्या मैं अन्य सॉफ्टवेयर के साथ इंटीग्रेट कर सकता हूं? | मी इतर सॉफ्टवेअरसह इंटिग्रेट करू शकतो का? |
| Do you support multiple branches? | क्या आप मल्टीपल ब्रांच सपोर्ट करते हैं? | तुम्ही मल्टिपल ब्रांच सपोर्ट करता का? |
| What kind of support do you offer? | आप किस प्रकार का सपोर्ट प्रदान करते हैं? | तुम्ही कोणत्या प्रकारचा सपोर्ट देता? |
| Is training provided? | क्या ट्रेनिंग प्रदान की जाती है? | प्रशिक्षण दिले जाते का? |

Full answer translations will also be provided for all 8 items.

---

## Step 2: Update FaqItem Type

In `src/components/landing/types.ts`, extend the `FaqItem` interface:

```typescript
export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  question_hi?: string;
  answer_hi?: string;
  question_mr?: string;
  answer_mr?: string;
}
```

---

## Step 3: Update FAQSection Component

In `src/components/landing/FAQSection.tsx`, add language-aware text selection:

```tsx
const { t, i18n } = useTranslation();

// Helper to get localized FAQ text
const getLocalizedFaq = (faq: FaqItem) => {
  const lang = i18n.language;
  if (lang === 'hi') {
    return {
      question: faq.question_hi || faq.question,
      answer: faq.answer_hi || faq.answer,
    };
  }
  if (lang === 'mr') {
    return {
      question: faq.question_mr || faq.question,
      answer: faq.answer_mr || faq.answer,
    };
  }
  return { question: faq.question, answer: faq.answer };
};
```

Then use `getLocalizedFaq(faq).question` and `getLocalizedFaq(faq).answer` in the JSX instead of `faq.question` and `faq.answer`.

---

## Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `question_hi`, `answer_hi`, `question_mr`, `answer_mr` columns + populate translations |
| `src/components/landing/types.ts` | Add 4 optional fields to `FaqItem` |
| `src/components/landing/FAQSection.tsx` | Add `getLocalizedFaq` helper, use localized text |


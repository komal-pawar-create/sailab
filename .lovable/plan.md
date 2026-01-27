
# Complete Multi-Language Support for Product Tour Components

## Overview
The translation infrastructure and translation keys are already in place in the locale files (en.json, hi.json, mr.json). The remaining work is to integrate the `useTranslation` hook into each Product Tour component and replace hardcoded English strings with `t()` function calls.

## Components to Update (9 Total)

### 1. VideoGallery.tsx
**Current State:** Hardcoded strings for section title, subtitle, tab labels
**Translation Keys to Use:**
- `productTour.videoGallery.badge` → "Video Demos"
- `productTour.videoGallery.title` → "See LabFlow in Action"
- `productTour.videoGallery.subtitle` → description text
- `productTour.videoGallery.featureDemos` → "Feature Demos"
- `productTour.videoGallery.testimonials` → "Testimonials"

### 2. PlatformPreview.tsx
**Current State:** Hardcoded module names, descriptions, hotspot labels
**Translation Keys to Use:**
- `productTour.platformPreview.badge` → "Interactive Preview"
- `productTour.platformPreview.title` → "Explore the Platform"
- `productTour.platformPreview.subtitle` → description text
- `productTour.platformPreview.modules.*` → Dashboard, Patients, Billing, Reports, Analytics

**Additional keys needed for hotspots (add to locale files):**
- Dashboard hotspots: Quick Stats, Revenue Analytics, Activity Feed, Test Distribution
- Patients hotspots: Smart Search, Patient List, Filter Options, Quick Add
- Billing hotspots: Create Bill, Line Items, Bill Preview, Payment Options
- Reports hotspots: Report Filters, Status Tracking, Patient Reports, Quick Navigation
- Analytics hotspots: Test Volumes, Test Distribution, KPI Cards, Revenue Trends

### 3. StakeholderTabs.tsx (largest component)
**Current State:** Hardcoded stakeholder names, taglines, features, workflow steps
**Translation Keys to Use:**
- `productTour.stakeholders.badge` → "Role-Based Features"
- `productTour.stakeholders.title` → "Built for Everyone"
- `productTour.stakeholders.subtitle` → description
- `productTour.stakeholders.owner/admin/operator/patient` → role names
- `productTour.stakeholders.videoTutorials` → "Video Tutorials"
- `productTour.stakeholders.videos` → "Videos"

**Additional keys needed (add to locale files):**
- Stakeholder taglines, features, workflow steps, time saved, key benefits

### 4. ROICalculator.tsx
**Current State:** Hardcoded labels for sliders, results sections
**Translation Keys to Use:**
- `productTour.roi.badge` → "ROI Calculator"
- `productTour.roi.title` → "Calculate Your"
- `productTour.roi.titleHighlight` → "Savings"
- `productTour.roi.subtitle` → description
- `productTour.roi.yourLabDetails` → "Your Lab Details"
- `productTour.roi.adjustSliders` → slider instructions
- `productTour.roi.patientsPerDay/staffMembers/minutesPerPatient` → slider labels
- `productTour.roi.estimatedSavings` → "Your Estimated Savings"
- `productTour.roi.timeSavedPerMonth/laborCostSaved/billingErrorSavings/totalMonthlySavings` → result labels
- `productTour.roi.morePatients` → capacity increase message

### 5. BeforeAfterSlider.tsx
**Current State:** Hardcoded comparison labels, section headers
**Translation Keys to Use:**
- `productTour.beforeAfter.badge` → "Visual Comparison"
- `productTour.beforeAfter.title` → "Paper Registers vs LabFlow"
- `productTour.beforeAfter.subtitle` → instruction text
- `productTour.beforeAfter.paperRegisters` → "Paper Registers"
- `productTour.beforeAfter.manualProcesses` → "Manual Processes"
- `productTour.beforeAfter.labflow` → "LabFlow"
- `productTour.beforeAfter.digitalPlatform` → "Digital Platform"
- `productTour.beforeAfter.hoursLost` → "3+ hours lost daily"
- `productTour.beforeAfter.hoursSaved` → "Save 3+ hours every day"
- `productTour.beforeAfter.dragSlider` → drag instruction

**Additional keys needed (add to locale files):**
- Comparison items: Patient Registration, Bill Generation, Report Creation, Finding Patient Records, Daily Revenue Calculation, Error Rate

### 6. PatientJourneyFlow.tsx
**Current State:** Hardcoded step titles, descriptions, details
**Translation Keys to Use:**
- `productTour.patientJourney.badge` → "Complete Workflow"
- `productTour.patientJourney.title` → "The Complete Patient Journey"
- `productTour.patientJourney.subtitle` → description
- `productTour.patientJourney.totalTime` → "Total Time:"
- `productTour.patientJourney.under5Min` → "Under 5 minutes"
- `productTour.patientJourney.fromRegistration` → "from registration to report delivery"
- `productTour.patientJourney.steps.*` → step titles, durations, descriptions

**Additional keys needed (add to locale files):**
- Step details arrays for each journey step

### 7. ComparisonTable.tsx
**Current State:** Hardcoded feature names, categories, stat labels
**Translation Keys to Use:**
- `productTour.comparison.badge` → "Why Choose LabFlow"
- `productTour.comparison.title` → "See How LabFlow Compares"
- `productTour.comparison.subtitle` → description
- `productTour.comparison.labflow/manualProcess/competitor` → column headers
- `productTour.comparison.dailyTimeSaved/errorReduction/productivityBoost/fasterReports` → stat labels

**Additional keys needed (add to locale files):**
- All comparison categories and feature names
- Tooltip descriptions and use cases

### 8. SetupTimeline.tsx
**Current State:** Hardcoded day titles, descriptions, step tasks
**Translation Keys to Use:**
- `productTour.setupTimeline.badge` → "Getting Started"
- `productTour.setupTimeline.title` → "Up and Running in"
- `productTour.setupTimeline.titleHighlight` → "3 Days"
- `productTour.setupTimeline.subtitle` → description
- `productTour.setupTimeline.day1/day2/day3.title` → day titles
- `productTour.setupTimeline.day1/day2/day3.description` → day descriptions

**Additional keys needed (add to locale files):**
- Step titles, durations, and task lists for each day

### 9. ExpectationsGrid.tsx
**Current State:** Hardcoded timeframe titles, achievements
**Translation Keys to Use:**
- `productTour.expectations.badge` → "What to Expect"
- `productTour.expectations.title` → "Your Journey with"
- `productTour.expectations.titleHighlight` → "LabFlow"
- `productTour.expectations.subtitle` → description
- `productTour.expectations.firstHour/firstDay/firstWeek/firstMonth` → timeframe labels

**Additional keys needed (add to locale files):**
- Achievement titles and lists for each timeframe

---

## Implementation Steps

### Phase 1: Extend Translation Files
Add missing translation keys to all three locale files:

**en.json additions:**
```json
"productTour": {
  ...existing keys...,
  "beforeAfter": {
    ...existing...,
    "items": {
      "patientRegistration": "Patient Registration",
      "billGeneration": "Bill Generation",
      "reportCreation": "Report Creation",
      "findingRecords": "Finding Patient Records",
      "revenueCalculation": "Daily Revenue Calculation",
      "errorRate": "Error Rate"
    },
    "values": {
      "patientRegBefore": "10-15 min",
      "patientRegAfter": "< 30 sec",
      "patientRegImprovement": "95% faster",
      ...etc
    }
  },
  "patientJourney": {
    ...existing...,
    "steps": {
      "register": {
        ...existing...,
        "details": [
          "Enter phone number for instant lookup",
          "Auto-generate unique patient ID",
          "Capture doctor referral details",
          "Add medical history notes"
        ]
      },
      ...etc
    }
  },
  "stakeholders": {
    ...existing...,
    "roles": {
      "owner": {
        "name": "Lab Owners",
        "tagline": "Complete visibility and control over your laboratory business",
        "timeSaved": "3+ hours daily",
        "keyBenefit": "60% reduction in billing errors",
        "features": [...],
        "workflowSteps": [...]
      },
      ...etc
    }
  },
  "setupTimeline": {
    ...existing...,
    "days": {
      "day1": {
        "steps": [
          { "title": "Create Account", "duration": "2 min", "tasks": [...] },
          ...
        ]
      },
      ...
    }
  },
  "expectations": {
    ...existing...,
    "milestones": {
      "firstHour": {
        "title": "Account Ready",
        "achievements": [
          "Account created and verified",
          "Lab profile configured",
          "Basic settings completed",
          "Dashboard accessible"
        ]
      },
      ...
    }
  },
  "platformPreview": {
    ...existing...,
    "moduleDescriptions": {...},
    "hotspots": {
      "dashboard": {...},
      "patients": {...},
      ...
    }
  },
  "comparison": {
    ...existing...,
    "categories": {
      "patientManagement": "Patient Management",
      "billingPayments": "Billing & Payments",
      ...
    },
    "features": {...}
  }
}
```

### Phase 2: Update Components
For each component:
1. Import `useTranslation` from `react-i18next`
2. Get `t` function via `const { t } = useTranslation()`
3. Replace hardcoded strings with `t('productTour.section.key')` calls
4. For arrays, use `t('key', { returnObjects: true }) as string[]`

### Phase 3: Testing
- Test language switching on Product Tour page
- Verify all 3 languages render correctly
- Check for any missing translations (fallback to English)

---

## Files to Modify

| File | Action |
|------|--------|
| `src/i18n/locales/en.json` | Add extended translation keys |
| `src/i18n/locales/hi.json` | Add extended Hindi translations |
| `src/i18n/locales/mr.json` | Add extended Marathi translations |
| `src/components/product-tour/VideoGallery.tsx` | Integrate useTranslation |
| `src/components/product-tour/PlatformPreview.tsx` | Integrate useTranslation |
| `src/components/product-tour/StakeholderTabs.tsx` | Integrate useTranslation |
| `src/components/product-tour/ROICalculator.tsx` | Integrate useTranslation |
| `src/components/product-tour/BeforeAfterSlider.tsx` | Integrate useTranslation |
| `src/components/product-tour/PatientJourneyFlow.tsx` | Integrate useTranslation |
| `src/components/product-tour/ComparisonTable.tsx` | Integrate useTranslation |
| `src/components/product-tour/SetupTimeline.tsx` | Integrate useTranslation |
| `src/components/product-tour/ExpectationsGrid.tsx` | Integrate useTranslation |

---

## Technical Notes

- Components with complex data structures (StakeholderTabs, ComparisonTable) will require careful handling of nested translation objects
- Some components use static arrays that will need to be converted to translation-based dynamic arrays
- The `returnObjects: true` option in i18next allows retrieving arrays/objects from translations
- Existing pattern from TourHero.tsx and TourCTA.tsx should be followed for consistency

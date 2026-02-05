
# Full i18n Coverage for All Pages, Buttons & Menus

## Overview
Extend the existing multi-language support (English, Hindi, Marathi) from landing/product tour pages to ALL application pages including Authentication, Dashboard, Sidebar Navigation, Reports, Patient History, and all dialogs/buttons.

---

## Current State

### Already Translated
- Landing page (Index.tsx) - All sections
- Product Tour page - All components
- Language selector - Working

### Not Translated (Need Updates)
| Page/Component | Hardcoded Strings |
|----------------|-------------------|
| Auth.tsx | "Back to Home", "Sign In", "Username", "Password", "Forgot Password?", loading states |
| ForgotPassword.tsx | "Reset Password", "Back to login", OTP flow messages |
| Dashboard.tsx | "Dashboard", "Welcome back", "Refresh", "Analytics" |
| AppSidebar.tsx | Menu items: "Dashboard", "Reports", "Patient History", role labels |
| MobileBottomNav.tsx | "Dashboard", "Reports", "Add", "History", "More", quick actions |
| DashboardFilters.tsx | "Today", "This Week", "This Month", "All Branches" |
| DataTabs.tsx | Tab labels: "Patients", "Test Reports", "Documents", "Bills" |
| QuickActions.tsx | "Quick Actions", "New Patient", "New Test", "New Bill", dialog titles |
| Reports.tsx | "Reports", tab labels |
| NotFound.tsx | "404", "Oops! Page not found", "Return to Home" |
| ExportButtons.tsx | "Excel", "PDF", "Print" |

---

## Implementation Plan

### Phase 1: Add Translation Keys to JSON Files

Add new `app` section to all 3 language files with comprehensive keys:

```json
{
  "app": {
    "common": {
      "loading": "Loading...",
      "refresh": "Refresh",
      "search": "Search",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "back": "Back",
      "backToHome": "Back to Home",
      "backToLogin": "Back to login",
      "submit": "Submit",
      "sending": "Sending..."
    },
    "auth": {
      "signIn": "Sign In",
      "signOut": "Sign Out",
      "signingIn": "Signing In...",
      "username": "Username",
      "password": "Password",
      "forgotPassword": "Forgot Password?",
      "resetPassword": "Reset Password",
      "newPassword": "New Password",
      "confirmPassword": "Confirm Password",
      "accountLocked": "Account Locked",
      "accessSystem": "Access your laboratory management system",
      "attemptsRemaining": "{count} login attempt(s) remaining before temporary lockout.",
      "lockedMessage": "Account locked. Try again in",
      "sendOtp": "Send OTP",
      "otpCode": "OTP Code",
      "enterOtp": "Enter 6-digit OTP",
      "enterUsername": "Enter your username to receive an OTP",
      "otpSentTo": "Enter the OTP sent to {phone}"
    },
    "sidebar": {
      "main": "Main",
      "administration": "Administration",
      "superAdmin": "Super Admin",
      "dashboard": "Dashboard",
      "reports": "Reports",
      "outstandingReport": "Outstanding Report",
      "patientHistory": "Patient History",
      "followups": "Follow-ups",
      "analytics": "Analytics",
      "labProfile": "Lab Profile",
      "branchSettings": "Branch Settings",
      "apiSettings": "API Settings",
      "auditLogs": "Audit Logs",
      "salesLeads": "Sales & Leads",
      "subscriptions": "Subscriptions",
      "landingPage": "Landing Page",
      "dataManagement": "Data Management"
    },
    "roles": {
      "super_admin": "Super Admin",
      "lab_admin": "Lab Admin",
      "admin": "Admin",
      "operator_1": "Operator 1",
      "operator_2": "Operator 2",
      "operator_3": "Operator 3",
      "branch_operator": "Branch Operator"
    },
    "dashboard": {
      "title": "Dashboard",
      "welcomeBack": "Welcome back, {name}",
      "today": "Today",
      "thisWeek": "This Week",
      "thisMonth": "This Month",
      "lastMonth": "Last Month",
      "lastQuarter": "Last Quarter",
      "lastYear": "Last Year",
      "allTime": "All Time",
      "allBranches": "All Branches",
      "selectBranch": "Select branch"
    },
    "tabs": {
      "patients": "Patients",
      "testReports": "Test Reports",
      "documents": "Documents",
      "bills": "Bills",
      "followups": "Follow-ups",
      "feedback": "Feedback",
      "ledger": "Ledger"
    },
    "quickActions": {
      "title": "Quick Actions",
      "newPatient": "New Patient",
      "newTest": "New Test",
      "newBill": "New Bill",
      "uploadDoc": "Upload Doc",
      "addPatient": "Add New Patient",
      "addTestReport": "Add Test Report",
      "createBill": "Create Bill",
      "uploadDocument": "Upload Document"
    },
    "mobileNav": {
      "dashboard": "Dashboard",
      "reports": "Reports",
      "add": "Add",
      "history": "History",
      "more": "More",
      "newPatient": "New Patient",
      "newBill": "New Bill",
      "newTestReport": "New Test Report",
      "uploadDocument": "Upload Document"
    },
    "reports": {
      "title": "Reports",
      "subtitle": "Generate and export reports in Excel or PDF format",
      "patients": "Patients",
      "bills": "Bills",
      "testReports": "Test Reports",
      "revenue": "Revenue",
      "collections": "Collections",
      "referrals": "Referrals",
      "dailyActivity": "Daily Activity"
    },
    "export": {
      "excel": "Excel",
      "pdf": "PDF",
      "print": "Print"
    },
    "notFound": {
      "title": "404",
      "message": "Oops! Page not found",
      "returnHome": "Return to Home"
    },
    "errors": {
      "failed": "Failed",
      "signOutError": "Failed to sign out",
      "passwordMismatch": "Passwords do not match"
    },
    "success": {
      "passwordReset": "Your password has been reset successfully",
      "otpSent": "OTP Sent"
    }
  }
}
```

### Phase 2: Update Components

Each component will import `useTranslation` and replace hardcoded strings:

**Example pattern for Auth.tsx:**
```typescript
import { useTranslation } from 'react-i18next';

const Auth = () => {
  const { t } = useTranslation();
  
  return (
    <Button onClick={() => navigate('/')}>
      {t('app.common.backToHome')}
    </Button>
    // ... more translations
  );
};
```

---

## Files to Modify

### Translation Files (3 files)
| File | Action |
|------|--------|
| `src/i18n/locales/en.json` | Add `app` section with all keys |
| `src/i18n/locales/hi.json` | Add `app` section with Hindi translations |
| `src/i18n/locales/mr.json` | Add `app` section with Marathi translations |

### React Components (11 files)
| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Add `useTranslation`, translate all strings |
| `src/pages/ForgotPassword.tsx` | Add `useTranslation`, translate all strings |
| `src/pages/Dashboard.tsx` | Add `useTranslation`, translate title/welcome |
| `src/pages/Reports.tsx` | Add `useTranslation`, translate tabs |
| `src/pages/NotFound.tsx` | Add `useTranslation`, translate messages |
| `src/components/AppSidebar.tsx` | Add `useTranslation`, translate menu items |
| `src/components/MobileBottomNav.tsx` | Add `useTranslation`, translate nav items |
| `src/components/dashboard/DashboardFilters.tsx` | Add `useTranslation`, translate filters |
| `src/components/dashboard/DataTabs.tsx` | Add `useTranslation`, translate tab labels |
| `src/components/dashboard/QuickActions.tsx` | Add `useTranslation`, translate actions |
| `src/components/reports/ExportButtons.tsx` | Add `useTranslation`, translate buttons |

---

## Translation Samples

### Hindi (hi.json) - Key Additions
```json
"app": {
  "common": {
    "loading": "लोड हो रहा है...",
    "backToHome": "होम पर वापस जाएं"
  },
  "auth": {
    "signIn": "साइन इन",
    "username": "उपयोगकर्ता नाम",
    "password": "पासवर्ड",
    "forgotPassword": "पासवर्ड भूल गए?"
  },
  "dashboard": {
    "title": "डैशबोर्ड",
    "welcomeBack": "वापसी पर स्वागत है, {name}",
    "today": "आज"
  }
}
```

### Marathi (mr.json) - Key Additions
```json
"app": {
  "common": {
    "loading": "लोड होत आहे...",
    "backToHome": "मुख्यपृष्ठावर परत जा"
  },
  "auth": {
    "signIn": "साइन इन करा",
    "username": "वापरकर्तानाव",
    "password": "पासवर्ड",
    "forgotPassword": "पासवर्ड विसरलात?"
  },
  "dashboard": {
    "title": "डॅशबोर्ड",
    "welcomeBack": "पुन्हा स्वागत आहे, {name}",
    "today": "आज"
  }
}
```

---

## Component Update Pattern

### Before (Hardcoded)
```tsx
<span>Dashboard</span>
<p>Welcome back, {profile.full_name}</p>
```

### After (Translated)
```tsx
const { t } = useTranslation();
// ...
<span>{t('app.sidebar.dashboard')}</span>
<p>{t('app.dashboard.welcomeBack', { name: profile.full_name })}</p>
```

---

## Benefits

1. **Consistent UX**: All pages match user's language preference
2. **Seamless Switching**: Language change reflects across entire app
3. **Maintainable**: Centralized translation files
4. **Extensible**: Easy to add more languages later

---

## Estimated Scope

- **~150+ new translation keys** across 3 languages
- **14 files to modify** (3 JSON + 11 TSX)
- All user-facing text will be translatable

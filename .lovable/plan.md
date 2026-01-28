

# Update All 4 Product Tour Videos with New YouTube URL

## Overview
Replace the placeholder YouTube URLs (rickroll) on all 4 demo videos in the Product Tour page with the actual LabFlow demo video: `https://www.youtube.com/watch?v=wTLFV_XW2xo`

---

## Current State
The `demo_videos` table has:
- 4 original videos with placeholder rickroll URLs (`is_active = false`)
- 1 new "LabFlow Complete Demo" video (`is_active = true`)

The user wants the 4 original feature-specific videos (Patient Registration, Billing Workflow, Report Generation, Analytics Dashboard) to remain visible but with the correct YouTube URL.

---

## Implementation Steps

1. **Run a database data update** to:
   - Update all 4 placeholder videos to use the new YouTube URL
   - Reactivate them by setting `is_active = true`
   - Optionally deactivate the single "LabFlow Complete Demo" video to avoid duplication

---

## Technical Details

### Database Update SQL
```sql
-- Update all placeholder videos to use the new YouTube URL
UPDATE demo_videos 
SET 
  video_url = 'https://www.youtube.com/watch?v=wTLFV_XW2xo',
  is_active = true
WHERE video_url LIKE '%dQw4w9WgXcQ%';

-- Optionally deactivate the new single demo to avoid 5 videos showing
UPDATE demo_videos 
SET is_active = false 
WHERE title = 'LabFlow Complete Demo';
```

---

## Result
After the update:
- **Patient Registration** → New LabFlow demo video
- **Billing Workflow** → New LabFlow demo video  
- **Report Generation** → New LabFlow demo video
- **Analytics Dashboard** → New LabFlow demo video

All 4 cards will display the correct LabFlow demo video thumbnail and play the actual demo when clicked.


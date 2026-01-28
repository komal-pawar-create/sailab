
# Add YouTube Demo Video to Homepage

## Overview
Update the demo videos on the homepage to use the YouTube video URL provided: `https://www.youtube.com/watch?v=wTLFV_XW2xo`

---

## Current State
The `demo_videos` table currently contains 4 placeholder videos with fake YouTube URLs. The DemoSection component on the homepage fetches these videos and displays them in a tabbed player.

---

## Implementation Approach

### Option A: Update All Existing Videos (Simple)
Update all demo video records to use the new YouTube URL, making it the unified demo video across all tabs.

### Option B: Replace with Single Main Demo (Recommended)
Deactivate the placeholder videos and insert a single primary demo video with the correct URL. This is cleaner and more appropriate if there's only one demo video available.

---

## Implementation Steps

1. **Create a database migration** that:
   - Sets `is_active = false` for existing placeholder demo videos
   - Inserts a new primary demo video with:
     - Title: "LabFlow Demo" (or similar)
     - URL: `https://www.youtube.com/watch?v=wTLFV_XW2xo`
     - Type: `youtube`
     - Display order: 1

2. **No frontend changes required** - the DemoSection component already handles YouTube video embedding correctly using the `extractYouTubeId` function.

---

## Technical Details

### Database Migration SQL
```sql
-- Deactivate placeholder demo videos
UPDATE demo_videos 
SET is_active = false 
WHERE video_url LIKE '%dQw4w9WgXcQ%';

-- Insert the actual demo video
INSERT INTO demo_videos (
  title, 
  description, 
  video_url, 
  video_type, 
  display_order, 
  is_active, 
  duration
) VALUES (
  'LabFlow Complete Demo',
  'See how LabFlow streamlines your lab operations - from patient registration to billing and analytics.',
  'https://www.youtube.com/watch?v=wTLFV_XW2xo',
  'youtube',
  1,
  true,
  NULL
);
```

---

## Files to Modify

| File | Action |
|------|--------|
| `supabase/migrations/[timestamp]_add_youtube_demo_video.sql` | Create new migration to update demo videos |

---

## Result
After implementation, the homepage "Watch Demo" tab will play the YouTube video `https://www.youtube.com/watch?v=wTLFV_XW2xo` with proper embedding, thumbnail preview, and playback controls.

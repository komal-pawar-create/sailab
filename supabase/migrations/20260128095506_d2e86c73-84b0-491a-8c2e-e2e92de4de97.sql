-- Update all 4 placeholder videos to use the new YouTube URL and reactivate them
UPDATE demo_videos 
SET 
  video_url = 'https://www.youtube.com/watch?v=wTLFV_XW2xo',
  is_active = true,
  updated_at = now()
WHERE video_url LIKE '%dQw4w9WgXcQ%';

-- Deactivate the single "LabFlow Complete Demo" video to avoid 5 videos showing
UPDATE demo_videos 
SET is_active = false, updated_at = now()
WHERE title = 'LabFlow Complete Demo';
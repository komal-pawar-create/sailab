-- Deactivate placeholder demo videos with rickroll URL
UPDATE demo_videos 
SET is_active = false 
WHERE video_url LIKE '%dQw4w9WgXcQ%';

-- Insert the actual LabFlow demo video
INSERT INTO demo_videos (
  title, 
  description, 
  video_url, 
  video_type, 
  display_order, 
  is_active, 
  duration,
  created_by
) VALUES (
  'LabFlow Complete Demo',
  'See how LabFlow streamlines your lab operations - from patient registration to billing and analytics.',
  'https://www.youtube.com/watch?v=wTLFV_XW2xo',
  'youtube',
  1,
  true,
  NULL,
  (SELECT user_id FROM profiles WHERE role = 'super_admin' LIMIT 1)
);
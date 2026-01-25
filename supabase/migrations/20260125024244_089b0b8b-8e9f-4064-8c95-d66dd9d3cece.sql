-- Insert placeholder demo videos for different features
INSERT INTO demo_videos (title, description, video_url, video_type, is_active, display_order, duration, created_by)
VALUES 
  ('Patient Registration', 'Quick walkthrough of patient registration and ID generation', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', true, 1, '3:45', '00000000-0000-0000-0000-000000000000'),
  ('Billing Workflow', 'Complete billing process from creation to payment collection', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', true, 2, '5:20', '00000000-0000-0000-0000-000000000000'),
  ('Report Generation', 'Generate and share test reports with patients instantly', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', true, 3, '4:15', '00000000-0000-0000-0000-000000000000'),
  ('Analytics Dashboard', 'Real-time insights and business analytics overview', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', true, 4, '6:00', '00000000-0000-0000-0000-000000000000');
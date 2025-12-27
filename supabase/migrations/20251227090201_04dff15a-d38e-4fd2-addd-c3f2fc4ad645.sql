-- Create demo_videos table for Super Admin managed demo content
CREATE TABLE public.demo_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT NOT NULL CHECK (video_type IN ('youtube', 'vimeo', 'uploaded')),
  thumbnail_url TEXT,
  duration TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.demo_videos ENABLE ROW LEVEL SECURITY;

-- Public can view active demo videos (for landing page)
CREATE POLICY "Anyone can view active demo videos"
ON public.demo_videos
FOR SELECT
USING (is_active = true);

-- Super admins can manage all demo videos
CREATE POLICY "Super admins can manage demo videos"
ON public.demo_videos
FOR ALL
USING (is_super_admin(auth.uid()))
WITH CHECK (is_super_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_demo_videos_updated_at
BEFORE UPDATE ON public.demo_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
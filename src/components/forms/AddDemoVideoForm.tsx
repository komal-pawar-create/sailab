import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Video } from 'lucide-react';

interface AddDemoVideoFormProps {
  onSuccess: () => void;
}

export function AddDemoVideoForm({ onSuccess }: AddDemoVideoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    video_type: 'youtube' as 'youtube' | 'vimeo' | 'uploaded',
    thumbnail_url: '',
    duration: '',
    display_order: 0,
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.video_url.trim()) {
      toast.error('Title and Video URL are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('demo_videos').insert({
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        video_url: formData.video_url.trim(),
        video_type: formData.video_type,
        thumbnail_url: formData.thumbnail_url.trim() || null,
        duration: formData.duration.trim() || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
        created_by: user.id,
      });

      if (error) throw error;

      toast.success('Demo video added successfully');
      setFormData({
        title: '',
        description: '',
        video_url: '',
        video_type: 'youtube',
        thumbnail_url: '',
        duration: '',
        display_order: 0,
        is_active: true,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error adding demo video:', error);
      toast.error(error.message || 'Failed to add demo video');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrlPlaceholder = () => {
    switch (formData.video_type) {
      case 'youtube':
        return 'https://www.youtube.com/watch?v=VIDEO_ID';
      case 'vimeo':
        return 'https://vimeo.com/VIDEO_ID';
      case 'uploaded':
        return 'https://your-storage-url.com/video.mp4';
      default:
        return 'Enter video URL';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Add Demo Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Getting Started with Lab Master"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="video_type">Video Type *</Label>
              <Select
                value={formData.video_type}
                onValueChange={(value: 'youtube' | 'vimeo' | 'uploaded') => 
                  setFormData({ ...formData, video_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select video type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="vimeo">Vimeo</SelectItem>
                  <SelectItem value="uploaded">Direct Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">Video URL *</Label>
            <Input
              id="video_url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder={getUrlPlaceholder()}
              required
            />
            <p className="text-xs text-muted-foreground">
              {formData.video_type === 'youtube' && 'Paste the full YouTube URL or video ID'}
              {formData.video_type === 'vimeo' && 'Paste the full Vimeo URL or video ID'}
              {formData.video_type === 'uploaded' && 'Paste the direct URL to your hosted video file'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of what this video covers..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">Thumbnail URL</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                placeholder="2:45"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active (visible on landing page)</Label>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Adding...' : 'Add Demo Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

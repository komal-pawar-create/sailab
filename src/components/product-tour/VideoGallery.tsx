import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Clock, Grid, LayoutList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface DemoVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  video_type: string;
  duration: string | null;
  thumbnail_url: string | null;
  display_order: number | null;
}

// Extract YouTube video ID from URL
const getYouTubeId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

// Extract Vimeo video ID from URL
const getVimeoId = (url: string): string | null => {
  const match = url.match(/(?:vimeo\.com\/)(\d+)/);
  return match ? match[1] : null;
};

// Generate thumbnail URL based on video type
const getThumbnailUrl = (video: DemoVideo): string => {
  if (video.thumbnail_url) return video.thumbnail_url;
  
  if (video.video_type === 'youtube') {
    const videoId = getYouTubeId(video.video_url);
    if (videoId) return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  
  // Fallback placeholder
  return '/placeholder.svg';
};

// Get embed URL for video player
const getEmbedUrl = (video: DemoVideo): string | null => {
  if (video.video_type === 'youtube') {
    const videoId = getYouTubeId(video.video_url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }
  
  if (video.video_type === 'vimeo') {
    const videoId = getVimeoId(video.video_url);
    if (videoId) return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
  }
  
  if (video.video_type === 'mp4') {
    return video.video_url;
  }
  
  return null;
};

// Video Card Component
const VideoCard = ({ 
  video, 
  onPlay,
  index 
}: { 
  video: DemoVideo; 
  onPlay: (video: DemoVideo) => void;
  index: number;
}) => {
  const thumbnail = getThumbnailUrl(video);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = '/placeholder.svg';
          }}
        />
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onPlay(video)}
            className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg"
          >
            <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
          </motion.button>
        </div>
        
        {/* Duration badge */}
        {video.duration && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-md text-white text-xs font-medium">
            <Clock className="w-3 h-3" />
            {video.duration}
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{video.title}</h3>
        {video.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
        )}
      </div>
    </motion.div>
  );
};

// Video Player Modal
const VideoPlayerModal = ({ 
  video, 
  onClose 
}: { 
  video: DemoVideo | null; 
  onClose: () => void;
}) => {
  if (!video) return null;
  
  const embedUrl = getEmbedUrl(video);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white/80 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
          
          {/* Video title */}
          <div className="absolute -top-12 left-0 text-white font-medium">
            {video.title}
          </div>
          
          {/* Video player */}
          {video.video_type === 'mp4' ? (
            <video
              src={embedUrl || ''}
              controls
              autoPlay
              className="w-full h-full"
            />
          ) : (
            <iframe
              src={embedUrl || ''}
              title={video.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Main Video Gallery Component
const VideoGallery = () => {
  const [videos, setVideos] = useState<DemoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<DemoVideo | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from('demo_videos')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });
        
        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error('Error fetching demo videos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedVideo(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // Categorize videos
  const featureVideos = videos.filter(v => v.video_type !== 'testimonial');
  const testimonialVideos = videos.filter(v => v.video_type === 'testimonial');

  if (loading) {
    return (
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-48 bg-muted rounded-lg mx-auto mb-4 animate-pulse" />
          <div className="h-6 w-96 max-w-full bg-muted rounded-lg mx-auto mb-12 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-video bg-muted rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-muted/30" id="video-gallery">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4"
          >
            Video Demos
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-foreground mb-4"
          >
            See LabFlow in Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Watch quick walkthroughs of our key features and discover how LabFlow can transform your lab operations.
          </motion.p>
        </div>

        {/* View toggle */}
        <div className="flex justify-end mb-6">
          <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 px-3"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 px-3"
            >
              <LayoutList className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs for categories if testimonials exist */}
        {testimonialVideos.length > 0 ? (
          <Tabs defaultValue="features" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="features">Feature Demos</TabsTrigger>
              <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            </TabsList>
            
            <TabsContent value="features">
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              )}>
                {featureVideos.map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={setSelectedVideo}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="testimonials">
              <div className={cn(
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                  : 'flex flex-col gap-4'
              )}>
                {testimonialVideos.map((video, index) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onPlay={setSelectedVideo}
                    index={index}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className={cn(
            viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
              : 'flex flex-col gap-4'
          )}>
            {featureVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                onPlay={setSelectedVideo}
                index={index}
              />
            ))}
          </div>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}
    </section>
  );
};

export default VideoGallery;

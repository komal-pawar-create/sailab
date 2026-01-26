import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Users, Clock, Shield, Sparkles, X, Loader2 } from 'lucide-react';
import AnimatedStats from './AnimatedStats';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

// Animated 3D-like background using CSS
const AnimatedBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {/* Gradient orbs */}
    <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float-delayed" />
    <div className="absolute top-1/3 right-1/4 w-48 h-48 bg-primary/15 rounded-full blur-2xl animate-bounce-subtle" />
    
    {/* Floating particles */}
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full bg-primary/30"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3 + Math.random() * 2,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
    
    {/* Central glow */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
      <div className="w-full h-full bg-gradient-radial from-primary/10 via-accent/5 to-transparent rounded-full animate-pulse-glow" />
    </div>
    
    {/* Floating flask-like shapes */}
    <motion.div
      className="absolute top-1/4 left-1/4 w-32 h-32"
      animate={{ rotate: 360, y: [0, -20, 0] }}
      transition={{ rotate: { duration: 20, repeat: Infinity, ease: "linear" }, y: { duration: 4, repeat: Infinity } }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-accent/20 blur-sm" />
    </motion.div>
    <motion.div
      className="absolute bottom-1/3 right-1/3 w-24 h-24"
      animate={{ rotate: -360, y: [0, 15, 0] }}
      transition={{ rotate: { duration: 25, repeat: Infinity, ease: "linear" }, y: { duration: 5, repeat: Infinity } }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-br from-accent/30 to-primary/20 blur-sm" />
    </motion.div>
  </div>
);

// Animated text variations - these will be mapped to translation keys
const taglineKeys = [
  'productTour.hero.taglines.transforms',
  'productTour.hero.taglines.saves',
  'productTour.hero.taglines.grows',
  'productTour.hero.taglines.delights'
];

// Helper to extract YouTube video ID
const getYouTubeEmbedUrl = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&rel=0`;
    }
  }
  return null;
};

// Helper to extract Vimeo video ID
const getVimeoEmbedUrl = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) {
    return `https://player.vimeo.com/video/${match[1]}?autoplay=1`;
  }
  return null;
};

interface DemoVideo {
  id: string;
  title: string;
  video_url: string;
  video_type: string;
  description?: string;
}

const VideoPlayer = ({ video, onClose }: { video: DemoVideo; onClose: () => void }) => {
  const renderPlayer = () => {
    const { video_type, video_url } = video;
    
    if (video_type === 'youtube') {
      const embedUrl = getYouTubeEmbedUrl(video_url);
      if (embedUrl) {
        return (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        );
      }
    }
    
    if (video_type === 'vimeo') {
      const embedUrl = getVimeoEmbedUrl(video_url);
      if (embedUrl) {
        return (
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={video.title}
          />
        );
      }
    }
    
    // Direct MP4/video file
    if (video_type === 'mp4' || video_url.match(/\.(mp4|webm|ogg)$/i)) {
      return (
        <video
          src={video_url}
          className="w-full h-full object-contain"
          controls
          autoPlay
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      );
    }
    
    // Fallback for unknown types - try iframe
    return (
      <iframe
        src={video_url}
        className="w-full h-full"
        allowFullScreen
        title={video.title}
      />
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        
        {/* Video title */}
        <div className="absolute top-4 left-4 z-20">
          <h3 className="text-white font-semibold text-lg drop-shadow-lg">{video.title}</h3>
          {video.description && (
            <p className="text-white/70 text-sm mt-1 max-w-md drop-shadow">{video.description}</p>
          )}
        </div>
        
        {/* Video player */}
        <div className="w-full h-full bg-black">
          {renderPlayer()}
        </div>
      </motion.div>
    </motion.div>
  );
};

const TourHero = () => {
  const { t } = useTranslation();
  const [currentTagline, setCurrentTagline] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [demoVideo, setDemoVideo] = useState<DemoVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglineKeys.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Fetch the primary demo video
  const fetchDemoVideo = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('demo_videos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching demo video:', error);
      }
      
      if (data) {
        setDemoVideo(data);
        setShowVideo(true);
      } else {
        // Fallback to a default YouTube demo video if no video in database
        setDemoVideo({
          id: 'default',
          title: 'LabFlow Product Demo',
          video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Replace with actual demo video
          video_type: 'youtube',
          description: 'See how LabFlow transforms laboratory management'
        });
        setShowVideo(true);
      }
    } catch (err) {
      console.error('Error:', err);
      // Show fallback video
      setDemoVideo({
        id: 'default',
        title: 'LabFlow Product Demo',
        video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        video_type: 'youtube',
        description: 'See how LabFlow transforms laboratory management'
      });
      setShowVideo(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchDemo = () => {
    fetchDemoVideo();
  };

  const heroStats = [
    { value: 500, suffix: '+', label: t('productTour.stats.labsTrust'), icon: <Users className="h-5 w-5" /> },
    { value: 1, suffix: 'M+', label: t('productTour.stats.reportsGenerated'), icon: <Sparkles className="h-5 w-5" /> },
    { value: 3, suffix: '+', label: t('productTour.stats.hoursSaved'), icon: <Clock className="h-5 w-5" /> },
    { value: 99.9, suffix: '%', label: t('productTour.stats.uptime'), icon: <Shield className="h-5 w-5" /> }
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 pt-24 pb-16 overflow-hidden" aria-label="Product Tour Hero">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" aria-hidden="true" />
      
      {/* Animated Background */}
      <AnimatedBackground />
      
      <div className="max-w-6xl mx-auto text-center relative z-10">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
            <Play className="h-3 w-3 mr-2" />
            {t('productTour.hero.badge')}
          </Badge>
        </motion.div>

        {/* Main heading with animated tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
        >
          {t('productTour.hero.headlinePart1')}
          <br />
          <span className="relative inline-block h-[1.2em] overflow-hidden">
            {taglineKeys.map((key, index) => (
              <motion.span
                key={key}
                className={cn(
                  "absolute inset-0 gradient-text",
                  index === currentTagline ? "opacity-100" : "opacity-0"
                )}
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: index === currentTagline ? 0 : -20, 
                  opacity: index === currentTagline ? 1 : 0 
                }}
                transition={{ duration: 0.5 }}
              >
                {t(key)}
              </motion.span>
            ))}
            <span className="invisible">{t(taglineKeys[0])}</span>
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto"
        >
          {t('productTour.hero.subheadline')}
          <span className="text-foreground font-medium"> {t('productTour.hero.subheadlineHighlight')}</span>
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Button asChild size="lg" className="text-lg px-8 py-6 animate-pulse-glow active:scale-95 transition-transform group">
            <Link to="/auth" className="flex items-center gap-2">
              {t('productTour.hero.startTrial')}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-6 glass active:scale-95 transition-transform group"
            onClick={handleWatchDemo}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            )}
            {t('productTour.hero.watchDemo')}
          </Button>
        </motion.div>

        {/* Animated Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <AnimatedStats stats={heroStats} className="max-w-4xl mx-auto" />
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
          >
            <div className="w-1.5 h-3 bg-muted-foreground/50 rounded-full" />
          </motion.div>
        </motion.div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && demoVideo && (
          <VideoPlayer 
            video={demoVideo} 
            onClose={() => {
              setShowVideo(false);
              setDemoVideo(null);
            }} 
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default TourHero;

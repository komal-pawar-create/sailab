import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AnimatedSection } from '@/components/AnimatedSection';
import { supabase } from '@/integrations/supabase/client';
import {
  Users,
  TestTube,
  CreditCard,
  BarChart3,
  Play,
  Monitor,
  Smartphone,
  MousePointerClick,
  ArrowRight,
} from 'lucide-react';

const DemoSection = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'tour'>('tour');
  const [tourStep, setTourStep] = useState(0);
  const [demoVideos, setDemoVideos] = useState<Array<{
    id: string;
    title: string;
    description: string | null;
    video_url: string;
    video_type: string;
    thumbnail_url: string | null;
    duration: string | null;
  }>>([]);
  const [activeVideo, setActiveVideo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from('demo_videos')
        .select('id, title, description, video_url, video_type, thumbnail_url, duration')
        .eq('is_active', true)
        .order('display_order');
      
      if (data && data.length > 0) {
        setDemoVideos(data);
      }
    };
    fetchVideos();
  }, []);

  const extractYouTubeId = (url: string): string => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : url;
  };

  const extractVimeoId = (url: string): string => {
    const match = url.match(/(?:vimeo\.com\/)(\d+)/);
    return match ? match[1] : url;
  };

  const renderVideoEmbed = (video: typeof demoVideos[0]) => {
    switch (video.video_type) {
      case 'youtube':
        return (
          <iframe
            src={`https://www.youtube.com/embed/${extractYouTubeId(video.video_url)}?autoplay=${isPlaying ? 1 : 0}&rel=0`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        );
      case 'vimeo':
        return (
          <iframe
            src={`https://player.vimeo.com/video/${extractVimeoId(video.video_url)}?autoplay=${isPlaying ? 1 : 0}`}
            title={video.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        );
      case 'uploaded':
        return (
          <video
            src={video.video_url}
            controls
            poster={video.thumbnail_url || undefined}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay={isPlaying}
          />
        );
      default:
        return null;
    }
  };

  // Default tour steps
  const defaultTourSteps = [
    {
      icon: Users,
      title: 'Patient Registration',
      description: 'Quick patient onboarding with auto-generated IDs, complete medical history, and instant record creation.',
      mockup: 'patient'
    },
    {
      icon: TestTube,
      title: 'Test Management',
      description: 'Create custom test types, track sample status, and generate professional reports in minutes.',
      mockup: 'test'
    },
    {
      icon: CreditCard,
      title: 'Smart Billing',
      description: 'Automated invoicing with GST support, partial payments, and comprehensive ledger tracking.',
      mockup: 'billing'
    },
    {
      icon: BarChart3,
      title: 'Analytics Dashboard',
      description: 'Real-time insights with revenue trends, patient statistics, and AI-powered predictions.',
      mockup: 'analytics'
    }
  ];

  const renderMockup = (type: string) => {
    const mockupClasses = "glass-strong rounded-xl p-4 space-y-3";
    
    switch (type) {
      case 'patient':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="h-3 w-24 bg-foreground/20 rounded" />
                <div className="h-2 w-16 bg-muted-foreground/20 rounded mt-1" />
              </div>
              <span className="px-2 py-1 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-muted/50"><div className="h-2 w-12 bg-muted-foreground/30 rounded mb-1" /><div className="h-3 w-16 bg-foreground/20 rounded" /></div>
              <div className="p-2 rounded bg-muted/50"><div className="h-2 w-12 bg-muted-foreground/30 rounded mb-1" /><div className="h-3 w-20 bg-foreground/20 rounded" /></div>
            </div>
          </div>
        );
      case 'test':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-accent/10">
              <div className="flex items-center gap-2">
                <TestTube className="h-5 w-5 text-accent" />
                <div className="h-3 w-20 bg-foreground/20 rounded" />
              </div>
              <span className="px-2 py-1 rounded text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">In Progress</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <div className="h-2 w-16 bg-muted-foreground/30 rounded" />
                <div className="h-2 w-8 bg-primary/50 rounded" />
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-muted/50">
                <div className="h-2 w-20 bg-muted-foreground/30 rounded" />
                <div className="h-2 w-10 bg-green-500/50 rounded" />
              </div>
            </div>
          </div>
        );
      case 'billing':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <div className="h-3 w-24 bg-foreground/20 rounded" />
              </div>
              <span className="font-semibold text-primary">₹2,450</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 p-2 rounded bg-green-100/50 dark:bg-green-900/20 text-center">
                <div className="text-xs text-green-700 dark:text-green-400">Paid</div>
                <div className="font-semibold text-green-700 dark:text-green-400">₹1,500</div>
              </div>
              <div className="flex-1 p-2 rounded bg-orange-100/50 dark:bg-orange-900/20 text-center">
                <div className="text-xs text-orange-700 dark:text-orange-400">Due</div>
                <div className="font-semibold text-orange-700 dark:text-orange-400">₹950</div>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className={mockupClasses}>
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div className="h-3 w-20 bg-foreground/20 rounded" />
            </div>
            <div className="flex items-end gap-1 h-16">
              {[40, 65, 45, 80, 55, 70, 90].map((height, i) => (
                <div key={i} className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t" style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const currentVideo = demoVideos[activeVideo];

  return (
    <section id="demo" className="relative py-24 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <AnimatedSection className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-4">
            <Play className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">See It In Action</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Experience
            <span className="gradient-text"> LabFlow</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Watch our quick demo or take an interactive tour to see how LabFlow transforms lab operations.
          </p>
        </AnimatedSection>

        <AnimatedSection animation="scale" delay={200}>
          <div className="space-y-8">
            {/* Tab Switcher */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 rounded-xl glass">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'video' 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Play className="h-4 w-4" />
                  Watch Demo
                </button>
                <button
                  onClick={() => setActiveTab('tour')}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'tour' 
                      ? 'bg-primary text-primary-foreground shadow-lg' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <MousePointerClick className="h-4 w-4" />
                  Interactive Tour
                </button>
              </div>
            </div>

            {/* Video Tab */}
            {activeTab === 'video' && (
              <div className="relative">
                <div className="aspect-video rounded-2xl overflow-hidden glass-strong border border-border/50 shadow-2xl relative">
                  {/* Mock Browser Chrome */}
                  <div className="absolute top-0 left-0 right-0 h-10 bg-muted/80 backdrop-blur flex items-center px-4 gap-2 z-10">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                      <div className="w-3 h-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="flex-1 mx-4 h-6 rounded bg-background/50 flex items-center px-3">
                      <span className="text-xs text-muted-foreground">labflow.mywebz.in/dashboard</span>
                    </div>
                  </div>

                  {/* Video Content */}
                  <div className="absolute inset-0 pt-10">
                    {demoVideos.length > 0 && currentVideo ? (
                      isPlaying ? (
                        renderVideoEmbed(currentVideo)
                      ) : (
                        <div 
                          className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center cursor-pointer"
                          onClick={() => setIsPlaying(true)}
                        >
                          {currentVideo.thumbnail_url && (
                            <img 
                              src={currentVideo.thumbnail_url} 
                              alt={currentVideo.title}
                              className="absolute inset-0 w-full h-full object-cover opacity-50"
                            />
                          )}
                          <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg animate-pulse-glow">
                              <Play className="h-8 w-8 text-primary-foreground ml-1" />
                            </div>
                            <p className="mt-4 text-foreground/80 font-medium">{currentVideo.title}</p>
                            {currentVideo.duration && (
                              <p className="text-sm text-muted-foreground">{currentVideo.duration}</p>
                            )}
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center">
                        <div className="w-20 h-20 rounded-full bg-primary/90 flex items-center justify-center shadow-lg animate-pulse-glow">
                          <Play className="h-8 w-8 text-primary-foreground ml-1" />
                        </div>
                        <p className="mt-4 text-foreground/80 font-medium">Demo video coming soon</p>
                        <p className="text-sm text-muted-foreground">Check back later</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Video Selection (if multiple) */}
                {demoVideos.length > 1 && (
                  <div className="flex justify-center gap-3 mt-6">
                    {demoVideos.map((video, index) => (
                      <button
                        key={video.id}
                        onClick={() => { setActiveVideo(index); setIsPlaying(false); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeVideo === index
                            ? 'bg-primary text-primary-foreground'
                            : 'glass hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        {video.title}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Device indicators */}
                <div className="flex justify-center gap-6 mt-6">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Monitor className="h-4 w-4" />
                    <span>Desktop</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Smartphone className="h-4 w-4" />
                    <span>Mobile Ready</span>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Tour Tab */}
            {activeTab === 'tour' && (
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Tour Steps */}
                <div className="space-y-4">
                  {defaultTourSteps.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => setTourStep(index)}
                      className={`w-full text-left p-4 rounded-xl transition-all duration-300 ${
                        tourStep === index 
                          ? 'glass-strong border-2 border-primary shadow-lg' 
                          : 'glass hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${
                          tourStep === index 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-primary/10 text-primary'
                        }`}>
                          <step.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
                          <p className={`text-sm transition-all duration-300 ${
                            tourStep === index ? 'text-muted-foreground' : 'text-muted-foreground/70 line-clamp-1'
                          }`}>
                            {step.description}
                          </p>
                        </div>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                          tourStep === index 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Tour Preview */}
                <div className="relative">
                  <div className="glass-strong rounded-2xl p-6 border border-border/50 shadow-xl">
                    {/* Mock Header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {(() => {
                            const StepIcon = defaultTourSteps[tourStep].icon;
                            return <StepIcon className="h-5 w-5 text-primary" />;
                          })()}
                        </div>
                        <span className="font-semibold text-foreground">{defaultTourSteps[tourStep].title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Step {tourStep + 1} of {defaultTourSteps.length}</span>
                    </div>
                    
                    {/* Dynamic Mockup */}
                    <div className="min-h-[200px]">
                      {renderMockup(defaultTourSteps[tourStep].mockup)}
                    </div>

                    {/* Navigation Dots */}
                    <div className="flex justify-center gap-2 mt-6">
                      {defaultTourSteps.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setTourStep(index)}
                          className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            tourStep === index 
                              ? 'w-8 bg-primary' 
                              : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent/10 rounded-full blur-2xl" />
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="text-center pt-4">
              <Button asChild size="lg" className="animate-pulse-glow">
                <Link to="/auth" className="flex items-center gap-2">
                  Try It Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default DemoSection;

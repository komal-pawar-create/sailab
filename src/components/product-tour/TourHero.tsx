import React, { Suspense, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Users, Clock, Shield, Sparkles, X } from 'lucide-react';
import AnimatedStats from './AnimatedStats';
import { cn } from '@/lib/utils';

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

// Animated text variations
const taglines = [
  'Transforms Your Lab',
  'Saves 3+ Hours Daily',
  'Grows Your Revenue',
  'Delights Patients'
];

const TourHero = () => {
  const [currentTagline, setCurrentTagline] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTagline((prev) => (prev + 1) % taglines.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const heroStats = [
    { value: 500, suffix: '+', label: 'Labs Trust Us', icon: <Users className="h-5 w-5" /> },
    { value: 1, suffix: 'M+', label: 'Reports Generated', icon: <Sparkles className="h-5 w-5" /> },
    { value: 3, suffix: '+', label: 'Hours Saved Daily', icon: <Clock className="h-5 w-5" /> },
    { value: 99.9, suffix: '%', label: 'Uptime', icon: <Shield className="h-5 w-5" /> }
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
            Interactive Product Tour
          </Badge>
        </motion.div>

        {/* Main heading with animated tagline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
        >
          See How LabFlow
          <br />
          <span className="relative inline-block h-[1.2em] overflow-hidden">
            {taglines.map((tagline, index) => (
              <motion.span
                key={tagline}
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
                {tagline}
              </motion.span>
            ))}
            <span className="invisible">{taglines[0]}</span>
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto"
        >
          A complete walkthrough for lab owners, administrators, and operators. 
          <span className="text-foreground font-medium"> Discover how our platform streamlines every aspect of laboratory management.</span>
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
              Start Free Trial
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            className="text-lg px-8 py-6 glass active:scale-95 transition-transform group"
            onClick={() => setShowVideo(true)}
          >
            <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
            Watch Demo Video
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
      {showVideo && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowVideo(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-4xl aspect-video bg-card rounded-2xl border shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={() => setShowVideo(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <Play className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Demo video coming soon</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
};

export default TourHero;

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Play, Users, Clock, Shield } from 'lucide-react';

const TourHero = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center px-4 pt-24 pb-16" aria-label="Product Tour Hero">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" aria-hidden="true" />
      
      <div className="max-w-5xl mx-auto text-center relative z-10">
        {/* Badge */}
        <Badge variant="secondary" className="mb-6 animate-slide-up opacity-0" style={{ animationFillMode: 'forwards' }}>
          <Play className="h-3 w-3 mr-1" />
          Product Tour
        </Badge>

        {/* Main heading */}
        <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-slide-up opacity-0 delay-100" style={{ animationFillMode: 'forwards' }}>
          See How LabFlow
          <br />
          <span className="gradient-text">Transforms Your Lab</span>
        </h1>

        {/* Subheading */}
        <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto animate-slide-up opacity-0 delay-200" style={{ animationFillMode: 'forwards' }}>
          A complete walkthrough for lab owners, administrators, and operators. 
          Discover how our platform streamlines every aspect of laboratory management.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up opacity-0 delay-300" style={{ animationFillMode: 'forwards' }}>
          <Button asChild size="lg" className="text-lg px-8 py-6 animate-pulse-glow active:scale-95 transition-transform">
            <Link to="/auth" className="flex items-center gap-2">
              Start Free Trial
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-8 py-6 glass active:scale-95 transition-transform" asChild>
            <a href="#stakeholders" className="flex items-center gap-2">
              Explore by Role
            </a>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-8 animate-slide-up opacity-0 delay-400" style={{ animationFillMode: 'forwards' }}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5 text-primary" />
            <span className="font-medium">500+ Labs Trust Us</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-medium">Setup in 3 Days</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-medium">99.9% Uptime</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TourHero;

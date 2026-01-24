import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Building2, MapPin, Star, Quote, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  name: string;
  role: string;
  lab: string;
  location: string;
  quote: string;
  rating: number;
  metric?: string;
  metricLabel?: string;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Dr. Rajesh Sharma',
    role: 'Lab Owner',
    lab: 'Sharma Diagnostics',
    location: 'Mumbai, Maharashtra',
    quote: 'LabFlow transformed our operations. We now process 3x more patients with the same staff. The billing is seamless and reports look professional.',
    rating: 5,
    metric: '3x',
    metricLabel: 'More Patients'
  },
  {
    id: '2',
    name: 'Dr. Priya Patel',
    role: 'Pathologist',
    lab: 'City Path Labs',
    location: 'Ahmedabad, Gujarat',
    quote: 'The report generation feature is fantastic. What used to take 30 minutes now takes 2 minutes. Patients love the instant WhatsApp delivery.',
    rating: 5,
    metric: '15x',
    metricLabel: 'Faster Reports'
  },
  {
    id: '3',
    name: 'Mr. Suresh Kumar',
    role: 'Lab Administrator',
    lab: 'Wellness Labs',
    location: 'Bangalore, Karnataka',
    quote: 'Managing 5 branches from a single dashboard is a game-changer. Real-time revenue tracking helps us make better business decisions.',
    rating: 5,
    metric: '5',
    metricLabel: 'Branches Managed'
  }
];

// Simulated customer logos (labs)
const customerLabs = [
  'Apollo Diagnostics', 'Metropolis Labs', 'Dr. Lal PathLabs', 'SRL Diagnostics',
  'Thyrocare', 'Suburban Diagnostics', 'iGenetic Diagnostics', 'Neuberg Diagnostics',
  'Vijaya Diagnostic', 'Krsnaa Diagnostics', 'Redcliffe Labs', 'Orange Health'
];

const CustomerLogos = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4">
            <Building2 className="h-3 w-3 mr-1" />
            Trusted by 500+ Labs
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Labs Across India Trust LabFlow
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join hundreds of diagnostic labs that have transformed their operations with our platform
          </p>
        </motion.div>

        {/* Scrolling Logo Marquee */}
        <div className="relative mb-16 overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
          
          <motion.div
            className="flex gap-8"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[...customerLabs, ...customerLabs].map((lab, index) => (
              <div
                key={`${lab}-${index}`}
                className="flex-shrink-0 px-6 py-3 bg-card border rounded-lg flex items-center gap-2"
              >
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium whitespace-nowrap">{lab}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
                <CardContent className="p-6">
                  {/* Quote Icon */}
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  
                  {/* Quote Text */}
                  <p className="text-muted-foreground mb-6 line-clamp-4">
                    "{testimonial.quote}"
                  </p>
                  
                  {/* Metric */}
                  {testimonial.metric && (
                    <div className="mb-6 p-4 bg-primary/5 rounded-xl text-center">
                      <div className="text-3xl font-bold text-primary">
                        {testimonial.metric}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.metricLabel}
                      </div>
                    </div>
                  )}
                  
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {testimonial.location}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Video Testimonial CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <Card className="inline-block bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="h-8 w-8 text-primary fill-primary" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Watch Success Stories</div>
                <div className="text-sm text-muted-foreground">
                  Hear from lab owners who transformed their business
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default CustomerLogos;

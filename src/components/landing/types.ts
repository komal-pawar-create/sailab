// Types for dynamic landing page content
export interface HeroContent {
  badge_text: string;
  main_headline: string;
  sub_headline: string;
  cta_primary_text: string;
  cta_secondary_text: string;
}

export interface StatItem {
  id: string;
  value: number;
  suffix: string | null;
  label: string;
}

export interface FeatureItem {
  id: string;
  icon_name: string;
  title: string;
  description: string | null;
}

export interface StepItem {
  id: string;
  step_number: number;
  title: string;
  description: string | null;
}

export interface PricingItem {
  id: string;
  name: string;
  price: number;
  amc_price: number;
  discount: number | null;
  min_labs: number | null;
  features: string[];
  is_popular: boolean;
  is_enterprise: boolean;
}

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  rating: number;
  testimonial_text: string;
  avatar_initials: string | null;
  avatar_url: string | null;
}

export interface SectionContent {
  [key: string]: string;
}

export interface BenefitItem {
  id: string;
  benefit_text: string;
}

export interface TourStepItem {
  id: string;
  icon_name: string;
  title: string;
  description: string | null;
  mockup_type: string;
}

export interface CtaContent {
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_url: string | null;
  footer_text: string | null;
}

export interface FooterContent {
  brand_name: string;
  copyright_text: string;
  nav_links: Array<{ label: string; href: string }>;
}

export interface PricingPlan {
  name: string;
  price: number;
  amcPrice: number;
  discount?: number;
  minLabs?: number;
  features: string[];
  isPopular?: boolean;
  isEnterprise?: boolean;
}

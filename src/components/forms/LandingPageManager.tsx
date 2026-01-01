import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Trash2, Plus, Save, Star, Layout, BarChart3, Sparkles, ListOrdered, CreditCard, HelpCircle, MessageCircle, Pencil, FileText, CheckCircle, MousePointerClick, Link as LinkIcon } from 'lucide-react';

interface HeroContent {
  id: string;
  badge_text: string;
  main_headline: string;
  sub_headline: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  is_active: boolean;
}

interface StatItem {
  id: string;
  value: number;
  suffix: string | null;
  label: string;
  display_order: number;
  is_active: boolean;
}

interface FeatureItem {
  id: string;
  icon_name: string;
  title: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface StepItem {
  id: string;
  step_number: number;
  title: string;
  description: string | null;
  is_active: boolean;
}

interface PricingItem {
  id: string;
  name: string;
  price: number;
  amc_price: number;
  discount: number | null;
  min_labs: number | null;
  features: string[];
  is_popular: boolean;
  is_enterprise: boolean;
  display_order: number;
  is_active: boolean;
}

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
}

interface TestimonialItem {
  id: string;
  name: string;
  role: string | null;
  location: string | null;
  rating: number;
  testimonial_text: string;
  avatar_initials: string | null;
  avatar_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface SectionItem {
  id: string;
  section_key: string;
  content: string;
  is_active: boolean;
}

interface BenefitItem {
  id: string;
  benefit_text: string;
  display_order: number;
  is_active: boolean;
}

interface TourStepItem {
  id: string;
  icon_name: string;
  title: string;
  description: string | null;
  mockup_type: string;
  display_order: number;
  is_active: boolean;
}

interface CtaItem {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  button_url: string | null;
  footer_text: string | null;
  is_active: boolean;
}

interface FooterItem {
  id: string;
  brand_name: string;
  copyright_text: string;
  nav_links: Array<{ label: string; href: string }>;
  is_active: boolean;
}

const iconOptions = [
  'Users', 'TestTube', 'CreditCard', 'BarChart3', 'Shield', 'Building2', 
  'FileText', 'Clock', 'Smartphone', 'Globe', 'Zap', 'Heart', 'Star', 
  'CheckCircle2', 'Settings', 'Mail', 'Phone', 'Calendar', 'TrendingUp', 'Receipt'
];

const mockupTypes = ['patient', 'test', 'billing', 'analytics'];

export function LandingPageManager() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [benefits, setBenefits] = useState<BenefitItem[]>([]);
  const [tourSteps, setTourSteps] = useState<TourStepItem[]>([]);
  const [ctaItems, setCtaItems] = useState<CtaItem[]>([]);
  const [footer, setFooter] = useState<FooterItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit dialog states
  const [editingStat, setEditingStat] = useState<StatItem | null>(null);
  const [editingFeature, setEditingFeature] = useState<FeatureItem | null>(null);
  const [editingStep, setEditingStep] = useState<StepItem | null>(null);
  const [editingPricing, setEditingPricing] = useState<(PricingItem & { featuresText?: string }) | null>(null);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<TestimonialItem | null>(null);
  const [editingSection, setEditingSection] = useState<SectionItem | null>(null);
  const [editingBenefit, setEditingBenefit] = useState<BenefitItem | null>(null);
  const [editingTourStep, setEditingTourStep] = useState<TourStepItem | null>(null);
  const [editingCta, setEditingCta] = useState<CtaItem | null>(null);

  const [newStat, setNewStat] = useState({ value: 0, suffix: '', label: '', display_order: 0 });
  const [newFeature, setNewFeature] = useState({ icon_name: 'Users', title: '', description: '', display_order: 0 });
  const [newStep, setNewStep] = useState({ step_number: 1, title: '', description: '' });
  const [newPricing, setNewPricing] = useState({ 
    name: '', price: 0, amc_price: 0, discount: 0, min_labs: 0, 
    features: '', is_popular: false, is_enterprise: false, display_order: 0 
  });
  const [newFaq, setNewFaq] = useState({ category: 'pricing', question: '', answer: '', display_order: 0 });
  const [newTestimonial, setNewTestimonial] = useState({ 
    name: '', role: '', location: '', rating: 5, 
    testimonial_text: '', avatar_initials: '', display_order: 0 
  });
  const [newSection, setNewSection] = useState({ section_key: '', content: '' });
  const [newBenefit, setNewBenefit] = useState({ benefit_text: '', display_order: 0 });
  const [newTourStep, setNewTourStep] = useState({ icon_name: 'Users', title: '', description: '', mockup_type: 'patient', display_order: 0 });
  const [newCta, setNewCta] = useState({ section_key: '', title: '', subtitle: '', button_text: '', button_url: '', footer_text: '' });
  const [newNavLink, setNewNavLink] = useState({ label: '', href: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [heroRes, statsRes, featuresRes, stepsRes, pricingRes, faqsRes, testimonialsRes, sectionsRes, benefitsRes, tourStepsRes, ctaRes, footerRes] = await Promise.all([
        supabase.from('landing_hero').select('*').limit(1).single(),
        supabase.from('landing_stats').select('*').order('display_order'),
        supabase.from('landing_features').select('*').order('display_order'),
        supabase.from('landing_steps').select('*').order('step_number'),
        supabase.from('landing_pricing').select('*').order('display_order'),
        supabase.from('landing_faqs').select('*').order('display_order'),
        supabase.from('landing_testimonials').select('*').order('display_order'),
        supabase.from('landing_sections').select('*').order('section_key'),
        supabase.from('landing_benefits').select('*').order('display_order'),
        supabase.from('landing_tour_steps').select('*').order('display_order'),
        supabase.from('landing_cta').select('*').order('section_key'),
        supabase.from('landing_footer').select('*').limit(1).single()
      ]);

      if (heroRes.data) setHero(heroRes.data);
      if (statsRes.data) setStats(statsRes.data);
      if (featuresRes.data) setFeatures(featuresRes.data);
      if (stepsRes.data) setSteps(stepsRes.data);
      if (pricingRes.data) {
        setPricing(pricingRes.data.map((p: any) => ({
          ...p,
          features: Array.isArray(p.features) ? p.features : []
        })));
      }
      if (faqsRes.data) setFaqs(faqsRes.data);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data);
      if (sectionsRes.data) setSections(sectionsRes.data);
      if (benefitsRes.data) setBenefits(benefitsRes.data);
      if (tourStepsRes.data) setTourSteps(tourStepsRes.data);
      if (ctaRes.data) setCtaItems(ctaRes.data);
      if (footerRes.data) setFooter({
        ...footerRes.data,
        nav_links: Array.isArray(footerRes.data.nav_links) 
          ? (footerRes.data.nav_links as Array<{ label: string; href: string }>)
          : []
      });
    } catch (error) {
      console.error('Error fetching landing page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveHero = async () => {
    if (!hero) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('landing_hero')
        .update({
          badge_text: hero.badge_text,
          main_headline: hero.main_headline,
          sub_headline: hero.sub_headline,
          cta_primary_text: hero.cta_primary_text,
          cta_secondary_text: hero.cta_secondary_text,
          updated_at: new Date().toISOString()
        })
        .eq('id', hero.id);

      if (error) throw error;
      toast.success('Hero section updated');
    } catch (error: any) {
      toast.error('Failed to update hero section');
    } finally {
      setSaving(false);
    }
  };

  // Stats handlers
  const addStat = async () => {
    const { error } = await supabase.from('landing_stats').insert(newStat);
    if (!error) { toast.success('Added'); setNewStat({ value: 0, suffix: '', label: '', display_order: 0 }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleStatActive = async (id: string, val: boolean) => {
    await supabase.from('landing_stats').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteStat = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_stats').delete().eq('id', id);
    fetchAllData();
  };
  const saveStat = async () => {
    if (!editingStat) return;
    const { error } = await supabase.from('landing_stats').update({
      value: editingStat.value,
      suffix: editingStat.suffix,
      label: editingStat.label,
      display_order: editingStat.display_order
    }).eq('id', editingStat.id);
    if (!error) { toast.success('Updated'); setEditingStat(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Features handlers
  const addFeature = async () => {
    const { error } = await supabase.from('landing_features').insert(newFeature);
    if (!error) { toast.success('Added'); setNewFeature({ icon_name: 'Users', title: '', description: '', display_order: 0 }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleFeatureActive = async (id: string, val: boolean) => {
    await supabase.from('landing_features').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteFeature = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_features').delete().eq('id', id);
    fetchAllData();
  };
  const saveFeature = async () => {
    if (!editingFeature) return;
    const { error } = await supabase.from('landing_features').update({
      icon_name: editingFeature.icon_name,
      title: editingFeature.title,
      description: editingFeature.description,
      display_order: editingFeature.display_order
    }).eq('id', editingFeature.id);
    if (!error) { toast.success('Updated'); setEditingFeature(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Steps handlers
  const addStep = async () => {
    const { error } = await supabase.from('landing_steps').insert(newStep);
    if (!error) { toast.success('Added'); setNewStep({ step_number: 1, title: '', description: '' }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleStepActive = async (id: string, val: boolean) => {
    await supabase.from('landing_steps').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteStep = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_steps').delete().eq('id', id);
    fetchAllData();
  };
  const saveStep = async () => {
    if (!editingStep) return;
    const { error } = await supabase.from('landing_steps').update({
      step_number: editingStep.step_number,
      title: editingStep.title,
      description: editingStep.description
    }).eq('id', editingStep.id);
    if (!error) { toast.success('Updated'); setEditingStep(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Pricing handlers
  const addPricingPlan = async () => {
    const data = {
      ...newPricing,
      features: newPricing.features.split('\n').filter(f => f.trim())
    };
    const { error } = await supabase.from('landing_pricing').insert(data);
    if (!error) { 
      toast.success('Added'); 
      setNewPricing({ name: '', price: 0, amc_price: 0, discount: 0, min_labs: 0, features: '', is_popular: false, is_enterprise: false, display_order: 0 }); 
      fetchAllData(); 
    } else toast.error('Failed');
  };
  const togglePricingActive = async (id: string, val: boolean) => {
    await supabase.from('landing_pricing').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deletePricing = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_pricing').delete().eq('id', id);
    fetchAllData();
  };
  const savePricing = async () => {
    if (!editingPricing) return;
    const featuresArray = editingPricing.featuresText?.split('\n').filter(f => f.trim()) || editingPricing.features;
    const { error } = await supabase.from('landing_pricing').update({
      name: editingPricing.name,
      price: editingPricing.price,
      amc_price: editingPricing.amc_price,
      discount: editingPricing.discount,
      min_labs: editingPricing.min_labs,
      features: featuresArray,
      is_popular: editingPricing.is_popular,
      is_enterprise: editingPricing.is_enterprise,
      display_order: editingPricing.display_order
    }).eq('id', editingPricing.id);
    if (!error) { toast.success('Updated'); setEditingPricing(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // FAQ handlers
  const addFaq = async () => {
    const { error } = await supabase.from('landing_faqs').insert(newFaq);
    if (!error) { toast.success('Added'); setNewFaq({ category: 'pricing', question: '', answer: '', display_order: 0 }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleFaqActive = async (id: string, val: boolean) => {
    await supabase.from('landing_faqs').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteFaq = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_faqs').delete().eq('id', id);
    fetchAllData();
  };
  const saveFaq = async () => {
    if (!editingFaq) return;
    const { error } = await supabase.from('landing_faqs').update({
      category: editingFaq.category,
      question: editingFaq.question,
      answer: editingFaq.answer,
      display_order: editingFaq.display_order
    }).eq('id', editingFaq.id);
    if (!error) { toast.success('Updated'); setEditingFaq(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Testimonials handlers
  const addTestimonial = async () => {
    const { error } = await supabase.from('landing_testimonials').insert(newTestimonial);
    if (!error) { 
      toast.success('Added'); 
      setNewTestimonial({ name: '', role: '', location: '', rating: 5, testimonial_text: '', avatar_initials: '', display_order: 0 }); 
      fetchAllData(); 
    } else toast.error('Failed');
  };
  const toggleTestimonialActive = async (id: string, val: boolean) => {
    await supabase.from('landing_testimonials').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteTestimonial = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_testimonials').delete().eq('id', id);
    fetchAllData();
  };
  const saveTestimonial = async () => {
    if (!editingTestimonial) return;
    const { error } = await supabase.from('landing_testimonials').update({
      name: editingTestimonial.name,
      role: editingTestimonial.role,
      location: editingTestimonial.location,
      rating: editingTestimonial.rating,
      testimonial_text: editingTestimonial.testimonial_text,
      avatar_initials: editingTestimonial.avatar_initials,
      display_order: editingTestimonial.display_order
    }).eq('id', editingTestimonial.id);
    if (!error) { toast.success('Updated'); setEditingTestimonial(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Section handlers
  const addSection = async () => {
    const { error } = await supabase.from('landing_sections').insert(newSection);
    if (!error) { toast.success('Added'); setNewSection({ section_key: '', content: '' }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleSectionActive = async (id: string, val: boolean) => {
    await supabase.from('landing_sections').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteSection = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_sections').delete().eq('id', id);
    fetchAllData();
  };
  const saveSection = async () => {
    if (!editingSection) return;
    const { error } = await supabase.from('landing_sections').update({
      content: editingSection.content
    }).eq('id', editingSection.id);
    if (!error) { toast.success('Updated'); setEditingSection(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Benefits handlers
  const addBenefit = async () => {
    const { error } = await supabase.from('landing_benefits').insert(newBenefit);
    if (!error) { toast.success('Added'); setNewBenefit({ benefit_text: '', display_order: 0 }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleBenefitActive = async (id: string, val: boolean) => {
    await supabase.from('landing_benefits').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteBenefit = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_benefits').delete().eq('id', id);
    fetchAllData();
  };
  const saveBenefit = async () => {
    if (!editingBenefit) return;
    const { error } = await supabase.from('landing_benefits').update({
      benefit_text: editingBenefit.benefit_text,
      display_order: editingBenefit.display_order
    }).eq('id', editingBenefit.id);
    if (!error) { toast.success('Updated'); setEditingBenefit(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Tour Steps handlers
  const addTourStep = async () => {
    const { error } = await supabase.from('landing_tour_steps').insert(newTourStep);
    if (!error) { toast.success('Added'); setNewTourStep({ icon_name: 'Users', title: '', description: '', mockup_type: 'patient', display_order: 0 }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleTourStepActive = async (id: string, val: boolean) => {
    await supabase.from('landing_tour_steps').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteTourStep = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_tour_steps').delete().eq('id', id);
    fetchAllData();
  };
  const saveTourStep = async () => {
    if (!editingTourStep) return;
    const { error } = await supabase.from('landing_tour_steps').update({
      icon_name: editingTourStep.icon_name,
      title: editingTourStep.title,
      description: editingTourStep.description,
      mockup_type: editingTourStep.mockup_type,
      display_order: editingTourStep.display_order
    }).eq('id', editingTourStep.id);
    if (!error) { toast.success('Updated'); setEditingTourStep(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // CTA handlers
  const addCta = async () => {
    const { error } = await supabase.from('landing_cta').insert(newCta);
    if (!error) { toast.success('Added'); setNewCta({ section_key: '', title: '', subtitle: '', button_text: '', button_url: '', footer_text: '' }); fetchAllData(); }
    else toast.error('Failed');
  };
  const toggleCtaActive = async (id: string, val: boolean) => {
    await supabase.from('landing_cta').update({ is_active: !val }).eq('id', id);
    fetchAllData();
  };
  const deleteCta = async (id: string) => {
    if (!confirm('Delete?')) return;
    await supabase.from('landing_cta').delete().eq('id', id);
    fetchAllData();
  };
  const saveCta = async () => {
    if (!editingCta) return;
    const { error } = await supabase.from('landing_cta').update({
      title: editingCta.title,
      subtitle: editingCta.subtitle,
      button_text: editingCta.button_text,
      button_url: editingCta.button_url,
      footer_text: editingCta.footer_text
    }).eq('id', editingCta.id);
    if (!error) { toast.success('Updated'); setEditingCta(null); fetchAllData(); }
    else toast.error('Failed');
  };

  // Footer handlers
  const saveFooter = async () => {
    if (!footer) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('landing_footer').update({
        brand_name: footer.brand_name,
        copyright_text: footer.copyright_text,
        nav_links: footer.nav_links,
        updated_at: new Date().toISOString()
      }).eq('id', footer.id);
      if (error) throw error;
      toast.success('Footer updated');
    } catch {
      toast.error('Failed to update footer');
    } finally {
      setSaving(false);
    }
  };

  const addNavLink = () => {
    if (!footer || !newNavLink.label || !newNavLink.href) return;
    setFooter({
      ...footer,
      nav_links: [...footer.nav_links, newNavLink]
    });
    setNewNavLink({ label: '', href: '' });
  };

  const removeNavLink = (index: number) => {
    if (!footer) return;
    setFooter({
      ...footer,
      nav_links: footer.nav_links.filter((_, i) => i !== index)
    });
  };

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <>
      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="hero" className="flex items-center gap-1"><Layout className="h-4 w-4" />Hero</TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1"><BarChart3 className="h-4 w-4" />Stats</TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1"><Sparkles className="h-4 w-4" />Features</TabsTrigger>
          <TabsTrigger value="steps" className="flex items-center gap-1"><ListOrdered className="h-4 w-4" />Steps</TabsTrigger>
          <TabsTrigger value="pricing" className="flex items-center gap-1"><CreditCard className="h-4 w-4" />Pricing</TabsTrigger>
          <TabsTrigger value="faqs" className="flex items-center gap-1"><HelpCircle className="h-4 w-4" />FAQs</TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />Testimonials</TabsTrigger>
          <TabsTrigger value="sections" className="flex items-center gap-1"><FileText className="h-4 w-4" />Sections</TabsTrigger>
          <TabsTrigger value="benefits" className="flex items-center gap-1"><CheckCircle className="h-4 w-4" />Benefits</TabsTrigger>
          <TabsTrigger value="tour" className="flex items-center gap-1"><MousePointerClick className="h-4 w-4" />Tour</TabsTrigger>
          <TabsTrigger value="cta" className="flex items-center gap-1"><Star className="h-4 w-4" />CTA</TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-1"><LinkIcon className="h-4 w-4" />Footer</TabsTrigger>
        </TabsList>

        {/* Hero Section */}
        <TabsContent value="hero">
          <Card>
            <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {hero && (
                <>
                  <div className="grid gap-4">
                    <div><Label>Badge Text</Label><Input value={hero.badge_text} onChange={(e) => setHero({ ...hero, badge_text: e.target.value })} /></div>
                    <div><Label>Main Headline</Label><Input value={hero.main_headline} onChange={(e) => setHero({ ...hero, main_headline: e.target.value })} /></div>
                    <div><Label>Sub Headline</Label><Textarea value={hero.sub_headline} onChange={(e) => setHero({ ...hero, sub_headline: e.target.value })} rows={3} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Primary CTA</Label><Input value={hero.cta_primary_text} onChange={(e) => setHero({ ...hero, cta_primary_text: e.target.value })} /></div>
                      <div><Label>Secondary CTA</Label><Input value={hero.cta_secondary_text} onChange={(e) => setHero({ ...hero, cta_secondary_text: e.target.value })} /></div>
                    </div>
                  </div>
                  <Button onClick={saveHero} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save'}</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Stat</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div><Label>Value</Label><Input type="number" value={newStat.value} onChange={(e) => setNewStat({ ...newStat, value: Number(e.target.value) })} /></div>
                <div><Label>Suffix</Label><Input value={newStat.suffix} onChange={(e) => setNewStat({ ...newStat, suffix: e.target.value })} placeholder="+, %, /7" /></div>
                <div><Label>Label</Label><Input value={newStat.label} onChange={(e) => setNewStat({ ...newStat, label: e.target.value })} /></div>
                <div><Label>Order</Label><Input type="number" value={newStat.display_order} onChange={(e) => setNewStat({ ...newStat, display_order: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={addStat} disabled={!newStat.label}>Add Stat</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Stats ({stats.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Value</TableHead><TableHead>Label</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stats.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.display_order}</TableCell>
                      <TableCell>{s.value}{s.suffix}</TableCell>
                      <TableCell>{s.label}</TableCell>
                      <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleStatActive(s.id, s.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingStat(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteStat(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Feature</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div><Label>Icon</Label>
                  <Select value={newFeature.icon_name} onValueChange={(v) => setNewFeature({ ...newFeature, icon_name: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{iconOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={newFeature.title} onChange={(e) => setNewFeature({ ...newFeature, title: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={newFeature.description} onChange={(e) => setNewFeature({ ...newFeature, description: e.target.value })} /></div>
                <div><Label>Order</Label><Input type="number" value={newFeature.display_order} onChange={(e) => setNewFeature({ ...newFeature, display_order: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={addFeature} disabled={!newFeature.title}>Add Feature</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Features ({features.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Icon</TableHead><TableHead>Title</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {features.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.display_order}</TableCell>
                      <TableCell>{f.icon_name}</TableCell>
                      <TableCell>{f.title}</TableCell>
                      <TableCell><Switch checked={f.is_active} onCheckedChange={() => toggleFeatureActive(f.id, f.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingFeature(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteFeature(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Steps */}
        <TabsContent value="steps">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Step</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label>Step #</Label><Input type="number" value={newStep.step_number} onChange={(e) => setNewStep({ ...newStep, step_number: Number(e.target.value) })} /></div>
                <div><Label>Title</Label><Input value={newStep.title} onChange={(e) => setNewStep({ ...newStep, title: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={newStep.description} onChange={(e) => setNewStep({ ...newStep, description: e.target.value })} /></div>
              </div>
              <Button onClick={addStep} disabled={!newStep.title}>Add Step</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Steps ({steps.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Title</TableHead><TableHead>Description</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {steps.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.step_number}</TableCell>
                      <TableCell>{s.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{s.description}</TableCell>
                      <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleStepActive(s.id, s.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingStep(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteStep(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Pricing Plan</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label>Name</Label><Input value={newPricing.name} onChange={(e) => setNewPricing({ ...newPricing, name: e.target.value })} /></div>
                <div><Label>Price (₹)</Label><Input type="number" value={newPricing.price} onChange={(e) => setNewPricing({ ...newPricing, price: Number(e.target.value) })} /></div>
                <div><Label>AMC (₹)</Label><Input type="number" value={newPricing.amc_price} onChange={(e) => setNewPricing({ ...newPricing, amc_price: Number(e.target.value) })} /></div>
                <div><Label>Discount %</Label><Input type="number" value={newPricing.discount} onChange={(e) => setNewPricing({ ...newPricing, discount: Number(e.target.value) })} /></div>
                <div><Label>Min Labs</Label><Input type="number" value={newPricing.min_labs} onChange={(e) => setNewPricing({ ...newPricing, min_labs: Number(e.target.value) })} /></div>
                <div><Label>Order</Label><Input type="number" value={newPricing.display_order} onChange={(e) => setNewPricing({ ...newPricing, display_order: Number(e.target.value) })} /></div>
              </div>
              <div className="mb-4"><Label>Features (one per line)</Label><Textarea value={newPricing.features} onChange={(e) => setNewPricing({ ...newPricing, features: e.target.value })} rows={4} /></div>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={newPricing.is_popular} onChange={(e) => setNewPricing({ ...newPricing, is_popular: e.target.checked })} />Popular</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={newPricing.is_enterprise} onChange={(e) => setNewPricing({ ...newPricing, is_enterprise: e.target.checked })} />Enterprise</label>
              </div>
              <Button onClick={addPricingPlan} disabled={!newPricing.name}>Add Plan</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Plans ({pricing.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>AMC</TableHead><TableHead>Flags</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {pricing.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.display_order}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>₹{p.price.toLocaleString()}</TableCell>
                      <TableCell>₹{p.amc_price.toLocaleString()}/yr</TableCell>
                      <TableCell>{p.is_popular && <Star className="h-4 w-4 text-yellow-500 inline" />}{p.is_enterprise && <span className="text-xs ml-1">Ent</span>}</TableCell>
                      <TableCell><Switch checked={p.is_active} onCheckedChange={() => togglePricingActive(p.id, p.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingPricing({ ...p, featuresText: p.features.join('\n') })}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deletePricing(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FAQs */}
        <TabsContent value="faqs">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add FAQ</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label>Category</Label>
                  <Select value={newFaq.category} onValueChange={(v) => setNewFaq({ ...newFaq, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pricing">Pricing</SelectItem>
                      <SelectItem value="features">Features</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Order</Label><Input type="number" value={newFaq.display_order} onChange={(e) => setNewFaq({ ...newFaq, display_order: Number(e.target.value) })} /></div>
              </div>
              <div className="mb-4"><Label>Question</Label><Input value={newFaq.question} onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })} /></div>
              <div className="mb-4"><Label>Answer</Label><Textarea value={newFaq.answer} onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })} rows={3} /></div>
              <Button onClick={addFaq} disabled={!newFaq.question || !newFaq.answer}>Add FAQ</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>FAQs ({faqs.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Category</TableHead><TableHead>Question</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {faqs.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.display_order}</TableCell>
                      <TableCell className="capitalize">{f.category}</TableCell>
                      <TableCell className="max-w-sm truncate">{f.question}</TableCell>
                      <TableCell><Switch checked={f.is_active} onCheckedChange={() => toggleFaqActive(f.id, f.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingFaq(f)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteFaq(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials */}
        <TabsContent value="testimonials">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Testimonial</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label>Name</Label><Input value={newTestimonial.name} onChange={(e) => setNewTestimonial({ ...newTestimonial, name: e.target.value })} /></div>
                <div><Label>Role</Label><Input value={newTestimonial.role} onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={newTestimonial.location} onChange={(e) => setNewTestimonial({ ...newTestimonial, location: e.target.value })} /></div>
                <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={newTestimonial.rating} onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })} /></div>
                <div><Label>Initials</Label><Input value={newTestimonial.avatar_initials} onChange={(e) => setNewTestimonial({ ...newTestimonial, avatar_initials: e.target.value })} maxLength={3} /></div>
                <div><Label>Order</Label><Input type="number" value={newTestimonial.display_order} onChange={(e) => setNewTestimonial({ ...newTestimonial, display_order: Number(e.target.value) })} /></div>
              </div>
              <div className="mb-4"><Label>Testimonial Text</Label><Textarea value={newTestimonial.testimonial_text} onChange={(e) => setNewTestimonial({ ...newTestimonial, testimonial_text: e.target.value })} rows={3} /></div>
              <Button onClick={addTestimonial} disabled={!newTestimonial.name || !newTestimonial.testimonial_text}>Add Testimonial</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Testimonials ({testimonials.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Rating</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {testimonials.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.display_order}</TableCell>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.role}</TableCell>
                      <TableCell>{'★'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}</TableCell>
                      <TableCell><Switch checked={t.is_active} onCheckedChange={() => toggleTestimonialActive(t.id, t.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTestimonial(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTestimonial(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sections */}
        <TabsContent value="sections">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Section Text</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label>Section Key (e.g., features_title)</Label><Input value={newSection.section_key} onChange={(e) => setNewSection({ ...newSection, section_key: e.target.value })} /></div>
                <div><Label>Content</Label><Input value={newSection.content} onChange={(e) => setNewSection({ ...newSection, content: e.target.value })} /></div>
              </div>
              <Button onClick={addSection} disabled={!newSection.section_key || !newSection.content}>Add Section</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Section Texts ({sections.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Content</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {sections.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm">{s.section_key}</TableCell>
                      <TableCell className="max-w-md truncate">{s.content}</TableCell>
                      <TableCell><Switch checked={s.is_active} onCheckedChange={() => toggleSectionActive(s.id, s.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingSection(s)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteSection(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Benefits */}
        <TabsContent value="benefits">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Benefit</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><Label>Benefit Text</Label><Input value={newBenefit.benefit_text} onChange={(e) => setNewBenefit({ ...newBenefit, benefit_text: e.target.value })} /></div>
                <div><Label>Order</Label><Input type="number" value={newBenefit.display_order} onChange={(e) => setNewBenefit({ ...newBenefit, display_order: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={addBenefit} disabled={!newBenefit.benefit_text}>Add Benefit</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Benefits ({benefits.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Benefit</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {benefits.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.display_order}</TableCell>
                      <TableCell>{b.benefit_text}</TableCell>
                      <TableCell><Switch checked={b.is_active} onCheckedChange={() => toggleBenefitActive(b.id, b.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingBenefit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteBenefit(b.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tour Steps */}
        <TabsContent value="tour">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add Tour Step</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div><Label>Icon</Label>
                  <Select value={newTourStep.icon_name} onValueChange={(v) => setNewTourStep({ ...newTourStep, icon_name: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{iconOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Title</Label><Input value={newTourStep.title} onChange={(e) => setNewTourStep({ ...newTourStep, title: e.target.value })} /></div>
                <div><Label>Description</Label><Input value={newTourStep.description} onChange={(e) => setNewTourStep({ ...newTourStep, description: e.target.value })} /></div>
                <div><Label>Mockup Type</Label>
                  <Select value={newTourStep.mockup_type} onValueChange={(v) => setNewTourStep({ ...newTourStep, mockup_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{mockupTypes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Order</Label><Input type="number" value={newTourStep.display_order} onChange={(e) => setNewTourStep({ ...newTourStep, display_order: Number(e.target.value) })} /></div>
              </div>
              <Button onClick={addTourStep} disabled={!newTourStep.title}>Add Tour Step</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Tour Steps ({tourSteps.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Order</TableHead><TableHead>Icon</TableHead><TableHead>Title</TableHead><TableHead>Mockup</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tourSteps.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.display_order}</TableCell>
                      <TableCell>{t.icon_name}</TableCell>
                      <TableCell>{t.title}</TableCell>
                      <TableCell>{t.mockup_type}</TableCell>
                      <TableCell><Switch checked={t.is_active} onCheckedChange={() => toggleTourStepActive(t.id, t.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingTourStep(t)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTourStep(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* CTA */}
        <TabsContent value="cta">
          <Card className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-5 w-5" />Add CTA Block</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div><Label>Section Key</Label><Input value={newCta.section_key} onChange={(e) => setNewCta({ ...newCta, section_key: e.target.value })} placeholder="e.g., final_cta" /></div>
                <div><Label>Title</Label><Input value={newCta.title} onChange={(e) => setNewCta({ ...newCta, title: e.target.value })} /></div>
                <div><Label>Subtitle</Label><Input value={newCta.subtitle} onChange={(e) => setNewCta({ ...newCta, subtitle: e.target.value })} /></div>
                <div><Label>Button Text</Label><Input value={newCta.button_text} onChange={(e) => setNewCta({ ...newCta, button_text: e.target.value })} /></div>
                <div><Label>Button URL</Label><Input value={newCta.button_url} onChange={(e) => setNewCta({ ...newCta, button_url: e.target.value })} /></div>
                <div><Label>Footer Text</Label><Input value={newCta.footer_text} onChange={(e) => setNewCta({ ...newCta, footer_text: e.target.value })} /></div>
              </div>
              <Button onClick={addCta} disabled={!newCta.section_key || !newCta.title}>Add CTA</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>CTA Blocks ({ctaItems.length})</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Key</TableHead><TableHead>Title</TableHead><TableHead>Button</TableHead><TableHead>Active</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ctaItems.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.section_key}</TableCell>
                      <TableCell>{c.title}</TableCell>
                      <TableCell>{c.button_text}</TableCell>
                      <TableCell><Switch checked={c.is_active} onCheckedChange={() => toggleCtaActive(c.id, c.is_active)} /></TableCell>
                      <TableCell className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setEditingCta(c)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteCta(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer">
          <Card>
            <CardHeader><CardTitle>Footer Settings</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {footer && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Brand Name</Label><Input value={footer.brand_name} onChange={(e) => setFooter({ ...footer, brand_name: e.target.value })} /></div>
                    <div><Label>Copyright Text</Label><Input value={footer.copyright_text} onChange={(e) => setFooter({ ...footer, copyright_text: e.target.value })} /></div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Navigation Links</Label>
                    <div className="space-y-2 mb-4">
                      {footer.nav_links.map((link, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 rounded bg-muted">
                          <span className="flex-1">{link.label}</span>
                          <span className="text-muted-foreground text-sm">{link.href}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeNavLink(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Label" value={newNavLink.label} onChange={(e) => setNewNavLink({ ...newNavLink, label: e.target.value })} />
                      <Input placeholder="URL (e.g., #features or /page)" value={newNavLink.href} onChange={(e) => setNewNavLink({ ...newNavLink, href: e.target.value })} />
                      <Button onClick={addNavLink} disabled={!newNavLink.label || !newNavLink.href}><Plus className="h-4 w-4" /></Button>
                    </div>
                  </div>

                  <Button onClick={saveFooter} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Footer'}</Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Stat Dialog */}
      <Dialog open={!!editingStat} onOpenChange={(open) => !open && setEditingStat(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Stat</DialogTitle></DialogHeader>
          {editingStat && (
            <div className="space-y-4">
              <div><Label>Value</Label><Input type="number" value={editingStat.value} onChange={(e) => setEditingStat({ ...editingStat, value: Number(e.target.value) })} /></div>
              <div><Label>Suffix</Label><Input value={editingStat.suffix || ''} onChange={(e) => setEditingStat({ ...editingStat, suffix: e.target.value })} /></div>
              <div><Label>Label</Label><Input value={editingStat.label} onChange={(e) => setEditingStat({ ...editingStat, label: e.target.value })} /></div>
              <div><Label>Display Order</Label><Input type="number" value={editingStat.display_order} onChange={(e) => setEditingStat({ ...editingStat, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveStat}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={(open) => !open && setEditingFeature(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Feature</DialogTitle></DialogHeader>
          {editingFeature && (
            <div className="space-y-4">
              <div><Label>Icon</Label>
                <Select value={editingFeature.icon_name} onValueChange={(v) => setEditingFeature({ ...editingFeature, icon_name: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{iconOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={editingFeature.title} onChange={(e) => setEditingFeature({ ...editingFeature, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editingFeature.description || ''} onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })} /></div>
              <div><Label>Order</Label><Input type="number" value={editingFeature.display_order} onChange={(e) => setEditingFeature({ ...editingFeature, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveFeature}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Step Dialog */}
      <Dialog open={!!editingStep} onOpenChange={(open) => !open && setEditingStep(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Step</DialogTitle></DialogHeader>
          {editingStep && (
            <div className="space-y-4">
              <div><Label>Step Number</Label><Input type="number" value={editingStep.step_number} onChange={(e) => setEditingStep({ ...editingStep, step_number: Number(e.target.value) })} /></div>
              <div><Label>Title</Label><Input value={editingStep.title} onChange={(e) => setEditingStep({ ...editingStep, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editingStep.description || ''} onChange={(e) => setEditingStep({ ...editingStep, description: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveStep}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Pricing Dialog */}
      <Dialog open={!!editingPricing} onOpenChange={(open) => !open && setEditingPricing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Pricing Plan</DialogTitle></DialogHeader>
          {editingPricing && (
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editingPricing.name} onChange={(e) => setEditingPricing({ ...editingPricing, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price (₹)</Label><Input type="number" value={editingPricing.price} onChange={(e) => setEditingPricing({ ...editingPricing, price: Number(e.target.value) })} /></div>
                <div><Label>AMC (₹)</Label><Input type="number" value={editingPricing.amc_price} onChange={(e) => setEditingPricing({ ...editingPricing, amc_price: Number(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Discount %</Label><Input type="number" value={editingPricing.discount || 0} onChange={(e) => setEditingPricing({ ...editingPricing, discount: Number(e.target.value) })} /></div>
                <div><Label>Min Labs</Label><Input type="number" value={editingPricing.min_labs || 0} onChange={(e) => setEditingPricing({ ...editingPricing, min_labs: Number(e.target.value) })} /></div>
              </div>
              <div><Label>Features (one per line)</Label><Textarea value={editingPricing.featuresText || ''} onChange={(e) => setEditingPricing({ ...editingPricing, featuresText: e.target.value })} rows={5} /></div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingPricing.is_popular} onChange={(e) => setEditingPricing({ ...editingPricing, is_popular: e.target.checked })} />Popular</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={editingPricing.is_enterprise} onChange={(e) => setEditingPricing({ ...editingPricing, is_enterprise: e.target.checked })} />Enterprise</label>
              </div>
              <div><Label>Display Order</Label><Input type="number" value={editingPricing.display_order} onChange={(e) => setEditingPricing({ ...editingPricing, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={savePricing}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit FAQ Dialog */}
      <Dialog open={!!editingFaq} onOpenChange={(open) => !open && setEditingFaq(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit FAQ</DialogTitle></DialogHeader>
          {editingFaq && (
            <div className="space-y-4">
              <div><Label>Category</Label>
                <Select value={editingFaq.category} onValueChange={(v) => setEditingFaq({ ...editingFaq, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="features">Features</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Question</Label><Input value={editingFaq.question} onChange={(e) => setEditingFaq({ ...editingFaq, question: e.target.value })} /></div>
              <div><Label>Answer</Label><Textarea value={editingFaq.answer} onChange={(e) => setEditingFaq({ ...editingFaq, answer: e.target.value })} rows={4} /></div>
              <div><Label>Order</Label><Input type="number" value={editingFaq.display_order} onChange={(e) => setEditingFaq({ ...editingFaq, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveFaq}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Testimonial Dialog */}
      <Dialog open={!!editingTestimonial} onOpenChange={(open) => !open && setEditingTestimonial(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Testimonial</DialogTitle></DialogHeader>
          {editingTestimonial && (
            <div className="space-y-4">
              <div><Label>Name</Label><Input value={editingTestimonial.name} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Role</Label><Input value={editingTestimonial.role || ''} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, role: e.target.value })} /></div>
                <div><Label>Location</Label><Input value={editingTestimonial.location || ''} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, location: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Rating (1-5)</Label><Input type="number" min={1} max={5} value={editingTestimonial.rating} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, rating: Number(e.target.value) })} /></div>
                <div><Label>Initials</Label><Input value={editingTestimonial.avatar_initials || ''} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, avatar_initials: e.target.value })} maxLength={3} /></div>
              </div>
              <div><Label>Testimonial</Label><Textarea value={editingTestimonial.testimonial_text} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, testimonial_text: e.target.value })} rows={4} /></div>
              <div><Label>Order</Label><Input type="number" value={editingTestimonial.display_order} onChange={(e) => setEditingTestimonial({ ...editingTestimonial, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveTestimonial}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog open={!!editingSection} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Section Text</DialogTitle></DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div><Label>Section Key</Label><Input value={editingSection.section_key} disabled /></div>
              <div><Label>Content</Label><Textarea value={editingSection.content} onChange={(e) => setEditingSection({ ...editingSection, content: e.target.value })} rows={4} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveSection}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Benefit Dialog */}
      <Dialog open={!!editingBenefit} onOpenChange={(open) => !open && setEditingBenefit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Benefit</DialogTitle></DialogHeader>
          {editingBenefit && (
            <div className="space-y-4">
              <div><Label>Benefit Text</Label><Textarea value={editingBenefit.benefit_text} onChange={(e) => setEditingBenefit({ ...editingBenefit, benefit_text: e.target.value })} rows={3} /></div>
              <div><Label>Display Order</Label><Input type="number" value={editingBenefit.display_order} onChange={(e) => setEditingBenefit({ ...editingBenefit, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveBenefit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tour Step Dialog */}
      <Dialog open={!!editingTourStep} onOpenChange={(open) => !open && setEditingTourStep(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tour Step</DialogTitle></DialogHeader>
          {editingTourStep && (
            <div className="space-y-4">
              <div><Label>Icon</Label>
                <Select value={editingTourStep.icon_name} onValueChange={(v) => setEditingTourStep({ ...editingTourStep, icon_name: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{iconOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Title</Label><Input value={editingTourStep.title} onChange={(e) => setEditingTourStep({ ...editingTourStep, title: e.target.value })} /></div>
              <div><Label>Description</Label><Textarea value={editingTourStep.description || ''} onChange={(e) => setEditingTourStep({ ...editingTourStep, description: e.target.value })} rows={3} /></div>
              <div><Label>Mockup Type</Label>
                <Select value={editingTourStep.mockup_type} onValueChange={(v) => setEditingTourStep({ ...editingTourStep, mockup_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{mockupTypes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Order</Label><Input type="number" value={editingTourStep.display_order} onChange={(e) => setEditingTourStep({ ...editingTourStep, display_order: Number(e.target.value) })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveTourStep}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit CTA Dialog */}
      <Dialog open={!!editingCta} onOpenChange={(open) => !open && setEditingCta(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit CTA Block</DialogTitle></DialogHeader>
          {editingCta && (
            <div className="space-y-4">
              <div><Label>Section Key</Label><Input value={editingCta.section_key} disabled /></div>
              <div><Label>Title</Label><Input value={editingCta.title} onChange={(e) => setEditingCta({ ...editingCta, title: e.target.value })} /></div>
              <div><Label>Subtitle</Label><Textarea value={editingCta.subtitle || ''} onChange={(e) => setEditingCta({ ...editingCta, subtitle: e.target.value })} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Button Text</Label><Input value={editingCta.button_text || ''} onChange={(e) => setEditingCta({ ...editingCta, button_text: e.target.value })} /></div>
                <div><Label>Button URL</Label><Input value={editingCta.button_url || ''} onChange={(e) => setEditingCta({ ...editingCta, button_url: e.target.value })} /></div>
              </div>
              <div><Label>Footer Text</Label><Input value={editingCta.footer_text || ''} onChange={(e) => setEditingCta({ ...editingCta, footer_text: e.target.value })} /></div>
            </div>
          )}
          <DialogFooter><Button onClick={saveCta}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

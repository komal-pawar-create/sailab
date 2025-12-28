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
import { toast } from 'sonner';
import { Trash2, Plus, Save, Star, Layout, BarChart3, Sparkles, ListOrdered, CreditCard, HelpCircle, MessageCircle } from 'lucide-react';

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

const iconOptions = [
  'Users', 'TestTube', 'CreditCard', 'BarChart3', 'Shield', 'Building2', 
  'FileText', 'Clock', 'Smartphone', 'Globe', 'Zap', 'Heart', 'Star', 
  'CheckCircle2', 'Settings', 'Mail', 'Phone', 'Calendar'
];

export function LandingPageManager() {
  const [hero, setHero] = useState<HeroContent | null>(null);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [steps, setSteps] = useState<StepItem[]>([]);
  const [pricing, setPricing] = useState<PricingItem[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [heroRes, statsRes, featuresRes, stepsRes, pricingRes, faqsRes, testimonialsRes] = await Promise.all([
        supabase.from('landing_hero').select('*').limit(1).single(),
        supabase.from('landing_stats').select('*').order('display_order'),
        supabase.from('landing_features').select('*').order('display_order'),
        supabase.from('landing_steps').select('*').order('step_number'),
        supabase.from('landing_pricing').select('*').order('display_order'),
        supabase.from('landing_faqs').select('*').order('display_order'),
        supabase.from('landing_testimonials').select('*').order('display_order')
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

  if (loading) return <div className="text-center py-8">Loading...</div>;

  return (
    <Tabs defaultValue="hero" className="space-y-6">
      <TabsList className="flex flex-wrap gap-1">
        <TabsTrigger value="hero" className="flex items-center gap-1"><Layout className="h-4 w-4" />Hero</TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center gap-1"><BarChart3 className="h-4 w-4" />Stats</TabsTrigger>
        <TabsTrigger value="features" className="flex items-center gap-1"><Sparkles className="h-4 w-4" />Features</TabsTrigger>
        <TabsTrigger value="steps" className="flex items-center gap-1"><ListOrdered className="h-4 w-4" />Steps</TabsTrigger>
        <TabsTrigger value="pricing" className="flex items-center gap-1"><CreditCard className="h-4 w-4" />Pricing</TabsTrigger>
        <TabsTrigger value="faqs" className="flex items-center gap-1"><HelpCircle className="h-4 w-4" />FAQs</TabsTrigger>
        <TabsTrigger value="testimonials" className="flex items-center gap-1"><MessageCircle className="h-4 w-4" />Testimonials</TabsTrigger>
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
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deleteStat(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deleteFeature(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deleteStep(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deletePricing(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deleteFaq(f.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
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
                    <TableCell><Button variant="ghost" size="sm" onClick={() => deleteTestimonial(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

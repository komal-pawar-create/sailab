import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';
import InquiryDialog from '@/components/InquiryDialog';

const BlogCTA = ({ source = 'blog_cta' }: { source?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <section className="my-12 rounded-2xl bg-primary/5 border border-primary/20 p-8 text-center">
      <h3 className="text-2xl font-bold text-foreground mb-3">
        Ready to Transform Your Lab?
      </h3>
      <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
        See how LabFlow can streamline your lab operations with automated billing, digital reports, and multi-branch management.
      </p>
      <Button size="lg" onClick={() => setOpen(true)} className="gap-2">
        <Calendar className="h-4 w-4" />
        Book a Free Demo
      </Button>
      <InquiryDialog open={open} onOpenChange={setOpen} title="Book a Free Demo" source={source} />
    </section>
  );
};

export default BlogCTA;

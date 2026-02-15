import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Send, CheckCircle, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const FEEDBACK_TYPES = ["Compliment", "Suggestion", "Complaint", "General"];

interface LabBranchInfo {
  orgName: string | null;
  branchName: string | null;
}

export default function PublicFeedback() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [labInfo, setLabInfo] = useState<LabBranchInfo | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    feedback_type: "",
    rating: 0,
    message: "",
  });

  // SEO meta tags
  useEffect(() => {
    document.title = 'Patient Feedback — LabFlow LIMS';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Share your feedback about your lab experience. LabFlow helps pathology labs collect and improve patient satisfaction.');
  }, []);

  // SEO meta tags
  useEffect(() => {
    document.title = 'Patient Feedback — LabFlow LIMS';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Share your feedback about your lab experience. LabFlow helps pathology labs collect and improve patient satisfaction.');
  }, []);

  useEffect(() => {
    const fetchLabInfo = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const branchId = urlParams.get('branch');
      
      if (branchId) {
        const { data } = await supabase
          .from('branches')
          .select('name, organizations(name)')
          .eq('id', branchId)
          .single();
        
        if (data) {
          setLabInfo({
            branchName: data.name,
            orgName: (data.organizations as any)?.name || null
          });
        }
      }
    };
    fetchLabInfo();
  }, []);

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.feedback_type || !formData.message.trim()) {
      toast({
        title: "Required fields missing",
        description: "Please select a feedback type and enter your message.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Get lab_id from URL params or use a default public lab
      const urlParams = new URLSearchParams(window.location.search);
      const labId = urlParams.get('lab');
      const branchId = urlParams.get('branch');

      if (!labId) {
        toast({
          title: "Invalid feedback link",
          description: "This feedback link is incomplete. Please contact the lab for a valid link.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from("feedback").insert({
        lab_id: labId,
        branch_id: branchId || null,
        feedback_type: formData.feedback_type,
        rating: formData.rating || null,
        message: `${formData.name ? `Name: ${formData.name}\n` : ""}${formData.phone ? `Phone: ${formData.phone}\n` : ""}${formData.message}`,
        created_by: null, // Anonymous submission
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error submitting feedback",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            {labInfo && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                <Building2 className="h-4 w-4" />
                <span>{labInfo.orgName}{labInfo.branchName && ` - ${labInfo.branchName}`}</span>
              </div>
            )}
            <p className="text-muted-foreground mb-6">
              Your feedback has been submitted successfully. We appreciate you taking the time to share your thoughts with us.
            </p>
            <Button onClick={() => { setSubmitted(false); setFormData({ name: "", phone: "", feedback_type: "", rating: 0, message: "" }); }}>
              Submit Another Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          {labInfo && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary mb-2">
              <Building2 className="h-4 w-4" />
              <span className="font-medium">{labInfo.orgName}{labInfo.branchName && ` - ${labInfo.branchName}`}</span>
            </div>
          )}
          <CardTitle className="text-2xl">Share Your Feedback</CardTitle>
          <CardDescription>
            We value your opinion. Help us improve our services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  placeholder="Enter your phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Feedback Type *</Label>
              <Select
                value={formData.feedback_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, feedback_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent>
                  {FEEDBACK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rating (Optional)</Label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingClick(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= formData.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
                {formData.rating > 0 && (
                  <button
                    type="button"
                    onClick={() => handleRatingClick(0)}
                    className="ml-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Your Message *</Label>
              <Textarea
                id="message"
                placeholder="Tell us about your experience..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Feedback
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

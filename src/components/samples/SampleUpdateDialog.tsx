import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { samplesTable, SampleUpdate } from "@/types/samples";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";

interface SampleUpdateDialogProps {
  sampleId: string;
  currentStatus: string;
  onUpdated?: () => void;
}

const statusFlow: Record<string, string[]> = {
  collected: ["received", "rejected"],
  received: ["processing", "rejected"],
  processing: ["completed", "rejected"],
};

export function SampleUpdateDialog({ sampleId, currentStatus, onUpdated }: SampleUpdateDialogProps) {
  const [open, setOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const nextStatuses = statusFlow[currentStatus] || [];

  if (nextStatuses.length === 0) return null;

  const handleUpdate = async () => {
    if (!newStatus || !user) return;
    if (newStatus === "rejected" && !rejectionReason.trim()) {
      toast({ title: "Error", description: "Please provide a rejection reason", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const updateData: SampleUpdate = { status: newStatus };

      switch (newStatus) {
        case "received":
          updateData.received_at = now;
          updateData.received_by = user.id;
          break;
        case "processing":
          updateData.processing_at = now;
          break;
        case "completed":
          updateData.completed_at = now;
          break;
        case "rejected":
          updateData.rejected_at = now;
          updateData.rejection_reason = rejectionReason;
          break;
      }

      const { error } = await samplesTable()
        .update(updateData)
        .eq("id", sampleId);

      if (error) throw error;

      toast({ title: "Success", description: `Sample status updated to ${newStatus}` });
      queryClient.invalidateQueries({ queryKey: ["samples"] });
      onUpdated?.();
      setOpen(false);
      setNewStatus("");
      setRejectionReason("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Update Status">
          <ArrowRight className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Update Sample Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select next status" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newStatus === "rejected" && (
            <div className="space-y-2">
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
              />
            </div>
          )}

          <Button onClick={handleUpdate} disabled={!newStatus || saving} className="w-full">
            {saving ? "Updating..." : "Update Status"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

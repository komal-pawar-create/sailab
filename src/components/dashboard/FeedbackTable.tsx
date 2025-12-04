import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Eye, Search, Star } from "lucide-react";
import { format } from "date-fns";

interface Feedback {
  id: string;
  feedback_type: string;
  message: string;
  rating: number | null;
  created_at: string;
  patient_id: string | null;
  patients?: {
    id: string;
    full_name: string;
    patient_id: string;
  };
}

interface FeedbackTableProps {
  feedback: Feedback[];
  onRefresh: () => void;
}

export function FeedbackTable({ feedback, onRefresh }: FeedbackTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredFeedback = feedback.filter((f) =>
    f.message.toLowerCase().includes(search.toLowerCase()) ||
    f.feedback_type.toLowerCase().includes(search.toLowerCase()) ||
    f.patients?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case "complaint":
        return <Badge variant="destructive">Complaint</Badge>;
      case "suggestion":
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Suggestion</Badge>;
      case "compliment":
        return <Badge variant="default" className="bg-green-500">Compliment</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">-</span>;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${star <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Type</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead className="w-[100px]">Rating</TableHead>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFeedback.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No feedback found
                </TableCell>
              </TableRow>
            ) : (
              filteredFeedback.slice(0, 50).map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>{getTypeBadge(item.feedback_type)}</TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="truncate">{item.message}</p>
                  </TableCell>
                  <TableCell>{item.patients?.full_name || "Anonymous"}</TableCell>
                  <TableCell>{renderStars(item.rating)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(item.created_at), "dd MMM yy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end">
                      {item.patients?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/patient/${item.patients!.id}`)}
                          title="View Patient"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {filteredFeedback.length > 50 && (
        <p className="text-sm text-muted-foreground text-center">
          Showing 50 of {filteredFeedback.length} feedback items.
        </p>
      )}
    </div>
  );
}

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, Search, Star, QrCode, Link as LinkIcon, Download, Printer } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";
import { AddFeedbackForm } from "@/components/forms/AddFeedbackForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

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
  const { profile } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  const getFeedbackUrl = () => {
    if (!profile?.lab_id) return "";
    const baseUrl = window.location.origin;
    return `${baseUrl}/feedback?lab=${profile.lab_id}${profile.branch_id ? `&branch=${profile.branch_id}` : ''}`;
  };

  const copyFeedbackLink = () => {
    const feedbackUrl = getFeedbackUrl();
    if (!feedbackUrl) return;
    navigator.clipboard.writeText(feedbackUrl);
    toast({
      title: "Link copied!",
      description: "Share this link with patients to collect feedback.",
    });
  };

  const downloadQRCode = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 400;
      canvas.height = 400;
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.fillStyle = "white";
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0, 400, 400);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = "feedback-qr-code.png";
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const printQRCode = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Feedback QR Code</title>
          <style>
            body { 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              margin: 0; 
              font-family: system-ui, sans-serif;
            }
            .container { text-align: center; }
            h1 { font-size: 24px; margin-bottom: 8px; }
            p { color: #666; margin-bottom: 24px; }
            svg { width: 300px; height: 300px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Share Your Feedback</h1>
            <p>Scan this QR code to submit your feedback</p>
            ${svgData}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

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
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyFeedbackLink} title="Copy public feedback link">
            <LinkIcon className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" title="Generate QR Code">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Feedback QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div ref={qrRef} className="p-4 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={getFeedbackUrl()} 
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Patients can scan this QR code to submit feedback
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadQRCode}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={printQRCode}>
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <AddFeedbackForm onFeedbackAdded={onRefresh} />
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
                    {formatDate(item.created_at)}
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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TestTube, FileText, Receipt, Bell, MessageSquare } from "lucide-react";
import { PatientsTable } from "./PatientsTable";
import { ReportsTable } from "./ReportsTable";
import { DocumentsTable } from "./DocumentsTable";
import { BillsTable } from "./BillsTable";
import { FollowupsTable } from "./FollowupsTable";
import { FeedbackTable } from "./FeedbackTable";

interface DataTabsProps {
  patients: any[];
  reports: any[];
  documents: any[];
  bills: any[];
  followups: any[];
  feedback: any[];
  onRefresh: () => void;
}

export function DataTabs({ patients, reports, documents, bills, followups, feedback, onRefresh }: DataTabsProps) {
  const tabs = [
    { id: "patients", label: "Patients", icon: Users, count: patients.length },
    { id: "reports", label: "Test Reports", icon: TestTube, count: reports.length },
    { id: "documents", label: "Documents", icon: FileText, count: documents.length },
    { id: "bills", label: "Bills", icon: Receipt, count: bills.length },
    { id: "followups", label: "Follow-ups", icon: Bell, count: followups.length },
    { id: "feedback", label: "Feedback", icon: MessageSquare, count: feedback.length },
  ];

  return (
    <Tabs defaultValue="patients" className="w-full">
      <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-1.5 data-[state=active]:bg-background"
          >
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
              {tab.count}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="patients" className="mt-4">
        <PatientsTable patients={patients} onRefresh={onRefresh} />
      </TabsContent>

      <TabsContent value="reports" className="mt-4">
        <ReportsTable reports={reports} onRefresh={onRefresh} />
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <DocumentsTable documents={documents} onRefresh={onRefresh} />
      </TabsContent>

      <TabsContent value="bills" className="mt-4">
        <BillsTable bills={bills} onRefresh={onRefresh} />
      </TabsContent>

      <TabsContent value="followups" className="mt-4">
        <FollowupsTable followups={followups} onRefresh={onRefresh} />
      </TabsContent>

      <TabsContent value="feedback" className="mt-4">
        <FeedbackTable feedback={feedback} onRefresh={onRefresh} />
      </TabsContent>
    </Tabs>
  );
}

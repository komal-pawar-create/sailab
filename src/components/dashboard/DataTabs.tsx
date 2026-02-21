import React, { memo } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TestTube, FileText, Receipt, Bell, MessageSquare, Wallet, Beaker } from "lucide-react";
import { PatientsTable } from "./PatientsTable";
import { ReportsTable } from "./ReportsTable";
import { DocumentsTable } from "./DocumentsTable";
import { BillsTable } from "./BillsTable";
import { FollowupsTable } from "./FollowupsTable";
import { FeedbackTable } from "./FeedbackTable";
import { LedgerTable } from "./LedgerTable";
import { SampleTrackingTab } from "@/components/samples/SampleTrackingTab";
import { useIsMobile } from "@/hooks/use-mobile";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearch: (search: string) => void;
  isLoading?: boolean;
}

interface DataTabsProps {
  patients: any[];
  reports: any[];
  documents: any[];
  bills: any[];
  followups: any[];
  feedback: any[];
  payments: any[];
  totalCollected: number;
  samples: any[];
  patientsPagination: PaginationProps;
  reportsPagination: PaginationProps;
  documentsPagination: PaginationProps;
  billsPagination: PaginationProps;
  followupsPagination: PaginationProps;
  feedbackPagination: PaginationProps;
  paymentsPagination: PaginationProps;
  samplesPagination: PaginationProps;
  onRefresh: () => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const DataTabs = memo(function DataTabs({ 
  patients, reports, documents, bills, followups, feedback, payments,
  totalCollected, samples,
  patientsPagination, reportsPagination, documentsPagination, billsPagination,
  followupsPagination, feedbackPagination, paymentsPagination, samplesPagination,
  onRefresh,
  activeTab = 'patients',
  onTabChange
}: DataTabsProps) {
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  const tabs = [
    { id: "patients", label: t('app.tabs.patients'), shortLabel: t('app.tabs.patientsShort'), icon: Users, count: patientsPagination.totalCount, tourId: "patients-tab" },
    { id: "reports", label: t('app.tabs.testReports'), shortLabel: t('app.tabs.testReportsShort'), icon: TestTube, count: reportsPagination.totalCount, tourId: "reports-tab" },
    { id: "documents", label: t('app.tabs.documents'), shortLabel: t('app.tabs.documentsShort'), icon: FileText, count: documentsPagination.totalCount },
    { id: "bills", label: t('app.tabs.bills'), shortLabel: t('app.tabs.billsShort'), icon: Receipt, count: billsPagination.totalCount, tourId: "bills-tab" },
    { id: "followups", label: t('app.tabs.followups'), shortLabel: t('app.tabs.followupsShort'), icon: Bell, count: followupsPagination.totalCount },
    { id: "feedback", label: t('app.tabs.feedback'), shortLabel: t('app.tabs.feedbackShort'), icon: MessageSquare, count: feedbackPagination.totalCount },
    { id: "ledger", label: t('app.tabs.ledger'), shortLabel: t('app.tabs.ledgerShort'), icon: Wallet, count: paymentsPagination.totalCount },
    { id: "samples", label: "Samples", shortLabel: "Samples", icon: Beaker, count: samplesPagination.totalCount },
  ];

  const TabsListContent = (
    <>
      {tabs.map((tab) => (
        <TabsTrigger
          key={tab.id}
          value={tab.id}
          className={cn(
            "flex items-center gap-1.5 data-[state=active]:bg-background shrink-0",
            isMobile && "min-h-touch px-3"
          )}
          data-tour={tab.tourId}
        >
          <tab.icon className={cn("h-4 w-4", isMobile && "h-3.5 w-3.5")} />
          <span className={cn(isMobile ? "text-xs" : "hidden sm:inline")}>
            {isMobile ? tab.shortLabel : tab.label}
          </span>
          <span className={cn(
            "text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full",
            isMobile && "text-[10px] px-1"
          )}>
            {tab.count}
          </span>
        </TabsTrigger>
      ))}
    </>
  );

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      {isMobile ? (
        <div className="-mx-4 px-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto gap-1 bg-muted/50 p-1 w-max">
              {TabsListContent}
            </TabsList>
            <ScrollBar orientation="horizontal" className="h-1.5" />
          </ScrollArea>
        </div>
      ) : (
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-1">
          {TabsListContent}
        </TabsList>
      )}

      <TabsContent value="patients" className="mt-4">
        <PatientsTable 
          patients={patients} 
          totalCount={patientsPagination.totalCount}
          currentPage={patientsPagination.currentPage}
          pageSize={patientsPagination.pageSize}
          onPageChange={patientsPagination.onPageChange}
          onPageSizeChange={patientsPagination.onPageSizeChange}
          onSearch={patientsPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={patientsPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="reports" className="mt-4">
        <ReportsTable 
          reports={reports} 
          totalCount={reportsPagination.totalCount}
          currentPage={reportsPagination.currentPage}
          pageSize={reportsPagination.pageSize}
          onPageChange={reportsPagination.onPageChange}
          onPageSizeChange={reportsPagination.onPageSizeChange}
          onSearch={reportsPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={reportsPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="documents" className="mt-4">
        <DocumentsTable 
          documents={documents} 
          totalCount={documentsPagination.totalCount}
          currentPage={documentsPagination.currentPage}
          pageSize={documentsPagination.pageSize}
          onPageChange={documentsPagination.onPageChange}
          onPageSizeChange={documentsPagination.onPageSizeChange}
          onSearch={documentsPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={documentsPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="bills" className="mt-4">
        <BillsTable 
          bills={bills} 
          totalCount={billsPagination.totalCount}
          currentPage={billsPagination.currentPage}
          pageSize={billsPagination.pageSize}
          onPageChange={billsPagination.onPageChange}
          onPageSizeChange={billsPagination.onPageSizeChange}
          onSearch={billsPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={billsPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="followups" className="mt-4">
        <FollowupsTable 
          followups={followups} 
          totalCount={followupsPagination.totalCount}
          currentPage={followupsPagination.currentPage}
          pageSize={followupsPagination.pageSize}
          onPageChange={followupsPagination.onPageChange}
          onPageSizeChange={followupsPagination.onPageSizeChange}
          onSearch={followupsPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={followupsPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="feedback" className="mt-4">
        <FeedbackTable 
          feedback={feedback} 
          totalCount={feedbackPagination.totalCount}
          currentPage={feedbackPagination.currentPage}
          pageSize={feedbackPagination.pageSize}
          onPageChange={feedbackPagination.onPageChange}
          onPageSizeChange={feedbackPagination.onPageSizeChange}
          onSearch={feedbackPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={feedbackPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="ledger" className="mt-4">
        <LedgerTable 
          payments={payments} 
          totalCount={paymentsPagination.totalCount}
          totalCollected={totalCollected}
          currentPage={paymentsPagination.currentPage}
          pageSize={paymentsPagination.pageSize}
          onPageChange={paymentsPagination.onPageChange}
          onPageSizeChange={paymentsPagination.onPageSizeChange}
          onSearch={paymentsPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={paymentsPagination.isLoading}
        />
      </TabsContent>

      <TabsContent value="samples" className="mt-4">
        <SampleTrackingTab
          samples={samples}
          totalCount={samplesPagination.totalCount}
          currentPage={samplesPagination.currentPage}
          pageSize={samplesPagination.pageSize}
          onPageChange={samplesPagination.onPageChange}
          onPageSizeChange={samplesPagination.onPageSizeChange}
          onSearch={samplesPagination.onSearch}
          onRefresh={onRefresh}
          isLoading={samplesPagination.isLoading}
        />
      </TabsContent>
    </Tabs>
  );
});

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PatientReport } from '@/components/reports/PatientReport';
import { BillsReport } from '@/components/reports/BillsReport';
import { TestReportsReport } from '@/components/reports/TestReportsReport';
import { RevenueReport } from '@/components/reports/RevenueReport';
import { CollectionReport } from '@/components/reports/CollectionReport';
import { DoctorReferralReport } from '@/components/reports/DoctorReferralReport';
import { DailyActivityReport } from '@/components/reports/DailyActivityReport';
import { Users, Receipt, FileText, TrendingUp, Wallet, Stethoscope, Calendar } from 'lucide-react';

export default function Reports() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Generate and export reports in Excel or PDF format</p>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="patients" className="gap-2">
            <Users className="h-4 w-4" /> Patients
          </TabsTrigger>
          <TabsTrigger value="bills" className="gap-2">
            <Receipt className="h-4 w-4" /> Bills
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <FileText className="h-4 w-4" /> Test Reports
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Revenue
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-2">
            <Wallet className="h-4 w-4" /> Collections
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Stethoscope className="h-4 w-4" /> Referrals
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="h-4 w-4" /> Daily Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="mt-6">
          <PatientReport />
        </TabsContent>
        <TabsContent value="bills" className="mt-6">
          <BillsReport />
        </TabsContent>
        <TabsContent value="tests" className="mt-6">
          <TestReportsReport />
        </TabsContent>
        <TabsContent value="revenue" className="mt-6">
          <RevenueReport />
        </TabsContent>
        <TabsContent value="collections" className="mt-6">
          <CollectionReport />
        </TabsContent>
        <TabsContent value="referrals" className="mt-6">
          <DoctorReferralReport />
        </TabsContent>
        <TabsContent value="daily" className="mt-6">
          <DailyActivityReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

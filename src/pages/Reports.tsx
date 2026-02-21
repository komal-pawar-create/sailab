import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import { PatientReport } from '@/components/reports/PatientReport';
import { BillsReport } from '@/components/reports/BillsReport';
import { TestReportsReport } from '@/components/reports/TestReportsReport';
import { RevenueReport } from '@/components/reports/RevenueReport';
import { CollectionReport } from '@/components/reports/CollectionReport';
import { DoctorReferralReport } from '@/components/reports/DoctorReferralReport';
import { DailyActivityReport } from '@/components/reports/DailyActivityReport';
import { CommissionSummaryReport } from '@/components/reports/CommissionSummaryReport';
import { Users, Receipt, FileText, TrendingUp, Wallet, Stethoscope, Calendar, BarChart3 } from 'lucide-react';

export default function Reports() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t('app.reports.title')}</h1>
        <p className="text-muted-foreground">{t('app.reports.subtitle')}</p>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted p-1">
          <TabsTrigger value="patients" className="gap-2">
            <Users className="h-4 w-4" /> {t('app.reports.patients')}
          </TabsTrigger>
          <TabsTrigger value="bills" className="gap-2">
            <Receipt className="h-4 w-4" /> {t('app.reports.bills')}
          </TabsTrigger>
          <TabsTrigger value="tests" className="gap-2">
            <FileText className="h-4 w-4" /> {t('app.reports.testReports')}
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2">
            <TrendingUp className="h-4 w-4" /> {t('app.reports.revenue')}
          </TabsTrigger>
          <TabsTrigger value="collections" className="gap-2">
            <Wallet className="h-4 w-4" /> {t('app.reports.collections')}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="gap-2">
            <Stethoscope className="h-4 w-4" /> {t('app.reports.referrals')}
          </TabsTrigger>
          <TabsTrigger value="commission" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Commission
          </TabsTrigger>
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="h-4 w-4" /> {t('app.reports.dailyActivity')}
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
        <TabsContent value="commission" className="mt-6">
          <CommissionSummaryReport />
        </TabsContent>
        <TabsContent value="daily" className="mt-6">
          <DailyActivityReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

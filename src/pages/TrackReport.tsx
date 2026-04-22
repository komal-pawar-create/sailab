import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2, Clock, CheckCircle2, AlertCircle, Beaker } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TrackData {
  found: boolean;
  bill?: { id: string; bill_number: string; bill_date: string };
  lab?: { name: string; logo_url?: string | null; phone?: string | null; branch_name?: string };
  patient?: { display_name: string };
  reports?: Array<{ id: string; test_type: string; status: string; created_at: string }>;
  documents?: Array<{ id: string; file_name: string; file_type: string; created_at: string; signed_url: string | null }>;
}

const statusVariant = (status: string) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'delivered') return { label: 'Completed', variant: 'success' as const, icon: CheckCircle2 };
  if (s === 'processing' || s === 'in_progress') return { label: 'Processing', variant: 'info' as const, icon: Loader2 };
  return { label: 'Pending', variant: 'muted' as const, icon: Clock };
};

const TrackReport = () => {
  const { billId } = useParams<{ billId: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!billId) return;
      setLoading(true);
      const { data: res, error: err } = await supabase.rpc('get_patient_reports_by_bill', {
        p_bill_id: billId,
      });
      if (err) {
        setError(err.message);
      } else {
        setData(res as unknown as TrackData);
      }
      setLoading(false);
    };
    load();
  }, [billId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading your reports...
        </div>
      </div>
    );
  }

  if (error || !data?.found) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
            <h2 className="text-lg font-semibold mb-2">Report Not Found</h2>
            <p className="text-sm text-muted-foreground">
              We couldn't find a report for this link. Please check your bill or contact the lab.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { bill, lab, patient, reports = [], documents = [] } = data;

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {lab?.logo_url ? (
            <img src={lab.logo_url} alt={lab.name} className="h-12 w-12 object-contain rounded" />
          ) : (
            <div className="h-12 w-12 rounded bg-primary/10 flex items-center justify-center">
              <Beaker className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{lab?.name || 'Laboratory'}</h1>
            {lab?.branch_name && (
              <p className="text-xs text-muted-foreground truncate">{lab.branch_name}</p>
            )}
          </div>
          {lab?.phone && (
            <a href={`tel:${lab.phone}`} className="text-sm text-primary hover:underline">
              📞 Call
            </a>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Greeting */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Reports for</p>
            <h2 className="text-2xl font-bold">{patient?.display_name || 'Patient'}</h2>
            <p className="text-xs text-muted-foreground mt-2">
              Bill: <span className="font-mono">{bill?.bill_number}</span>
              {bill?.bill_date && <> · {formatDate(bill.bill_date)}</>}
            </p>
          </CardContent>
        </Card>

        {/* Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Beaker className="h-4 w-4" />
              Test Reports ({reports.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                Your report is being prepared. Please check back later.
              </div>
            ) : (
              <ul className="space-y-2">
                {reports.map((r) => {
                  const s = statusVariant(r.status);
                  const Icon = s.icon;
                  return (
                    <li key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{r.test_type}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                      </div>
                      <Badge variant={s.variant} className="gap-1 shrink-0">
                        <Icon className="h-3 w-3" />
                        {s.label}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Uploaded Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                No documents uploaded yet.
              </div>
            ) : (
              <ul className="space-y-2">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-center justify-between p-3 rounded-lg border bg-card gap-2">
                    <div className="min-w-0 flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
                      </div>
                    </div>
                    {d.signed_url ? (
                      <Button size="sm" variant="outline" asChild>
                        <a href={d.signed_url} target="_blank" rel="noopener noreferrer" download>
                          <Download className="h-4 w-4 mr-1" />
                          View
                        </a>
                      </Button>
                    ) : (
                      <Badge variant="muted">Unavailable</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          🔒 Secure link · Documents accessible for a limited time
        </p>
      </main>
    </div>
  );
};

export default TrackReport;

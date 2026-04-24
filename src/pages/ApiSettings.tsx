import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare, Phone, MessageCircle, CheckCircle2, Send, FlaskConical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function ApiSettings() {
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<Record<string, string>>({});

  // Email (Resend) Settings
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendFromEmail, setResendFromEmail] = useState("");
  const [resendFromName, setResendFromName] = useState("");

  // SMS Settings
  const [smsProvider, setSmsProvider] = useState("");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [smsSenderId, setSmsSenderId] = useState("");
  const [smsApiUrl, setSmsApiUrl] = useState("");

  // WhatsApp Settings
  const [whatsappApiKey, setWhatsappApiKey] = useState("");
  const [whatsappPhoneNumberId, setWhatsappPhoneNumberId] = useState("");
  const [whatsappBusinessAccountId, setWhatsappBusinessAccountId] = useState("");

  // MyOperator WhatsApp Settings
  const [myopCompanyId, setMyopCompanyId] = useState(() => localStorage.getItem("labflow_myop_company_id") ?? "");
  const [myopPhoneNumberId, setMyopPhoneNumberId] = useState(() => localStorage.getItem("labflow_myop_phone_number_id") ?? "");
  const [myopWabaId, setMyopWabaId] = useState(() => localStorage.getItem("labflow_myop_waba_id") ?? "");
  const [myopTemplate, setMyopTemplate] = useState(() => localStorage.getItem("labflow_myop_template") ?? "copy_labflow");
  const [myopLanguage, setMyopLanguage] = useState(() => localStorage.getItem("labflow_myop_language") ?? "en");

  // Test WhatsApp state
  const [testPhone, setTestPhone] = useState("");
  const [testFirstName, setTestFirstName] = useState("Test");
  const [testTestName, setTestTestName] = useState("CBC");
  const [testLink, setTestLink] = useState("https://labflow.mywebz.in/track/demo");
  const [testLabName, setTestLabName] = useState("LabFlow");
  const [testMode, setTestMode] = useState<"test" | "send">("test");
  const [testRunning, setTestRunning] = useState(false);
  const [testResponse, setTestResponse] = useState<string>("");

  const stamp = (key: string) => {
    const t = new Date().toLocaleTimeString();
    setSavedAt((prev) => ({ ...prev, [key]: t }));
  };

  const handleSaveEmailSettings = async () => {
    setLoading(true);
    try {
      // Store in localStorage (frontend) and log for admin to add to Supabase secrets
      localStorage.setItem('resend_api_key', resendApiKey);
      localStorage.setItem('resend_from_email', resendFromEmail);
      localStorage.setItem('resend_from_name', resendFromName);
      
      stamp("email");
      toast.success("Email settings saved. Add RESEND_API_KEY to Supabase secrets for production use.");
      console.log('RESEND_API_KEY needed in Supabase secrets');
    } catch (error) {
      toast.error("Failed to save email settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSmsSettings = async () => {
    setLoading(true);
    try {
      localStorage.setItem('sms_provider', smsProvider);
      localStorage.setItem('sms_api_key', smsApiKey);
      localStorage.setItem('sms_sender_id', smsSenderId);
      localStorage.setItem('sms_api_url', smsApiUrl);
      
      stamp("sms");
      toast.success("SMS settings saved. Add SMS_API_KEY, SMS_API_URL, SMS_SENDER_ID, SMS_PROVIDER to Supabase secrets.");
      console.log('SMS secrets needed in Supabase:', { SMS_API_KEY: smsApiKey, SMS_API_URL: smsApiUrl, SMS_SENDER_ID: smsSenderId, SMS_PROVIDER: smsProvider });
    } catch (error) {
      toast.error("Failed to save SMS settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWhatsappSettings = async () => {
    setLoading(true);
    try {
      localStorage.setItem('whatsapp_api_key', whatsappApiKey);
      localStorage.setItem('whatsapp_phone_number_id', whatsappPhoneNumberId);
      localStorage.setItem('whatsapp_business_account_id', whatsappBusinessAccountId);
      
      stamp("whatsapp");
      toast.success("WhatsApp settings saved. Add WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER_ID to Supabase secrets.");
      console.log('WhatsApp secrets needed in Supabase:', { WHATSAPP_API_KEY: whatsappApiKey, WHATSAPP_PHONE_NUMBER_ID: whatsappPhoneNumberId });
    } catch (error) {
      toast.error("Failed to save WhatsApp settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMyopSettings = () => {
    setLoading(true);
    try {
      localStorage.setItem("labflow_myop_company_id", myopCompanyId);
      localStorage.setItem("labflow_myop_phone_number_id", myopPhoneNumberId);
      localStorage.setItem("labflow_myop_waba_id", myopWabaId);
      localStorage.setItem("labflow_myop_template", myopTemplate);
      localStorage.setItem("labflow_myop_language", myopLanguage);
      stamp("myop");
      toast.success(
        "MyOperator settings saved. Make sure MYOPERATOR_TOKEN, MYOPERATOR_COMPANY_ID, MYOPERATOR_PHONE_NUMBER_ID are set in Lovable Cloud secrets."
      );
    } catch {
      toast.error("Failed to save MyOperator settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestWhatsapp = async () => {
    if (!testPhone || testPhone.replace(/[^0-9]/g, "").length < 10) {
      toast.error("Enter a valid phone number (with or without +91)");
      return;
    }
    setTestRunning(true);
    setTestResponse("");
    try {
      const digits = testPhone.replace(/[^0-9]/g, "");
      const phone = digits.length === 10 ? `91${digits}` : digits;
      const params = [testFirstName || "Test", testTestName || "CBC", testLink || "https://labflow.mywebz.in/track/demo", testLabName || "LabFlow"];
      const requestBody = {
        to: phone,
        templateName: myopTemplate || "copy_labflow",
        languageCode: myopLanguage || "en",
        params,
        mode: testMode,
      };
      console.log("[ApiSettings] test WhatsApp request:", requestBody);
      const { data, error } = await supabase.functions.invoke("send-myoperator-whatsapp", { body: requestBody });
      const result = error
        ? { invoke_error: error.message || String(error), data }
        : data;
      setTestResponse(JSON.stringify(result, null, 2));
      if (error || !data?.success) {
        toast.error("Test failed — see response panel below for details", { duration: 8000 });
      } else {
        toast.success(testMode === "test" ? "Payload assembled (test mode — not sent)" : "Test message sent successfully");
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      setTestResponse(JSON.stringify({ exception: msg }, null, 2));
      toast.error(`Test failed: ${msg}`, { duration: 8000 });
    } finally {
      setTestRunning(false);
    }
  };

  const SavedBadge = ({ k }: { k: string }) =>
    savedAt[k] ? (
      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-md px-3 py-2">
        <CheckCircle2 className="w-4 h-4" />
        <span>Saved at {savedAt[k]} — these IDs are stored locally for reference only. The edge function uses Lovable Cloud secrets.</span>
      </div>
    ) : null;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure API keys for email, SMS, and WhatsApp notifications
        </p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="email">
            <Mail className="w-4 h-4 mr-2" />
            Email (Resend)
          </TabsTrigger>
          <TabsTrigger value="sms">
            <Phone className="w-4 h-4 mr-2" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageSquare className="w-4 h-4 mr-2" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="myop">
            <MessageCircle className="w-4 h-4 mr-2" />
            MyOperator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration (Resend)</CardTitle>
              <CardDescription>
                Configure Resend API for sending email notifications. Get your API key from{" "}
                <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  resend.com/api-keys
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend-api-key">Resend API Key *</Label>
                <Input
                  id="resend-api-key"
                  type="password"
                  placeholder="re_xxxxxxxxxxxxx"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-email">From Email *</Label>
                <Input
                  id="from-email"
                  type="email"
                  placeholder="notifications@yourdomain.com"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  placeholder="Lab Notifications"
                  value={resendFromName}
                  onChange={(e) => setResendFromName(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveEmailSettings} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Email Settings
              </Button>
              <SavedBadge k="email" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card>
            <CardHeader>
              <CardTitle>SMS Configuration</CardTitle>
              <CardDescription>
                Configure SMS provider for sending text notifications (e.g., Twilio, MSG91, Textlocal)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sms-provider">SMS Provider</Label>
                <Input
                  id="sms-provider"
                  placeholder="Twilio, MSG91, or Textlocal"
                  value={smsProvider}
                  onChange={(e) => setSmsProvider(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-api-key">API Key / Auth Token *</Label>
                <Input
                  id="sms-api-key"
                  type="password"
                  placeholder="Your SMS API key"
                  value={smsApiKey}
                  onChange={(e) => setSmsApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-sender-id">Sender ID</Label>
                <Input
                  id="sms-sender-id"
                  placeholder="LABSMS"
                  value={smsSenderId}
                  onChange={(e) => setSmsSenderId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sms-api-url">API URL</Label>
                <Input
                  id="sms-api-url"
                  placeholder="https://api.provider.com/send"
                  value={smsApiUrl}
                  onChange={(e) => setSmsApiUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveSmsSettings} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save SMS Settings
              </Button>
              <SavedBadge k="sms" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp Configuration</CardTitle>
              <CardDescription>
                Configure WhatsApp Business API for sending messages. Get your credentials from{" "}
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                  Meta for Developers
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="whatsapp-api-key">WhatsApp API Token *</Label>
                <Input
                  id="whatsapp-api-key"
                  type="password"
                  placeholder="EAAxxxxxxxxxxxxx"
                  value={whatsappApiKey}
                  onChange={(e) => setWhatsappApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-phone-id">Phone Number ID *</Label>
                <Input
                  id="whatsapp-phone-id"
                  placeholder="123456789012345"
                  value={whatsappPhoneNumberId}
                  onChange={(e) => setWhatsappPhoneNumberId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsapp-business-id">Business Account ID</Label>
                <Input
                  id="whatsapp-business-id"
                  placeholder="987654321098765"
                  value={whatsappBusinessAccountId}
                  onChange={(e) => setWhatsappBusinessAccountId(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveWhatsappSettings} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save WhatsApp Settings
              </Button>
              <SavedBadge k="whatsapp" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="myop">
          <Card>
            <CardHeader>
              <CardTitle>WhatsApp via MyOperator</CardTitle>
              <CardDescription>
                Send patient report tracking links on WhatsApp using your MyOperator-approved template
                (e.g. <code>copy_labflow</code>). Sensitive credentials (token) live server-side as Lovable Cloud
                secrets — only non-secret IDs are stored here for reference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
                Add these to Lovable Cloud secrets (already requested):
                <code className="mx-1">MYOPERATOR_TOKEN</code>,
                <code className="mx-1">MYOPERATOR_COMPANY_ID</code>,
                <code className="mx-1">MYOPERATOR_PHONE_NUMBER_ID</code>.
              </div>
              <div className="space-y-2">
                <Label htmlFor="myop-company-id">Company ID (reference)</Label>
                <Input
                  id="myop-company-id"
                  placeholder="68b03dfe3cdbe222"
                  value={myopCompanyId}
                  onChange={(e) => setMyopCompanyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="myop-phone-id">Phone Number ID (reference)</Label>
                <Input
                  id="myop-phone-id"
                  placeholder="700668386473133"
                  value={myopPhoneNumberId}
                  onChange={(e) => setMyopPhoneNumberId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="myop-waba-id">WABA ID (optional)</Label>
                <Input
                  id="myop-waba-id"
                  placeholder="WhatsApp Business Account ID"
                  value={myopWabaId}
                  onChange={(e) => setMyopWabaId(e.target.value)}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="myop-template">Default Template</Label>
                  <Input
                    id="myop-template"
                    placeholder="copy_labflow"
                    value={myopTemplate}
                    onChange={(e) => setMyopTemplate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="myop-language">Language Code</Label>
                  <Input
                    id="myop-language"
                    placeholder="en"
                    value={myopLanguage}
                    onChange={(e) => setMyopLanguage(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleSaveMyopSettings} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save MyOperator Settings
              </Button>
              <SavedBadge k="myop" />

              <Separator className="my-2" />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold">Send Test WhatsApp</h3>
                  <Badge variant="secondary">Diagnostic</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sends to the MyOperator API using the <code>copy_labflow</code> template (or whatever you set above).
                  Use <strong>Test mode</strong> first to inspect the assembled payload without actually sending.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="test-phone">Phone Number *</Label>
                    <Input
                      id="test-phone"
                      placeholder="+91 98765 43210"
                      value={testPhone}
                      onChange={(e) => setTestPhone(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-firstname">{`{{1}} First name`}</Label>
                    <Input
                      id="test-firstname"
                      value={testFirstName}
                      onChange={(e) => setTestFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-testname">{`{{2}} Test / report name`}</Label>
                    <Input
                      id="test-testname"
                      value={testTestName}
                      onChange={(e) => setTestTestName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="test-link">{`{{3}} Tracking link`}</Label>
                    <Input
                      id="test-link"
                      value={testLink}
                      onChange={(e) => setTestLink(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="test-labname">{`{{4}} Lab name`}</Label>
                    <Input
                      id="test-labname"
                      value={testLabName}
                      onChange={(e) => setTestLabName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={testMode === "test" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTestMode("test")}
                  >
                    Test mode (no send)
                  </Button>
                  <Button
                    variant={testMode === "send" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTestMode("send")}
                  >
                    Live send
                  </Button>
                  <div className="flex-1" />
                  <Button onClick={handleSendTestWhatsapp} disabled={testRunning}>
                    {testRunning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {testMode === "test" ? "Assemble payload" : "Send test message"}
                  </Button>
                </div>

                {testResponse && (
                  <div className="space-y-2">
                    <Label>API Response</Label>
                    <pre className="text-xs bg-muted/40 border rounded-md p-3 overflow-auto max-h-[400px] whitespace-pre-wrap break-all">
                      {testResponse}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

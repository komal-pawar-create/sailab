import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Mail, MessageSquare, Phone } from "lucide-react";

export default function ApiSettings() {
  const [loading, setLoading] = useState(false);

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

  const handleSaveEmailSettings = async () => {
    setLoading(true);
    try {
      // Store in localStorage (frontend) and log for admin to add to Supabase secrets
      localStorage.setItem('resend_api_key', resendApiKey);
      localStorage.setItem('resend_from_email', resendFromEmail);
      localStorage.setItem('resend_from_name', resendFromName);
      
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
      
      toast.success("WhatsApp settings saved. Add WHATSAPP_API_KEY, WHATSAPP_PHONE_NUMBER_ID to Supabase secrets.");
      console.log('WhatsApp secrets needed in Supabase:', { WHATSAPP_API_KEY: whatsappApiKey, WHATSAPP_PHONE_NUMBER_ID: whatsappPhoneNumberId });
    } catch (error) {
      toast.error("Failed to save WhatsApp settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">API Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Configure API keys for email, SMS, and WhatsApp notifications
        </p>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

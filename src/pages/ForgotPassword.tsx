import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [step, setStep] = useState<'username' | 'otp' | 'password'>('username');
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // noindex for auth utility pages
  useEffect(() => {
    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.setAttribute('name', 'robots');
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.setAttribute('content', 'noindex, nofollow');
    return () => { robotsMeta?.remove(); };
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: { username }
      });

      if (error) throw error;

      if (data.success) {
        setMobileNumber(data.maskedMobile);
        setUserId(data.userId);
        setStep('otp');
        toast({
          title: t('app.success.otpSent'),
          description: t('app.success.otpSentDesc', { phone: data.maskedMobile }),
        });
      }
    } catch (error: any) {
      toast({
        title: t('app.errors.failed'),
        description: error.message || t('app.errors.sendOtpFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: t('app.errors.failed'),
        description: t('app.errors.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { 
          userId, 
          otp, 
          newPassword 
        }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: t('app.success.otpSent'),
          description: t('app.success.passwordReset'),
        });
        navigate('/auth');
      }
    } catch (error: any) {
      toast({
        title: t('app.errors.failed'),
        description: error.message || t('app.errors.verifyOtpFailed'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 w-fit"
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('app.common.backToLogin')}
          </Button>
          <CardTitle>{t('app.auth.resetPassword')}</CardTitle>
          <CardDescription>
            {step === 'username' && t('app.auth.enterUsernameForOtp')}
            {step === 'otp' && t('app.auth.otpSentTo', { phone: mobileNumber })}
            {step === 'password' && t('app.auth.enterNewPassword')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'username' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('app.auth.username')}</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder={t('app.auth.enterUsername')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !username}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('app.auth.sendOtp')}
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">{t('app.auth.otpCode')}</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder={t('app.auth.enterOtp')}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('app.auth.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder={t('app.auth.enterNewPassword')}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('app.auth.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('app.auth.confirmNewPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !otp || !newPassword || !confirmPassword}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('app.auth.resetPassword')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
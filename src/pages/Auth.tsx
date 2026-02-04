import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth, type AuthError } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { type RateLimitState, getTimeUntilUnlock } from '@/lib/security';
import { AlertTriangle, ArrowLeft, Clock, ShieldAlert } from 'lucide-react';

const Auth = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitState, setRateLimitState] = useState<RateLimitState | null>(null);
  const [lockoutCountdown, setLockoutCountdown] = useState<string | null>(null);
  
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Countdown timer for lockout
  useEffect(() => {
    if (!rateLimitState?.lockedUntil) {
      setLockoutCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      if (rateLimitState.lockedUntil && rateLimitState.lockedUntil > now) {
        setLockoutCountdown(getTimeUntilUnlock(rateLimitState.lockedUntil));
      } else {
        setLockoutCountdown(null);
        setRateLimitState(null); // Reset rate limit state when lockout expires
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [rateLimitState?.lockedUntil]);

  // Redirect authenticated users to their appropriate dashboard
  useEffect(() => {
    // Only redirect if auth is not loading and we have a user
    if (!authLoading && user) {
      // Give a small delay to ensure profile is loaded
      const redirectTimer = setTimeout(() => {
        if (profile?.role === 'super_admin') {
          console.log('Redirecting super admin to /super-admin');
          navigate('/super-admin');
        } else if (profile?.role === 'lab_admin') {
          console.log('Redirecting lab admin to /dashboard');
          navigate('/dashboard');
        } else if (profile) {
          console.log('Redirecting user to /dashboard');
          navigate('/dashboard');
        }
      }, 100);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, profile, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow login during lockout
    if (rateLimitState && !rateLimitState.allowed && lockoutCountdown) {
      return;
    }
    
    setIsLoading(true);
    
    const result = await signIn(username, password);
    
    // Update rate limit state from response
    if (result.rateLimitState) {
      setRateLimitState(result.rateLimitState);
    }
    
    if (result.error) {
      toast({
        title: "Error",
        description: result.error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const isLockedOut = rateLimitState && !rateLimitState.allowed && lockoutCountdown;
  const showWarning = rateLimitState && rateLimitState.allowed && rateLimitState.remainingAttempts < 5;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Button
            variant="ghost"
            size="sm"
            className="mb-4 w-fit"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div className="relative flex justify-center mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-xl -z-10 rounded-full scale-150" />
            <img 
              src="/images/labflow-logo.png" 
              alt="LabFlow" 
              className="h-16 sm:h-20 md:h-16 w-auto object-contain relative z-10" 
            />
          </div>
          <CardDescription>Access your laboratory management system</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Lockout Alert */}
          {isLockedOut && (
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Account locked. Try again in <strong>{lockoutCountdown}</strong>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning when attempts are low */}
          {showWarning && (
            <Alert className="mb-4 border-warning bg-warning/10">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <AlertDescription className="text-warning">
                {rateLimitState.remainingAttempts} login attempt{rateLimitState.remainingAttempts !== 1 ? 's' : ''} remaining before temporary lockout.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={!!isLockedOut}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={!!isLockedOut}
                  />
                </div>
                <div className="text-right">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !!isLockedOut}
                >
                  {isLoading ? 'Signing In...' : isLockedOut ? 'Account Locked' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

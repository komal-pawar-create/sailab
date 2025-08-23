import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
  };

  // Sign up functionality removed - only admins can create users

  const fillSampleCredentials = (userType: string) => {
    switch (userType) {
      case 'admin':
        setEmail('admin@labmaster.com');
        setPassword('admin123');
        break;
      case 'operator1':
        setEmail('operator1@centrallab.com');
        setPassword('operator123');
        break;
      case 'operator2':
        setEmail('operator2@northlab.com');
        setPassword('operator123');
        break;
      case 'operator3':
        setEmail('operator3@westlab.com');
        setPassword('operator123');
        break;
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Lab Master</CardTitle>
          <CardDescription>Access your laboratory management system</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
              
              <div className="mt-6">
                <p className="text-sm text-muted-foreground mb-3">Sample Credentials:</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillSampleCredentials('admin')}
                  >
                    Admin
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillSampleCredentials('operator1')}
                  >
                    Operator 1
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillSampleCredentials('operator2')}
                  >
                    Operator 2
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fillSampleCredentials('operator3')}
                  >
                    Operator 3
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
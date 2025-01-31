import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { signInWithGoogle, completeSignInWithEmailLink } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth/auth-form";
import { EmailLinkAuth } from "@/components/auth/email-link-auth";
import { useState, useEffect } from "react";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [authMethod, setAuthMethod] = useState<'password' | 'passwordless'>('passwordless');

  useEffect(() => {
    const handleEmailLink = async () => {
      // Check if this is an email sign-in link
      const emailForSignIn = window.localStorage.getItem('emailForSignIn');
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode');

      if (emailForSignIn && mode === 'signIn') {
        try {
          const user = await completeSignInWithEmailLink(emailForSignIn);
          if (user) {
            toast({
              title: "Success",
              description: "You've successfully signed in!",
            });
            setLocation("/dashboard");
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    };

    handleEmailLink();
  }, [toast, setLocation]);

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      setLocation("/dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign in with Google",
        variant: "destructive",
      });
    }
  };

  const handleAuthSuccess = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[350px]">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-primary"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <CardTitle className="text-xl">FIT Compare Tool</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full relative h-10 px-4 flex items-center justify-center"
            onClick={handleGoogleSignIn}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex justify-center space-x-2 mb-4">
            <Button
              variant={authMethod === 'passwordless' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('passwordless')}
              size="sm"
            >
              Magic Link
            </Button>
            <Button
              variant={authMethod === 'password' ? 'default' : 'outline'}
              onClick={() => setAuthMethod('password')}
              size="sm"
            >
              Password
            </Button>
          </div>

          {authMethod === 'password' ? (
            <AuthForm onSuccess={handleAuthSuccess} />
          ) : (
            <EmailLinkAuth />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/lib/auth";
import { sendVerificationEmail, checkEmailVerification } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function EmailVerification() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    setSending(true);
    try {
      await sendVerificationEmail(auth.currentUser);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and follow the link to verify your email",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerification = async () => {
    if (!auth.currentUser) return;

    setChecking(true);
    try {
      const isVerified = await checkEmailVerification(auth.currentUser);
      if (isVerified) {
        setUser({
          ...user,
          emailVerified: true,
        });
        toast({
          title: "Email verified",
          description: "Your email has been successfully verified",
        });
      } else {
        toast({
          title: "Not verified",
          description: "Your email is not yet verified. Please check your inbox and verify your email",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>
            Please verify your email address to continue using the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We sent a verification email to{" "}
            <span className="font-medium text-foreground">{user?.email}</span>
          </p>
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={handleCheckVerification}
              disabled={checking}
            >
              {checking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Check Verification Status
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleResendVerification}
              disabled={sending}
            >
              {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resend Verification Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { EmailVerification } from "@/components/auth/email-verification";
import { auth } from "@/lib/firebase";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuthStore();
  const [verificationChecked, setVerificationChecked] = useState(false);

  useEffect(() => {
    // Check auth state and verification status
    const checkAuth = async () => {
      if (!loading && !user) {
        setLocation("/login");
        return;
      }

      if (user && auth.currentUser) {
        // Reload user to get fresh verification status
        await auth.currentUser.reload();
        setVerificationChecked(true);
      }
    };

    checkAuth();
  }, [user, loading, setLocation]);

  if (loading || !verificationChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Only show email verification for password-based users who haven't verified their email
  const isPasswordUser = auth.currentUser?.providerData.some(
    provider => provider.providerId === 'password'
  );

  if (isPasswordUser && !user.emailVerified) {
    return <EmailVerification />;
  }

  return <>{children}</>;
}
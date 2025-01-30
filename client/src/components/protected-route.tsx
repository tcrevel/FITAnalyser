import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/lib/auth";
import { EmailVerification } from "@/components/auth/email-verification";
import { auth } from "@/lib/firebase";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuthStore();

  useEffect(() => {
    if (!loading && !user) {
      setLocation("/login");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
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
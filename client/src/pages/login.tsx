import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signInWithGoogle } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { SiFirebase } from "react-icons/si";
import { useLocation } from "wouter";
import { AuthForm } from "@/components/auth/auth-form";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-blue-50">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <SiFirebase className="h-12 w-12 text-orange-500" />
          </div>
          <CardTitle>FIT Compare Tool</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthForm onSuccess={handleAuthSuccess} />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleGoogleSignIn}
          >
            <SiFirebase className="mr-2 h-4 w-4" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
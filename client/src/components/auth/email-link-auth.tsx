import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { sendSignInLink, completeSignInWithEmailLink } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export function EmailLinkAuth() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check if we have an email in localStorage
    const emailForSignIn = window.localStorage.getItem('emailForSignIn');

    if (emailForSignIn && window.location.href.includes('?mode=signIn')) {
      completeEmailSignIn(emailForSignIn);
    }
  }, []);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await sendSignInLink(email);
      toast({
        title: "Check your email",
        description: "We've sent you a sign-in link. Click the link to complete sign-in.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const completeEmailSignIn = async (emailForSignIn: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSendLink} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <Button className="w-full" type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Send Sign-in Link
      </Button>
    </form>
  );
}
import { auth } from "./firebase";
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  User,
  onAuthStateChanged
} from "firebase/auth";
import { create } from "zustand";
import { useToast } from "@/hooks/use-toast";

interface AuthStore {
  user: null | {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    emailVerified: boolean;
  };
  loading: boolean;
  setUser: (user: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ 
    user: user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
    } : null 
  }),
  setLoading: (loading) => set({ loading })
}));

// Initialize auth state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    // Always get fresh user data to ensure emailVerified is up to date
    user.reload().then(() => {
      useAuthStore.getState().setUser(auth.currentUser);
    });
  } else {
    useAuthStore.getState().setUser(null);
  }
  useAuthStore.getState().setLoading(false);
});

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google:", error);
    throw error;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in with email:", error);
    throw error;
  }
};

export const registerWithEmail = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(result.user);
    return result.user;
  } catch (error) {
    console.error("Error registering with email:", error);
    throw error;
  }
};

// Email Link (Passwordless) Authentication
export const sendSignInLink = async (email: string) => {
  const actionCodeSettings = {
    url: window.location.origin + '/login?mode=signIn',
    handleCodeInApp: true,
  };

  try {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
  } catch (error) {
    console.error("Error sending sign-in link:", error);
    throw error;
  }
};

export const completeSignInWithEmailLink = async (email: string) => {
  try {
    if (!isSignInWithEmailLink(auth, window.location.href)) {
      return null;
    }

    const result = await signInWithEmailLink(auth, email, window.location.href);
    window.localStorage.removeItem('emailForSignIn');
    return result.user;
  } catch (error) {
    console.error("Error completing sign-in with email link:", error);
    throw error;
  }
};

export const sendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw error;
  }
};

export const checkEmailVerification = async (user: User) => {
  try {
    await user.reload();
    const currentUser = auth.currentUser;
    if (currentUser && currentUser.emailVerified) {
      // Update the auth store with the fresh user data
      useAuthStore.getState().setUser(currentUser);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking email verification:", error);
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};
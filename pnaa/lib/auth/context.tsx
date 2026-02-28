"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import type { AppUser } from "@/types/user";

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: (AppUser & { uid: string }) | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  firebaseUser: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<(AppUser & { uid: string }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", fbUser.uid));
          if (userDoc.exists()) {
            setUser({ ...userDoc.data() as AppUser, uid: fbUser.uid });
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }

      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = () => {
    window.location.href = "/api/auth/signin";
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    await fetch("/api/auth/signout", { method: "POST" });
    setUser(null);
    window.location.href = "/signin";
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

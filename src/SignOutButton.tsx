"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

export function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      className="px-6 py-2 bg-gradient-primary text-white font-semibold transition-all text-sm rounded-full hover:shadow-glow transform hover:scale-105"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}

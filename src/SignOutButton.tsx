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
      className="px-6 py-2 rounded-lg glass border border-white/20 text-gray-300 font-semibold hover:bg-white/10 hover:text-white hover:border-white/30 transition-all"
      onClick={() => void signOut()}
    >
      Sign out
    </button>
  );
}

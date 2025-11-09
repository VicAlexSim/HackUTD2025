"use client";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignInForm() {
  const { signIn } = useAuthActions();

  return (
    <div className="w-full flex flex-col gap-4">
      <button 
        className="auth-button bg-[#EB5424] hover:bg-[#D14820] text-white font-semibold py-3 px-6 rounded-lg transition-colors" 
        onClick={() => void signIn("auth0")}
      >
        Continue with Auth0
      </button>
      
      <div className="text-center">
        <button 
          className="text-sm text-gray-600 hover:text-gray-800 hover:underline font-medium cursor-pointer transition-colors"
          onClick={() => void signIn("anonymous")}
        >
          Try Instead
        </button>
      </div>
    </div>
  );
}

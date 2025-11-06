"use client";

import { SignUp } from "@clerk/nextjs";

export default function FreeSignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur">
        <div className="mb-6 space-y-2 text-center text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">Community plan</p>
          <h1 className="text-2xl font-semibold">Create your Life-AI account</h1>
          <p className="text-sm text-white/70">
            Join the network, build your profile, and access Synthesis AI chat with academic research mode.
          </p>
        </div>
        <SignUp
          path="/sign-up/free"
          routing="path"
          appearance={{
            elements: {
              card: "bg-transparent shadow-none",
              headerTitle: "text-white",
              headerSubtitle: "text-white/70",
              socialButtonsBlockButton: "bg-white text-slate-800 hover:bg-white/90",
              formButtonPrimary: "bg-emerald-500 hover:bg-emerald-400 text-white",
              formFieldInput: "bg-white/10 border-white/20 text-white placeholder:text-white/50",
              footerActionText: "text-white/70",
              footerActionLink: "text-emerald-200 hover:text-emerald-100",
            },
          }}
          signInUrl="/sign-in"
          afterSignUpUrl="/onboarding/free"
          redirectUrl="/onboarding/free"
        />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

export default function OUGMResourcesLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}

import { Suspense, type ReactNode } from "react";

import { WorkspaceShell } from "@/components/workspace-shell";

function ShellFallback({ children }: { children: ReactNode }) {
  return <div className="shell-fallback">{children}</div>;
}

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<ShellFallback>{children}</ShellFallback>}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </Suspense>
  );
}

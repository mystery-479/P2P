import type { ReactNode } from "react";

/** The prototype uses demo rules — no AI service, no training data. */
export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <aside className="demo-notice" role="note">
      <span className="demo-notice__tag">Demo triage</span>
      <span>
        {children ??
          "We're using simple demo rules here, not live AI — so an officer always double-checks every recommendation before acting on it."}
      </span>
    </aside>
  );
}

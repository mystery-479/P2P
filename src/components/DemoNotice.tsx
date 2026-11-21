import type { ReactNode } from "react";

/** Honest labelling: the prototype uses rules, not a live AI service. */
export function DemoNotice({ children }: { children?: ReactNode }) {
  return (
    <aside className="demo-notice" role="note">
      <span className="demo-notice__tag">Demo triage</span>
      <span>
        {children ??
          "We're using demo rules here, not a live AI — so an officer always double-checks every recommendation before acting on it."}
      </span>
    </aside>
  );
}

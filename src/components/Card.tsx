import type { HTMLAttributes, ReactNode } from "react";

type CardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function Card({ className = "", children, ...rest }: CardProps) {
  return (
    <section className={`card ${className}`.trim()} {...rest}>
      {children}
    </section>
  );
}

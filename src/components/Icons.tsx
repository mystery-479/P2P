/**
 * Hand-drawn style icons. Deliberately not perfectly geometric: the little
 * wobbles keep the interface feeling drawn by a person rather than generated.
 */

type IconProps = {
  size?: number;
  className?: string;
};

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function AlertIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={1.9}
      {...base}
    >
      <path d="M12 4.4c.4-.7 1.4-.7 1.8.1l7.3 13.2c.4.8-.2 1.7-1 1.7H4.6c-.9 0-1.4-.9-1-1.7Z" />
      <path d="M12.1 9.4c0 1.6-.2 3.5-.2 4.4" />
      <path d="M12 17.2h.01" strokeWidth={2.4} />
    </svg>
  );
}

export function CheckIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={2.1}
      {...base}
    >
      <path d="M4.8 12.6c1.5 1.4 3 3 4.4 4.5 2.6-4 5.6-7.7 9.6-11" />
    </svg>
  );
}

export function EyeIcon({ size = 16, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      {...base}
    >
      <path d="M2.9 12.1c2.4-3.7 5.4-5.6 9.1-5.6s6.7 1.9 9.1 5.5c-2.4 3.6-5.4 5.5-9.1 5.5s-6.7-1.8-9.1-5.4Z" />
      <path d="M12 9.3c1.6 0 2.9 1.2 2.9 2.8 0 1.5-1.3 2.8-2.9 2.8-1.6 0-2.9-1.3-2.9-2.8 0-1.6 1.3-2.8 2.9-2.8Z" />
    </svg>
  );
}

export function SearchIcon({ size = 18, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={1.9}
      {...base}
    >
      <path d="M10.7 4.6a6.1 6.1 0 0 1 .2 12.2 6.1 6.1 0 0 1-.2-12.2Z" />
      <path d="m15.4 15.6 4.2 4" />
    </svg>
  );
}

export function PlusIcon({ size = 22, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={2}
      {...base}
    >
      <path d="M12 5.6v12.6" />
      <path d="M5.7 12.1h12.6" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 15, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={2}
      {...base}
    >
      <path d="M19 12H5.4" />
      <path d="m10.6 6.4-5.2 5.6 5.2 5.6" />
    </svg>
  );
}

export function PinIcon({ size = 15, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      {...base}
    >
      <path d="M18.2 10.3c0 4.4-4.3 8.2-5.8 9.5-.2.2-.6.2-.8 0-1.5-1.3-5.8-5.1-5.8-9.5a6.2 6.2 0 0 1 12.4 0Z" />
      <path d="M12 7.6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
    </svg>
  );
}

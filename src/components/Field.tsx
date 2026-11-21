import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
};

export function Field({ id, label, hint, error, optional = false, children }: FieldProps) {
  const describedBy = [hint ? `${id}-hint` : "", error ? `${id}-error` : ""]
    .filter(Boolean)
    .join(" ");

  const control = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <div className="field__label-row">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        {optional && <span className="field__optional">Optional</span>}
      </div>
      {hint && (
        <p className="field__hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {control}
      {error && (
        <p className="field__error" id={`${id}-error`} role="alert">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}

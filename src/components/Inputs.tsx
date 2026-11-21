import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean };
type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean };
type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean };

export function TextInput({ invalid, className = "", ...rest }: InputProps) {
  return (
    <input
      className={`input ${invalid ? "input--invalid" : ""} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function TextArea({ invalid, className = "", ...rest }: TextAreaProps) {
  return (
    <textarea
      className={`input textarea ${invalid ? "input--invalid" : ""} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
}

export function Select({ invalid, className = "", ...rest }: SelectProps) {
  return (
    <select
      className={`input select ${invalid ? "input--invalid" : ""} ${className}`.trim()}
      aria-invalid={invalid || undefined}
      {...rest}
    >
      {rest.children}
    </select>
  );
}

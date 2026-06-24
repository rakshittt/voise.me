"use client";

import type { InputHTMLAttributes } from "react";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "style"> {
  label?: string;
  helperMessage?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isCompact?: boolean;
  elemBeforeInput?: React.ReactNode;
  elemAfterInput?: React.ReactNode;
  testId?: string;
}

export function TextField({
  label,
  helperMessage,
  errorMessage,
  isInvalid,
  isRequired,
  isDisabled,
  isCompact,
  elemBeforeInput,
  elemAfterInput,
  testId,
  id,
  ...rest
}: TextFieldProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--ds-space-050)" }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: "var(--ds-font-size-075)",
            fontWeight: "var(--ds-font-weight-semibold)",
            color: "var(--ds-text-subtle)",
            lineHeight: "var(--ds-line-height-100)",
          }}
        >
          {label}
          {isRequired && (
            <span aria-hidden="true" style={{ color: "var(--ds-text-danger)", marginLeft: 2 }}>*</span>
          )}
        </label>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--ds-space-050)",
          padding: isCompact
            ? "var(--ds-space-050) var(--ds-space-075)"
            : "var(--ds-space-075) var(--ds-space-100)",
          border: `2px solid ${isInvalid ? "var(--ds-border-danger)" : "var(--ds-border-input)"}`,
          borderRadius: "var(--ds-radius-100)",
          backgroundColor: isDisabled ? "var(--ds-background-neutral)" : "var(--ds-background-input)",
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          if (!isInvalid) (e.currentTarget as HTMLElement).style.borderColor = "var(--ds-border-focused)";
        }}
        onBlur={(e) => {
          if (!isInvalid) (e.currentTarget as HTMLElement).style.borderColor = "var(--ds-border-input)";
        }}
      >
        {elemBeforeInput && (
          <span style={{ color: "var(--ds-icon-subtle)", flexShrink: 0 }}>{elemBeforeInput}</span>
        )}
        <input
          {...rest}
          id={inputId}
          disabled={isDisabled}
          required={isRequired}
          data-testid={testId}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            color: isDisabled ? "var(--ds-text-disabled)" : "var(--ds-text)",
            fontSize: "var(--ds-font-size-100)",
            lineHeight: "var(--ds-line-height-300)",
            fontFamily: "var(--ds-font-family-sans)",
            cursor: isDisabled ? "not-allowed" : "text",
          }}
        />
        {elemAfterInput && (
          <span style={{ color: "var(--ds-icon-subtle)", flexShrink: 0 }}>{elemAfterInput}</span>
        )}
      </div>

      {(helperMessage || errorMessage) && (
        <p
          style={{
            fontSize: "var(--ds-font-size-075)",
            color: isInvalid ? "var(--ds-text-danger)" : "var(--ds-text-subtle)",
            lineHeight: "var(--ds-line-height-100)",
            margin: 0,
          }}
        >
          {isInvalid && errorMessage ? errorMessage : helperMessage}
        </p>
      )}
    </div>
  );
}

export default TextField;

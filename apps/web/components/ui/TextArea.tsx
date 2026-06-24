"use client";

import type { TextareaHTMLAttributes } from "react";
import { forwardRef, useRef, useImperativeHandle, useEffect } from "react";

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className" | "style"> {
  label?: string;
  helperMessage?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  isDisabled?: boolean;
  isCompact?: boolean;
  minimumRows?: number;
  resize?: "vertical" | "horizontal" | "none" | "smart";
  testId?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  {
    label,
    helperMessage,
    errorMessage,
    isInvalid,
    isRequired,
    isDisabled,
    isCompact,
    minimumRows = 3,
    resize = "smart",
    testId,
    id,
    value,
    onChange,
    ...rest
  },
  ref
) {
  const internalRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => internalRef.current!);

  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  useEffect(() => {
    if (resize === "smart" && internalRef.current) {
      const el = internalRef.current;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value, resize]);

  const resizeStyle: "none" | "vertical" | "horizontal" = resize === "smart" || resize === "none" || !resize ? "none" : resize;

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
            display: "block",
          }}
        >
          {label}
          {isRequired && (
            <span aria-hidden="true" style={{ color: "var(--ds-text-danger)", marginLeft: 2 }}>*</span>
          )}
        </label>
      )}

      <textarea
        {...rest}
        ref={internalRef}
        id={inputId}
        value={value}
        onChange={onChange}
        disabled={isDisabled}
        required={isRequired}
        data-testid={testId}
        rows={minimumRows}
        style={{
          padding: isCompact
            ? "var(--ds-space-050) var(--ds-space-075)"
            : "var(--ds-space-100) var(--ds-space-150)",
          border: `2px solid ${isInvalid ? "var(--ds-border-danger)" : "var(--ds-border-input)"}`,
          borderRadius: "var(--ds-radius-100)",
          backgroundColor: isDisabled ? "var(--ds-background-neutral)" : "var(--ds-background-input)",
          color: isDisabled ? "var(--ds-text-disabled)" : "var(--ds-text)",
          fontSize: "var(--ds-font-size-100)",
          lineHeight: "var(--ds-line-height-300)",
          fontFamily: "var(--ds-font-family-sans)",
          resize: resizeStyle,
          outline: "none",
          width: "100%",
          transition: "border-color 0.2s",
          cursor: isDisabled ? "not-allowed" : "text",
        }}
        onFocus={(e) => {
          if (!isInvalid) e.currentTarget.style.borderColor = "var(--ds-border-focused)";
        }}
        onBlur={(e) => {
          if (!isInvalid) e.currentTarget.style.borderColor = "var(--ds-border-input)";
        }}
      />

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
});

export default TextArea;

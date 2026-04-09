import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

function Label({ text, required = false, className, children, ...props }) {
  const labelText = text ?? children;
  const hasColon =
    typeof labelText === "string" && labelText.trim().endsWith(":");

  const finalText =
    hasColon && typeof labelText === "string"
      ? labelText.trim().slice(0, -1)
      : labelText;

  return (
    <LabelPrimitive.Root
      className={cn(
        "flex items-center w-28 text-sm font-medium text-gray-800 gap-1",
        className
      )}
      {...props}
    >
      <span>{finalText}</span>
      {required && <span className="text-red-500 font-semibold">*</span>}
      {hasColon && <span>:</span>}
    </LabelPrimitive.Root>
  );
}

export { Label };

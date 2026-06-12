import { cn } from "@/lib/utils";

function Input({ className, type = "text", ...props }) {
  /* ---------- RADIO / CHECKBOX ---------- */
  if (type === "radio" || type === "checkbox") {
    return (
      <input
        type={type}
        data-slot="input"
        className={cn(
          "h-4 w-4 cursor-pointer   accent-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          type === "radio" && "rounded-full",
          className
        )}
        {...props}
      />
    );
  }

  /* ---------- DEFAULT TEXT INPUT ---------- */
  return (
        <input
      type={type}
      data-slot="input"
  //     min="0"
  // step="1"
  onKeyDown={(e) => {
    if (type === "number" && ["-", "e", "+", "*","/"] .includes(e.key)) {
      e.preventDefault();
    }
    else if( ["#", "*", "$","^", "*","!","+"] .includes(e.key)) {
      e.preventDefault();
    }
  }}
  onWheel={type === "number" ? (e) => e.currentTarget.blur() : undefined}
    
      className={cn(
        "file:text-foreground  disabled:text-slate-900  disabled:border disabled:border-gray-400 placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border border-gray-400  bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        // "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props} />
  );
}

export { Input };
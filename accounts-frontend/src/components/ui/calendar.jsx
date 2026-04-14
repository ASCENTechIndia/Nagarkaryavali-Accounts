import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { format } from "date-fns";
import { CalendarCheckIcon } from "@/components/ui/calendar-check";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex gap-4 flex-col md:flex-row relative", defaultClassNames.months),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) aria-disabled:opacity-50 p-0 select-none",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-(--cell-size) w-full px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "w-full flex items-center text-sm font-medium justify-center h-(--cell-size) gap-1.5",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative has-focus:border-ring border border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] rounded-md",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("absolute bg-popover inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn("select-none font-medium", captionLayout === "label"
          ? "text-sm"
          : "rounded-md pl-2 pr-1 flex items-center gap-1 text-sm h-8 [&>svg]:text-muted-foreground [&>svg]:size-3.5", defaultClassNames.caption_label),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md flex-1 font-normal text-[0.8rem] select-none",
          defaultClassNames.weekday
        ),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        week_number_header: cn("select-none w-(--cell-size)", defaultClassNames.week_number_header),
        week_number: cn(
          "text-[0.8rem] select-none text-muted-foreground",
          defaultClassNames.week_number
        ),
        day: cn(
          "relative w-full h-full p-0 text-center [&:last-child[data-selected=true]_button]:rounded-r-md group/day aspect-square select-none",
          props.showWeekNumber
            ? "[&:nth-child(2)[data-selected=true]_button]:rounded-l-md"
            : "[&:first-child[data-selected=true]_button]:rounded-l-md",
          defaultClassNames.day
        ),
        range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (<div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />);
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (<ChevronLeftIcon className={cn("size-4", className)} {...props} />);
          }

          if (orientation === "right") {
            return (<ChevronRightIcon className={cn("size-4", className)} {...props} />);
          }

          return (<ChevronDownIcon className={cn("size-4", className)} {...props} />);
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div
                className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props} />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props} />
  );
}



function DatePicker({
  value,
  onChange,
  disabled = false,
  className,
}) {
  const [open, setOpen] = React.useState(false);
  const [digits, setDigits] = React.useState("");

  React.useEffect(() => {
    if (value instanceof Date && !isNaN(value)) {
      const d = String(value.getDate()).padStart(2, "0");
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const y = value.getFullYear();
      setDigits(`${d}${m}${y}`);
    }
  }, [value]);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month, 0).getDate(); // month: 1–12
  };

  const formatMaskedDate = (digits) => {
    const d = digits.slice(0, 2);
    const m = digits.slice(2, 4);
    const y = digits.slice(4, 8);
    let out = d;
    if (digits.length > 2) out += "-" + m;
    if (digits.length > 4) out += "-" + y;
    return out;
  };

  const parseMaskedDate = (digits) => {
    if (digits.length !== 8) return null;

    const dd = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    const yyyy = Number(digits.slice(4, 8));

    // Month validation
    if (mm < 1 || mm > 12) return null;

    // Day validation based on month + leap year
    const maxDay = getDaysInMonth(mm, yyyy);
    if (dd < 1 || dd > maxDay) return null;

    const date = new Date(yyyy, mm - 1, dd);

    return isNaN(date) ? null : date;
  };


  return (
    <Popover open={disabled ? false : open}
  onOpenChange={(val) => {
    if (!disabled) setOpen(val);
  }}>
      <PopoverTrigger asChild disabled={disabled}>
        {/* ✅ RELATIVE wrapper fixes icon position */}
        <div className="relative w-full">
          <input
            type="text"
            inputMode="numeric"
            value={formatMaskedDate(digits)}
            placeholder="DD-MM-YYYY"
            disabled={disabled}
            maxLength={10}
            onClick={() => !disabled && setOpen(true)} // ✅ open on mouse
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setOpen(true);
              }
            }}
            // onChange={(e) => {
            //   const onlyDigits = e.target.value.replace(/\D/g, "");
            //   if (onlyDigits.length > 8) return;

            //   setDigits(onlyDigits);

            //   const parsed = parseMaskedDate(onlyDigits);
            //   if (parsed) {
            //     onChange?.(parsed);
            //   }
            // }}
            onChange={(e) => {
              let raw = e.target.value.replace(/\D/g, "");
              if (raw.length > 8) return;

              // --- AUTO PAD DAY ---
              if (raw.length === 1) {
                const d = Number(raw);
                if (d > 3) raw = `0${raw}`; // 4 → 04
              }

              // --- AUTO PAD MONTH ---
              if (raw.length === 3) {
                const m = Number(raw.slice(2, 3));
                if (m > 1) raw = `${raw.slice(0, 2)}0${m}`; // 4-9 → 04-09
              }

              const dd = Number(raw.slice(0, 2));
              const mm = Number(raw.slice(2, 4));
              const yyyy = Number(raw.slice(4, 8));

              // --- HARD VALIDATION ---
              if (raw.length >= 2 && dd > 31) return;
              if (raw.length >= 4 && mm > 12) return;

              if (raw.length === 8) {
                const maxDay = new Date(yyyy, mm, 0).getDate();
                if (dd > maxDay) return;
              }

              setDigits(raw);

              if (raw.length === 8) {
                const parsed = new Date(yyyy, mm - 1, dd);
                if (!isNaN(parsed)) {
                  onChange?.(parsed);
                }
              }
            }}

            className={cn(
              "h-9 w-full rounded-md border border-slate-400 bg-white px-3 pr-10 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring border border-gray-400",
              disabled && "bg-gray-200 cursor-not-allowed",
              className
            )}
          />

          {/* ✅ ICON stays INSIDE field */}
          <CalendarCheckIcon
            className="absolute right-5 top-3 -translate-y-1/2 h-2 w-4 text-muted-foreground cursor-pointer"
            onClick={() => !disabled && setOpen(true)}
            size={20}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()} // ✅ keep input focus
      >
        <Calendar
          mode="single"
          selected={value instanceof Date ? value : undefined}
          onSelect={(date) => {
            if (!date) return;
            onChange?.(date);
            setOpen(false);
          }}
          captionLayout="dropdown"
          fromYear={1900}
          toYear={new Date().getFullYear() + 10}
        />
      </PopoverContent>
    </Popover>
  );
}



export { Calendar, CalendarDayButton, DatePicker }

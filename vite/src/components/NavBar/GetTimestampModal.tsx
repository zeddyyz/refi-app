import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useCopyToClipboard } from "react-use";

interface IGetTimestampModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Meridiem = "AM" | "PM";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

const daysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

const clampNumber = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const to24Hour = (hour12: number, meridiem: Meridiem) => {
  const h = hour12 % 12;
  return meridiem === "PM" ? h + 12 : h;
};

const from24Hour = (hour24: number): { hour12: number; meridiem: Meridiem } => {
  const meridiem: Meridiem = hour24 >= 12 ? "PM" : "AM";
  const h = hour24 % 12;
  return { hour12: h === 0 ? 12 : h, meridiem };
};

const buildCalendarGrid = (year: number, month: number) => {
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const prevMonthDays = daysInMonth(
    month === 0 ? year - 1 : year,
    month === 0 ? 11 : month - 1
  );

  const cells: Array<{
    day: number;
    inCurrentMonth: boolean;
    year: number;
    month: number;
  }> = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const pmMonth = month === 0 ? 11 : month - 1;
    const pmYear = month === 0 ? year - 1 : year;
    cells.push({ day: d, inCurrentMonth: false, year: pmYear, month: pmMonth });
  }

  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, inCurrentMonth: true, year, month });
  }

  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1];
    const next = new Date(last.year, last.month, last.day);
    next.setDate(next.getDate() + 1);
    cells.push({
      day: next.getDate(),
      inCurrentMonth: next.getFullYear() === year && next.getMonth() === month,
      year: next.getFullYear(),
      month: next.getMonth(),
    });
    if (cells.length >= 42) break;
  }

  return cells;
};

const getTimezoneLabel = () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offsetMinutes = -new Date().getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? "+" : "-";
    const abs = Math.abs(offsetMinutes);
    const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
    return tz ? `${tz} (UTC${offset})` : `UTC${offset}`;
  } catch {
    return "Local time";
  }
};

interface NumberFieldProps {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  width: number;
  ariaLabel: string;
  padLen?: number;
  wrap?: boolean;
}

const NumberField = ({
  value,
  onChange,
  min,
  max,
  width,
  ariaLabel,
  padLen,
  wrap,
}: NumberFieldProps) => {
  const digits = padLen ?? String(max).length;
  const [text, setText] = useState(pad(value, digits));

  useEffect(() => {
    setText(pad(value, digits));
  }, [value, digits]);

  const normalize = (n: number): number => {
    if (wrap) {
      if (n < min) return max;
      if (n > max) return min;
      return n;
    }
    return clampNumber(n, min, max);
  };

  const commit = (raw: string) => {
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (cleaned === "") {
      setText(pad(value, digits));
      return;
    }
    const parsed = parseInt(cleaned, 10);
    if (Number.isNaN(parsed)) {
      setText(pad(value, digits));
      return;
    }
    const next = normalize(parsed);
    onChange(next);
    setText(pad(next, digits));
  };

  return (
    <input
      aria-label={ariaLabel}
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          onChange(normalize(value + 1));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          onChange(normalize(value - 1));
        }
      }}
      className="bg-transparent text-center tabular-nums text-foreground focus:outline-none focus:ring-0 border-0 p-0"
      style={{ width }}
    />
  );
};

const GetTimestampModal = ({
  open,
  onOpenChange,
}: IGetTimestampModalProps): JSX.Element => {
  const [, copyToClipboard] = useCopyToClipboard();
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [day, setDay] = useState(() => new Date().getDate());
  const [hour12, setHour12] = useState(
    () => from24Hour(new Date().getHours()).hour12
  );
  const [minute, setMinute] = useState(() => new Date().getMinutes());
  const [meridiem, setMeridiem] = useState<Meridiem>(
    () => from24Hour(new Date().getHours()).meridiem
  );

  useEffect(() => {
    if (!open) return;
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setDay(now.getDate());
    const { hour12: h12, meridiem: mer } = from24Hour(now.getHours());
    setHour12(h12);
    setMinute(now.getMinutes());
    setMeridiem(mer);
    setCopied(false);
  }, [open]);

  const cells = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const timestampString = useMemo(() => {
    const hour24 = to24Hour(hour12, meridiem);
    const local = new Date(year, month, day, hour24, minute, 0, 0);
    const iso = local.toISOString();
    return `__Timestamp__${iso}`;
  }, [year, month, day, hour12, minute, meridiem]);

  const tzLabel = useMemo(() => getTimezoneLabel(), []);

  const goPrevMonth = () => {
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? 11 : month - 1;
    setYear(newYear);
    setMonth(newMonth);
    setDay((d) => clampNumber(d, 1, daysInMonth(newYear, newMonth)));
  };

  const goNextMonth = () => {
    const newYear = month === 11 ? year + 1 : year;
    const newMonth = month === 11 ? 0 : month + 1;
    setYear(newYear);
    setMonth(newMonth);
    setDay((d) => clampNumber(d, 1, daysInMonth(newYear, newMonth)));
  };

  const handlePickDay = (cell: {
    day: number;
    year: number;
    month: number;
  }) => {
    setYear(cell.year);
    setMonth(cell.month);
    const max = daysInMonth(cell.year, cell.month);
    setDay(clampNumber(cell.day, 1, max));
  };

  const setToNow = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setDay(now.getDate());
    const { hour12: h12, meridiem: mer } = from24Hour(now.getHours());
    setHour12(h12);
    setMinute(now.getMinutes());
    setMeridiem(mer);
  };

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = () => {
    copyToClipboard(timestampString);
    setCopied(true);
    if (copyTimerRef.current !== null) {
      window.clearTimeout(copyTimerRef.current);
    }
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus:ring-0">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="text-base">Get Timestamp</DialogTitle>
          <p className="text-xs text-muted-foreground truncate">{tzLabel}</p>
        </DialogHeader>

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between pb-2">
            <button
              type="button"
              onClick={goPrevMonth}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-sm font-medium text-foreground tabular-nums">
              {MONTH_NAMES[month]} {year}
            </div>
            <button
              type="button"
              onClick={goNextMonth}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent focus:outline-none"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {WEEKDAYS.map((d, i) => (
              <div
                key={`wd-${i}`}
                className="text-[10px] font-medium text-muted-foreground text-center pb-1 uppercase tracking-wide"
              >
                {d}
              </div>
            ))}
            {cells.map((cell, i) => {
              const isSelected =
                cell.inCurrentMonth &&
                cell.day === day &&
                cell.month === month &&
                cell.year === year;
              return (
                <button
                  key={`c-${i}`}
                  type="button"
                  onClick={() => handlePickDay(cell)}
                  className={cn(
                    "h-8 w-full text-xs rounded-md tabular-nums transition-colors focus:outline-none",
                    isSelected
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : cell.inCurrentMonth
                      ? "text-foreground hover:bg-accent"
                      : "text-muted-foreground/50 hover:bg-accent/60"
                  )}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 rounded-md bg-muted px-3 py-1.5 text-sm">
              <NumberField
                ariaLabel="Hours"
                value={hour12}
                onChange={setHour12}
                min={1}
                max={12}
                width={22}
                padLen={2}
                wrap
              />
              <span className="text-muted-foreground">:</span>
              <NumberField
                ariaLabel="Minutes"
                value={minute}
                onChange={setMinute}
                min={0}
                max={59}
                width={22}
                padLen={2}
                wrap
              />
            </div>

            <div
              className="inline-flex rounded-md bg-muted p-0.5 text-xs"
              role="group"
              aria-label="AM or PM"
            >
              <button
                type="button"
                onClick={() => setMeridiem("AM")}
                className={cn(
                  "px-3 py-1 rounded-[5px] font-medium transition-colors focus:outline-none",
                  meridiem === "AM"
                    ? "bg-background text-foreground shadow-sm rounded-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setMeridiem("PM")}
                className={cn(
                  "px-3 py-1 rounded-[5px] font-medium transition-colors focus:outline-none",
                  meridiem === "PM"
                    ? "bg-background text-foreground shadow-sm rounded-md"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                PM
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={setToNow}
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
            >
              Now
            </Button>
          </div>
        </div>

        <div className="border-t border-border bg-muted/40 px-5 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
            Timestamp string (UTC)
          </p>
          <button
            type="button"
            onClick={handleCopy}
            title="Click to copy to clipboard"
            className={cn(
              "group w-full flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
            )}
          >
            <code className="text-xs font-mono text-foreground truncate tabular-nums">
              {timestampString}
            </code>
            <span
              className={cn(
                "shrink-0 inline-flex items-center gap-1 text-[11px] pl-1",
                copied ? "text-primary" : "text-muted-foreground"
              )}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copy
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy
                </>
              )}
            </span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GetTimestampModal;

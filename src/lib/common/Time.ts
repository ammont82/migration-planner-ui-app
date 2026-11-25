export const ONE_MILLISECOND = 1;
export const ONE_SECOND_IN_MILLISECOND = 1000 * ONE_MILLISECOND;
export const ONE_MINUTE_IN_MILLISECOND = 60 * ONE_SECOND_IN_MILLISECOND;
export const ONE_HOUR_IN_MILLISECOND = 60 * ONE_MINUTE_IN_MILLISECOND;
export const ONE_DAY_IN_MILLISECOND = 24 * ONE_HOUR_IN_MILLISECOND;
export const ONE_WEEK_IN_MILLISECOND = 7 * ONE_DAY_IN_MILLISECOND;
export const AVERAGE_DAYS_PER_MONTH = 30.44;
export const AVERAGE_DAYS_PER_YEAR = 365.25;

export const Time = {
  Millisecond: ONE_MILLISECOND,
  Second: ONE_SECOND_IN_MILLISECOND,
  Minute: ONE_MINUTE_IN_MILLISECOND,
  Hour: ONE_HOUR_IN_MILLISECOND,
  Day: ONE_DAY_IN_MILLISECOND,
  Week: ONE_WEEK_IN_MILLISECOND,
  Month: Math.floor(AVERAGE_DAYS_PER_MONTH * ONE_DAY_IN_MILLISECOND),
  Year: Math.floor(AVERAGE_DAYS_PER_YEAR * ONE_DAY_IN_MILLISECOND),
} as const;
export type Time = (typeof Time)[keyof typeof Time];

export const sleep = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const TIME_UNITS: Array<[string, number]> = [
  ["year", Time.Year],
  ["month", Time.Month],
  ["week", Time.Week],
  ["day", Time.Day],
  ["hour", Time.Hour],
  ["minute", Time.Minute],
  ["second", Time.Second],
];

export function humanizeDate(when: Date): string {
  const diff = new Date().getTime() - when.getTime();
  for (const [unit, milliseconds] of TIME_UNITS) {
    const quotient = Math.floor(diff / milliseconds);
    if (quotient > 0) {
      return `${quotient} ${unit}${quotient > 1 ? "s" : ""} ago`;
    }
  }
  return "just now";
}

/** Long-form timestamp for assessment tables and report headers. */
export function formatAssessmentDateTime(
  when?: string | number | Date,
): string {
  if (when == null || when === "") {
    return "-";
  }
  const date = new Date(when);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
}

export function formatRelativeTime(updatedAt?: string | number | Date): string {
  if (!updatedAt) return "-";
  const date = new Date(updatedAt);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();

  // API timestamps are historical; "in N minutes" usually means clock skew or TZ parse drift.
  if (diffMs > 0) {
    return formatAssessmentDateTime(date);
  }

  const absMs = Math.abs(diffMs);

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  let unit: Intl.RelativeTimeFormatUnit = "second";
  let value = 0;

  if (absMs < minute) {
    unit = "second";
    value = Math.round(diffMs / 1000);
  } else if (absMs < hour) {
    unit = "minute";
    value = Math.round(diffMs / minute);
  } else if (absMs < day) {
    unit = "hour";
    value = Math.round(diffMs / hour);
  } else if (absMs < week) {
    unit = "day";
    value = Math.round(diffMs / day);
  } else if (absMs < month) {
    unit = "week";
    value = Math.round(diffMs / week);
  } else if (absMs < year) {
    unit = "month";
    value = Math.round(diffMs / month);
  } else {
    unit = "year";
    value = Math.round(diffMs / year);
  }

  return new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    value,
    unit,
  );
}

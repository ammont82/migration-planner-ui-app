import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AVERAGE_DAYS_PER_MONTH,
  AVERAGE_DAYS_PER_YEAR,
  formatAssessmentDateTime,
  formatRelativeTime,
  humanizeDate,
  sleep,
  Time,
} from "../Time";

// ---------------------------------------------------------------------------
// Tests — Time constants
// ---------------------------------------------------------------------------

describe("Time constants", () => {
  it("Millisecond equals 1", () => {
    expect(Time.Millisecond).toBe(1);
  });

  it("Second equals 1000", () => {
    expect(Time.Second).toBe(1000);
  });

  it("Minute equals 60 × 1000", () => {
    expect(Time.Minute).toBe(60_000);
  });

  it("Hour equals 60 × 60 × 1000", () => {
    expect(Time.Hour).toBe(3_600_000);
  });

  it("Day equals 24 × 60 × 60 × 1000", () => {
    expect(Time.Day).toBe(86_400_000);
  });

  it("Week equals 7 × 24 × 60 × 60 × 1000", () => {
    expect(Time.Week).toBe(604_800_000);
  });

  it("Month equals floor(DAYS_PER_MONTH × 24 × 60 × 60 × 1000)", () => {
    expect(Time.Month).toBe(
      Math.floor(AVERAGE_DAYS_PER_MONTH * 24 * 60 * 60 * 1000),
    );
  });

  it("Year equals floor(DAYS_PER_YEAR × 24 × 60 × 60 × 1000)", () => {
    expect(Time.Year).toBe(
      Math.floor(AVERAGE_DAYS_PER_YEAR * 24 * 60 * 60 * 1000),
    );
  });

  it("constants are consistent with each other", () => {
    expect(Time.Second).toBe(1000 * Time.Millisecond);
    expect(Time.Minute).toBe(60 * Time.Second);
    expect(Time.Hour).toBe(60 * Time.Minute);
    expect(Time.Day).toBe(24 * Time.Hour);
    expect(Time.Week).toBe(7 * Time.Day);
    expect(Time.Month).toBe(Math.floor(AVERAGE_DAYS_PER_MONTH * Time.Day));
    expect(Time.Year).toBe(Math.floor(AVERAGE_DAYS_PER_YEAR * Time.Day));
  });
});

// ---------------------------------------------------------------------------
// Tests — sleep
// ---------------------------------------------------------------------------

describe("sleep", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a promise", () => {
    const result = sleep(100);
    expect(result).toBeInstanceOf(Promise);
    vi.advanceTimersByTime(100);
  });

  it("resolves after the specified delay", async () => {
    let resolved = false;
    const p = sleep(500).then(() => {
      resolved = true;
    });

    expect(resolved).toBe(false);
    vi.advanceTimersByTime(499);
    await Promise.resolve(); // flush microtasks
    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1);
    await p;
    expect(resolved).toBe(true);
  });

  it("resolves with undefined", async () => {
    const p = sleep(10);
    vi.advanceTimersByTime(10);
    await expect(p).resolves.toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Tests — humanizeDate
// ---------------------------------------------------------------------------

describe("humanizeDate", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("with Date input", () => {
    it("returns 'just now' for recent timestamps", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const almostNow = new Date(now.getTime() - 500);
      expect(humanizeDate(almostNow)).toBe("just now");
    });

    it("returns '1 second ago' for 1 second", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneSecondAgo = new Date(now.getTime() - Time.Second);
      expect(humanizeDate(oneSecondAgo)).toBe("1 second ago");
    });

    it("returns '5 seconds ago' for 5 seconds (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const fiveSecondsAgo = new Date(now.getTime() - 5 * Time.Second);
      expect(humanizeDate(fiveSecondsAgo)).toBe("5 seconds ago");
    });

    it("returns '1 minute ago' for 1 minute", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneMinuteAgo = new Date(now.getTime() - Time.Minute);
      expect(humanizeDate(oneMinuteAgo)).toBe("1 minute ago");
    });

    it("returns '15 minutes ago' for 15 minutes (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const fifteenMinutesAgo = new Date(now.getTime() - 15 * Time.Minute);
      expect(humanizeDate(fifteenMinutesAgo)).toBe("15 minutes ago");
    });

    it("returns '1 hour ago' for 1 hour", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneHourAgo = new Date(now.getTime() - Time.Hour);
      expect(humanizeDate(oneHourAgo)).toBe("1 hour ago");
    });

    it("returns '3 hours ago' for 3 hours (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const threeHoursAgo = new Date(now.getTime() - 3 * Time.Hour);
      expect(humanizeDate(threeHoursAgo)).toBe("3 hours ago");
    });

    it("returns '1 day ago' for 1 day", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneDayAgo = new Date(now.getTime() - Time.Day);
      expect(humanizeDate(oneDayAgo)).toBe("1 day ago");
    });

    it("returns '4 days ago' for 4 days (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const fourDaysAgo = new Date(now.getTime() - 4 * Time.Day);
      expect(humanizeDate(fourDaysAgo)).toBe("4 days ago");
    });

    it("returns '1 week ago' for 1 week", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneWeekAgo = new Date(now.getTime() - Time.Week);
      expect(humanizeDate(oneWeekAgo)).toBe("1 week ago");
    });

    it("returns '2 weeks ago' for 2 weeks (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const twoWeeksAgo = new Date(now.getTime() - 2 * Time.Week);
      expect(humanizeDate(twoWeeksAgo)).toBe("2 weeks ago");
    });

    it("returns '1 month ago' for 1 month", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneMonthAgo = new Date(now.getTime() - Time.Month);
      expect(humanizeDate(oneMonthAgo)).toBe("1 month ago");
    });

    it("returns '6 months ago' for 6 months (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const sixMonthsAgo = new Date(now.getTime() - 6 * Time.Month);
      expect(humanizeDate(sixMonthsAgo)).toBe("6 months ago");
    });

    it("returns '1 year ago' for 1 year", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const oneYearAgo = new Date(now.getTime() - Time.Year);
      expect(humanizeDate(oneYearAgo)).toBe("1 year ago");
    });

    it("returns '3 years ago' for 3 years (plural)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const threeYearsAgo = new Date(now.getTime() - 3 * Time.Year);
      expect(humanizeDate(threeYearsAgo)).toBe("3 years ago");
    });
  });

  describe("edge cases", () => {
    it("handles exactly at unit boundary (60 seconds = 1 minute)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const sixtySecondsAgo = new Date(now.getTime() - 60 * Time.Second);
      expect(humanizeDate(sixtySecondsAgo)).toBe("1 minute ago");
    });

    it("handles just below unit boundary (59 seconds)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * Time.Second);
      expect(humanizeDate(fiftyNineSecondsAgo)).toBe("59 seconds ago");
    });

    it("uses the largest applicable unit", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      // 90 minutes should be "1 hour ago" not "90 minutes ago"
      const ninetyMinutesAgo = new Date(now.getTime() - 90 * Time.Minute);
      expect(humanizeDate(ninetyMinutesAgo)).toBe("1 hour ago");
    });

    it("handles very small differences (< 1 second)", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      const justNow = new Date(now.getTime() - 100);
      expect(humanizeDate(justNow)).toBe("just now");
    });

    it("handles zero difference", () => {
      const now = new Date("2026-04-01T12:00:00.000Z");
      vi.setSystemTime(now);

      expect(humanizeDate(now)).toBe("just now");
    });
  });
});

// ---------------------------------------------------------------------------
// Tests — formatAssessmentDateTime
// ---------------------------------------------------------------------------

describe("formatAssessmentDateTime", () => {
  it("returns '-' for missing or invalid values", () => {
    expect(formatAssessmentDateTime()).toBe("-");
    expect(formatAssessmentDateTime("not-a-date")).toBe("-");
  });

  it("formats a valid date", () => {
    const formatted = formatAssessmentDateTime("2026-06-18T08:20:00.000Z");
    expect(formatted).toContain("2026");
    expect(formatted).toContain("June");
  });
});

// ---------------------------------------------------------------------------
// Tests — formatRelativeTime
// ---------------------------------------------------------------------------

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns '-' for missing or invalid values", () => {
    expect(formatRelativeTime()).toBe("-");
    expect(formatRelativeTime("")).toBe("-");
    expect(formatRelativeTime("not-a-date")).toBe("-");
  });

  it("returns relative minutes for recent timestamps", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");
    vi.setSystemTime(now);

    const nineMinutesAgo = new Date(now.getTime() - 9 * 60 * 1000);
    expect(formatRelativeTime(nineMinutesAgo)).toBe("9 minutes ago");
  });

  it("returns 'today' for same-day timestamps", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");
    vi.setSystemTime(now);

    const earlierToday = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    expect(formatRelativeTime(earlierToday)).toBe("2 hours ago");
  });

  it("accepts epoch milliseconds", () => {
    const now = new Date("2026-04-01T12:00:00.000Z");
    vi.setSystemTime(now);

    const oneDayAgoMs = now.getTime() - 24 * 60 * 60 * 1000;
    expect(formatRelativeTime(oneDayAgoMs)).toBe("yesterday");
  });
});

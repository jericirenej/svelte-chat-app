import {
  differenceInMilliseconds,
  differenceInMinutes,
  isThisMinute,
  isThisWeek,
  isToday
} from "date-fns";

export type DisplayDate = Record<"display" | "title", string>;
type HandleDateReturn = DisplayDate & { repeatIn: number | null };
export const handleDate = ({ date, locale }: { date: Date; locale: string }): HandleDateReturn => {
  const title = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    dateStyle: "medium",
    hourCycle: "h24"
  }).format(date);
  const now = Date.now();
  const inFuture = date.getTime() > now;
  if (inFuture) {
    return {
      display: "Coming from the future...",
      title,
      repeatIn: differenceInMilliseconds(date, now)
    };
  }

  const today = isToday(date);
  const isNow = today ? isThisMinute(date) : false;
  const minuteDiff = differenceInMinutes(now, date, { roundingMethod: "floor" });
  const isLessThanOneHour = !today ? false : minuteDiff < 60 ? true : false;
  const thisWeek = today ? true : isThisWeek(date);

  if (isNow || isLessThanOneHour) {
    const display = isNow ? "Now" : `${minuteDiff} ${minuteDiff === 1 ? "minute" : "minutes"} ago `;
    return { display, title, repeatIn: 6e4 };
  }

  return {
    display: new Intl.DateTimeFormat(locale, {
      hour: thisWeek ? "2-digit" : undefined,
      minute: thisWeek ? "numeric" : undefined,
      day: !today ? "numeric" : undefined,
      month: !today ? "numeric" : undefined,
      year: !thisWeek ? "2-digit" : undefined,
      hourCycle: "h24"
    }).format(date),
    title,
    repeatIn: null
  };
};

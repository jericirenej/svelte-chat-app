import {
  differenceInMilliseconds,
  differenceInMinutes,
  isThisMinute,
  isThisWeek,
  isThisYear,
  isToday
} from "date-fns";
import { TIME_DISPLAY_MESSAGES } from "../../../messages";

export type DisplayDate = Record<"display" | "title", string>;
type HandleDateReturn = DisplayDate & { repeatIn: number | null };

export const handleDate = ({ date, locale }: { date: Date; locale: string }): HandleDateReturn => {
  const { future, minutes, now } = TIME_DISPLAY_MESSAGES;
  const title = new Intl.DateTimeFormat(locale, {
    timeStyle: "short",
    dateStyle: "medium",
    hourCycle: "h24"
  }).format(date);
  const currentTimestamp = Date.now();
  const inFuture = date.getTime() > currentTimestamp;
  if (inFuture) {
    return {
      display: future,
      title,
      repeatIn: differenceInMilliseconds(date, currentTimestamp)
    };
  }

  const today = isToday(date);
  const isNow = today ? isThisMinute(date) : false;
  const minuteDiff = differenceInMinutes(currentTimestamp, date, { roundingMethod: "floor" });
  const isLessThanOneHour = !today ? false : minuteDiff < 60 ? true : false;
  const thisWeek = today ? true : isThisWeek(date);
  const thisYear = isThisYear(date);

  if (isNow || isLessThanOneHour) {
    const display = isNow ? now : minutes(minuteDiff);
    return { display, title, repeatIn: 6e4 };
  }

  return {
    display: new Intl.DateTimeFormat(locale, {
      hour: thisWeek ? "2-digit" : undefined,
      minute: thisWeek ? "numeric" : undefined,
      day: !today ? "numeric" : undefined,
      month: !today ? "numeric" : undefined,
      year: !thisYear ? "2-digit" : undefined,
      hourCycle: "h24"
    }).format(date),
    title,
    repeatIn: null
  };
};

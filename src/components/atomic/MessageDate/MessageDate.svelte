<script lang="ts">
  import { isToday, isThisMinute, isThisWeek } from "date-fns";
  import { onDestroy, onMount } from "svelte";

  export let date: Date | number;

  $: dateVal = date instanceof Date ? date : new Date(date);
  $: formatted = handleDate(dateVal);

  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
  let interval: ReturnType<typeof setInterval> | undefined = undefined;
  export let locale = navigator.language;
  const handleDate = (date: Date): { display: string; title: string } => {
    const inFuture = date.getTime() > Date.now();
    const title = new Intl.DateTimeFormat(locale, {
      timeStyle: "short",
      dateStyle: "medium",
      hourCycle: "h24"
    }).format(date);
    if (inFuture) {
      return { display: "Coming from the future...", title };
    }
    const today = isToday(date);
    const isNow = today ? isThisMinute(date) : false;
    const thisWeek = today ? true : isThisWeek(date);
    if (isNow) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        formatted = handleDate(dateVal);
      }, 10e3);
      return { display: "Now", title };
    }
    clearTimeout(timeout);

    return {
      display: new Intl.DateTimeFormat(locale, {
        hour: thisWeek ? "2-digit" : undefined,
        minute: thisWeek ? "numeric" : undefined,
        day: !today ? "numeric" : undefined,
        month: !today ? "numeric" : undefined,
        year: !thisWeek ? "2-digit" : undefined,
        hourCycle: "h24"
      }).format(date),
      title
    };
  };

  onMount(() => {
    interval = setInterval(() => {
      formatted = handleDate(dateVal);
    }, 3.6e6);
  });
  onDestroy(() => {
    clearInterval(interval);
    clearTimeout(timeout);
  });
</script>

<span class="cursor-default select-none text-xs text-gray-700" title={formatted.title}
  >{formatted.display}</span
>

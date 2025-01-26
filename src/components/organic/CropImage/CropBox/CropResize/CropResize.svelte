<script lang="ts">
  import type { ClickRegion, EventType } from "../../crop";
  import { Subject, map, startWith, throttleTime } from "rxjs";
  import { AVATAR } from "../../../../../constants";
  export let handleDown: (ev: EventType) => unknown;
  export let handleHover: (ev: EventType) => ClickRegion | undefined;
  const hoverEvent = new Subject<MouseEvent>();
  const region = hoverEvent.pipe(
    throttleTime(100),
    map((ev) => {
      const region = handleHover(ev);
      return !region ? "cursor-none" : (`${region}-resize` as const);
    }),
    startWith("cursor-none")
  );

  export let borderWidth: number;
  $: width = `${borderWidth}px`;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="absolute aspect-square w-full rounded-[inherit] border-white"
  style:cursor={$region}
  style:border-width={width}
  style:border-radius={AVATAR.borderRadius}
  on:mousemove={(ev) => {
    hoverEvent.next(ev);
  }}
  on:mousedown={handleDown}
></div>

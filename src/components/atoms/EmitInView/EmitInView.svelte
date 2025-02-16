<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  export let inViewHandler: () => unknown;
  let element: HTMLDivElement | undefined;

  let observer: IntersectionObserver | undefined = undefined;

  onMount(() => {
    if (!element) return;
    observer = new IntersectionObserver(
      ([{ isIntersecting }]) => {
        if (isIntersecting) void inViewHandler();
      },
      {
        root: document,
        threshold: 0.01
      }
    );
    observer.observe(element);
  });
  onDestroy(() => {
    observer?.disconnect();
  });
</script>

<div class="relative">
  <div bind:this={element} class="absolute left-0 h-4"></div>
</div>

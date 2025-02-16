<script lang="ts">
  import clsx from "clsx";

  export let controlOnTop = false;
  $: classes = clsx({
    "flex min-w-[30ch] flex-initial gap-4": true,
    "flex-col": !controlOnTop,
    "flex-col-reverse": controlOnTop
  });
</script>

<div class={classes}>
  <div class="flex flex-col gap-4">
    <slot name="inputs" />
  </div>
  <div class="relative">
    <slot name="controls" />
  </div>
</div>

<script lang="ts">
  import type { EventType } from "../../crop";
  export let handleDown: (ev: EventType) => unknown;
</script>

<div
  on:mousedown={handleDown}
  on:touchstart={handleDown}
  role="presentation"
  class="move-block relative aspect-square cursor-grab rounded-[inherit] active:cursor-grabbing"
></div>

<style lang="css">
  div {
    width: 90%;
    inset: 5%;
  }
</style>

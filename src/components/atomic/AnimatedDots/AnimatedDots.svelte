<script lang="ts">
  export let bgColor = "bg-slate-500";
</script>

<div class="mx-2 flex gap-1">
  {#each [0, 1, 2] as dot}
    <div
      class={`dot ${bgColor} relative inline-block aspect-square  rounded-md bg-inherit opacity-0`}
      style:animation-delay={`${dot * 200}ms`}
    ></div>
  {/each}
</div>

<style>
  .dot {
    animation: strobe 1s infinite linear;
    width: var(--size, 6px);
  }
  @keyframes strobe {
    0% {
      opacity: 0;
    }
    45% {
      opacity: 1;
    }
  }
</style>

<script lang="ts">
  import clsx from "clsx";
  import CropAction from "./CropAction.svelte";

  export let resetCallback: () => void;
  export let confirmCallback: () => void;
  export let cancelCallback: () => void;
  export let resetDisabled: boolean;
  export let confirmDisabled: boolean;
</script>

<div class="flex flex-col gap-3">
  <div class={clsx({ action: true, enabled: !confirmDisabled })}>
    <CropAction disabled={confirmDisabled} action={confirmCallback} type="confirm" />
  </div>
  <div class={clsx({ action: true, enabled: !resetDisabled })}>
    <CropAction disabled={resetDisabled} action={resetCallback} type="reset" />
  </div>
  <div class={clsx({ action: true, enabled: true })}>
    <CropAction disabled={false} action={cancelCallback} type="cancel" />
  </div>
</div>

<style lang="css">
  .action {
    position: relative;
    transform: translateX(-15%);
    transition: transform 0.3s ease;
  }
  .action:hover {
    transform: translateX(-8%);
  }
</style>

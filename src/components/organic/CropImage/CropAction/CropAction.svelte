<script lang="ts">
  import { IMAGE_CROP } from "../../../../messages";
  export let disabled: boolean;
  export let type: "reset" | "confirm" | "cancel";
  export let action: () => void;

  const color = {
    reset: { bg: "bg-slate-700", bgHover: "enabled:hover:bg-slate-600" },
    confirm: { bg: "bg-emerald-700", bgHover: "enabled:hover:bg-emerald-600" },
    cancel: { bg: "bg-red-700", bgHover: "enabled:hover:bg-red-600" }
  };
  const { reset, confirm, cancel } = IMAGE_CROP;
  const label = { reset, confirm, cancel };
  $: disabledTitle = type === "reset" ? IMAGE_CROP.pristine : null;
  const width = [Math.max(IMAGE_CROP.confirm.length, IMAGE_CROP.reset.length) + 4, "ch"].join("");
</script>

<button
  {disabled}
  on:click={action}
  style:width
  title={disabled ? disabledTitle : null}
  class={`inline-block rounded-md rounded-l-none text-right ${color[type].bg} py-3 text-white transition-all ${color[type].bgHover} active:brightness-75 disabled:cursor-not-allowed disabled:text-black disabled:opacity-75`}
  type="button"><span class="pr-3">{label[type]}</span></button
>

<style lang="css">
  button {
    transition-duration: 300ms;
  }
</style>

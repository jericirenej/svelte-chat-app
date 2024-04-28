<script context="module" lang="ts">
  export type ButtonActions = "confirm" | "cancel" | "danger" | "info";
  export type ButtonSizes = "sm" | "md" | "lg";
  export type ButtonTypes = "button" | "submit";
  export type ButtonDisplay = "inline-block" | "block";
  export type ButtonVariant = "primary" | "outline";
</script>

<script lang="ts">
  import { tick } from "svelte";

  export let disabled: boolean = false;
  export let display: ButtonDisplay = "inline-block";
  export let size: ButtonSizes = "md";
  export let action: ButtonActions = "confirm";
  export let type: ButtonTypes = "button";
  export let variant: ButtonVariant = "primary";
  export let customClasses: string | undefined = undefined;
  export let focus: boolean | undefined = undefined;
  let ref: HTMLButtonElement | undefined;

  const onFocus = async (focusVal: boolean | undefined): Promise<void> => {
    if (!focusVal) return;
    await tick();
    ref?.focus();
  };

  $: void onFocus(focus);

  const sizes = { sm: "py-2 px-3 text-xs", md: "py-3 px-4 text-sm", lg: "py-4 px-7 text-md" };

  const displayType = { block: "block w-full", "inline-block": "inline-block" };
  const buttonColor = {
    primary: {
      confirm:
        "bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 ring-emerald-500",
      info: "bg-violet-500 border-violet-500 text-white hover:bg-violet-600 hover:border-violet-600 ring-violet-500",
      cancel: "bg-slate-500 border-slate-500 text-white hover:bg-slate-600 ring-slate-500",
      danger:
        "bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600 ring-red-500"
    },
    outline: {
      confirm:
        "border-emerald-500 ring-emerald-600 text-emerald-500 hover:bg-emerald-50  ring-emerald-500",
      cancel: "border-slate-500 text-slate-500 hover:bg-slate-100 ring-slate-500",
      info: "border-violet-500 text-violet-500 hover:bg-violet-100 ring-violet-500",
      danger: "border-red-500 text-red-500 hover:bg-red-50 ring-red-500"
    }
  };

  const baseClasses = `lead-none disabled:cursor-not-allowed
  disabled:opacity-75 cursor-pointer rounded border-2 border-solid
  ring-offset-2 transition duration-100 hover:shadow-sm 
  focus:outline-none focus-visible:outline-none focus:ring-1 active:scale-95 active:ring-0 disabled:active:scale-100 [&.active]:scale-95 [&.active]:ring-0 disabled:[&.active]:scale-100`;

  let active = false;
</script>

<button
  bind:this={ref}
  class={` ${baseClasses} ${displayType[display]} ${sizes[size]} ${buttonColor[variant][action]} ${
    customClasses ?? ""
  }
  `}
  class:active
  {type}
  {disabled}
  {...$$restProps}
  on:pointerenter
  on:pointerleave
  on:focus
  on:blur
  on:keydown={(ev) => {
    if (ev.key === "Enter") active = true;
  }}
  on:keyup={() => (active = false)}
  on:click><slot /></button
>

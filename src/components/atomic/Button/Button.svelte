<script context="module" lang="ts">
  export type ButtonActions = "confirm" | "cancel" | "danger";
  export type ButtonSizes = "sm" | "md" | "lg";
</script>

<script lang="ts">
  export let disabled: boolean = false;
  export let display: "inlineBlock" | "block" = "inlineBlock";
  export let size: ButtonSizes = "md";
  export let action: ButtonActions = "confirm";
  export let variant: "primary" | "outline" = "primary";

  const sizes = { sm: "py-2 px-3 text-xs", md: "py-3 px-4 text-sm", lg: "py-4 px-7 text-md" };

  const displayType = { block: "block w-full", inlineBlock: "inline-block" };
  const buttonColor = {
    primary: {
      confirm: `bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 hover:border-emerald-600 ring-emerald-500`,
      cancel: `bg-slate-500 border-slate-500 text-white hover:bg-slate-600 ring-slate-500`,
      danger: `bg-red-500 border-red-500 text-white hover:bg-red-600 hover:border-red-600 ring-red-500`
    },
    outline: {
      confirm: `border-emerald-500 ring-emerald-600 text-emerald-500 hover:bg-emerald-50  ring-emerald-500`,
      cancel: `border-slate-500 text-slate-500 hover:bg-slate-100 ring-slate-500`,
      danger: `border-red-500 text-red-500 hover:bg-red-50 ring-red-500`
    }
  };

  const baseClasses = `lead-none cursor-pointer 
    rounded border-2 border-solid 
    disabled:opacity-75 disabled:cursor-not-allowed 
    hover:shadow-sm
    active:scale-95
    active:ring-0
    focus-visible:ring-1 ring-offset-2 focus:outline-none focus-visible:outline-none
    transition duration-100`;
</script>

<button
  class={`
  ${baseClasses}
  ${displayType[display]} 
  ${size ? sizes[size] : sizes.sm} 
  ${buttonColor[variant][action]}
  `}
  type="button"
  {disabled}
  on:click><slot>Button</slot></button
>

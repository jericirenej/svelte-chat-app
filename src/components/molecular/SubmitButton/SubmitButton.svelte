<script lang="ts">
  import loadingIcon from "@iconify/icons-eos-icons/loading";
  import Icon from "@iconify/svelte";
  import { fade } from "svelte/transition";
  import Button, {
    type ButtonActions,
    type ButtonDisplay,
    type ButtonSizes,
    type ButtonVariant
  } from "../../atomic/Button/Button.svelte";
  export let isLoading = false;
  export let config:
    | Partial<{
        variant: ButtonVariant;
        size: ButtonSizes;
        display: ButtonDisplay;
        action: ButtonActions;
        customClasses: string;
      }>
    | undefined = undefined;
  export let text = "Submit";
  export let disabled = false;
  export let title = "";
</script>

<Button
  type="submit"
  disabled={isLoading || disabled}
  action={config?.action ?? "confirm"}
  variant={config?.variant}
  size={config?.size}
  display={config?.display}
  customClasses={config?.customClasses ?? "py-[0.5rem]"}
  {title}
>
  <div class="flex justify-center">
    <div class="relative px-3" style:width={`${text.length + 3}ch`}>
      <span
        class="leading-1 relative inline-block text-sm transition {isLoading
          ? '-translate-x-2'
          : 'translate-x-0'}"
      >
        {text}
      </span>
      {#if isLoading}
        <span in:fade={{ duration: 100 }}>
          <Icon
            icon={loadingIcon}
            class="leading-1 absolute -right-2 top-[1px] inline-block text-lg"
          />
        </span>
      {/if}
    </div>
  </div>
</Button>

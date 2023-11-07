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
      }>
    | undefined = undefined;
  export let text = "Submit";
</script>

<Button type="submit" disabled={isLoading} action="confirm" {...config}>
  <div class="flex justify-center">
    <div class="relative px-3" style:width={`${text.length + 3}ch`}>
      <span
        class="text-sm leading-1 inline-block relative transition {isLoading
          ? '-translate-x-2'
          : 'translate-x-0'}"
      >
        {text}
      </span>
      {#if isLoading}
        <span in:fade={{ duration: 100 }}>
          <Icon
            icon={loadingIcon}
            class="absolute inline-block text-lg leading-1 -right-2 top-[1px]"
          />
        </span>
      {/if}
    </div>
  </div>
</Button>

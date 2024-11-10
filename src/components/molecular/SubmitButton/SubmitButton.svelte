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
  import LoadOverlay from "../../atomic/LoadOverlay/LoadOverlay.svelte";
  import SubmitMessages from "../../atomic/SubmitMessages/SubmitMessages.svelte";
  export let isLoading = false;
  export let config: Partial<{
    variant: ButtonVariant;
    size: ButtonSizes;
    display: ButtonDisplay;
    action: ButtonActions;
    customClasses: string;
  }> = {};
  export let text = "Submit";
  export let disabled = false;
  export let title = "";
  export let submitMessage: string | undefined = undefined;
  export let submitStatus: "success" | "error" | undefined = undefined;
  $: showNotification = !!(submitStatus && submitMessage);
  $: messages = submitMessage?.split(/(?<=[.!])/g).filter(Boolean) ?? [];
</script>

<div class="relative">
  <LoadOverlay {isLoading} />
  <Button
    type="submit"
    disabled={isLoading || disabled}
    action={config.action ?? "confirm"}
    variant={config.variant ?? "primary"}
    size={config.size}
    display={config.display}
    customClasses={config.customClasses ?? "py-[0.5rem]"}
    {title}
  >
    <div class="flex justify-center">
      <div class="relative flex px-3" style:width={`${text.length + 3}ch`}>
        <span
          class="leading-1 relative inline-block text-sm transition {isLoading
            ? '-translate-x-2'
            : 'translate-x-0'}"
        >
          {text}
        </span>
        {#if isLoading}
          <span in:fade={{ duration: 100 }}>
            <Icon icon={loadingIcon} class="text-lg" />
          </span>
        {/if}
      </div>
    </div>
  </Button>
  {#if showNotification}
    <SubmitMessages
      alignment={config.display === "block" ? "center" : "left"}
      {messages}
      success={submitStatus === "success"}
    />
  {/if}
</div>

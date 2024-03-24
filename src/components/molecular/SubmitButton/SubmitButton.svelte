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
  export let submitMessage: string | undefined = undefined;
  export let submitStatus: "success" | "error" | undefined = undefined;
  $: showNotification = !!(submitStatus && submitMessage);
  $: messages = submitMessage?.split(/(?<=[\.!])/g).filter(Boolean) ?? [];

  $: console.log(messages);
</script>

<div class={`relative ${isLoading ? "loading relative" : ""}`}>
  <Button
    type="submit"
    disabled={isLoading || disabled}
    action={config?.action ?? "confirm"}
    variant={config?.variant ?? "primary"}
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
  {#if showNotification}
    <div
      transition:fade={{ duration: 150 }}
      class={`
      top-100 absolute left-0 flex
      w-full flex-col gap-1
      ${config?.display === "block" ? "text-center" : "text-left"}
      select-none
      overflow-hidden
      text-ellipsis
      whitespace-nowrap
      text-sm
      ${submitStatus === "success" ? "text-emerald-500" : "text-red-600"}
`}
    >
      {#each messages as message}
        <small>{message}</small>
      {/each}
    </div>
  {/if}
</div>

<style>
  .loading {
    overflow: hidden;
  }
  .loading::after {
    position: absolute;
    content: "";
    left: -150%;
    height: 120%;
    width: 75%;
    bottom: 0;
    transform: skewX(-20deg);
    background-color: hsla(0deg, 0%, 100%, 20%);
    box-shadow: 0 0 10px 10px hsla(0deg, 0%, 100%, 20%);
    animation: swoosh 2s infinite;
  }
  @keyframes swoosh {
    from {
      left: -150%;
    }
    to {
      left: 150%;
    }
  }
</style>

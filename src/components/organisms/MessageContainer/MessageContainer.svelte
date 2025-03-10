<script context="module" lang="ts">
  export type MessageLoadPrevious = () => unknown;
  export type MessageParticipantData = Map<string, { name: string; avatar: Maybe<string> }>;
</script>

<script lang="ts">
  import { debounce } from "$lib/utils";
  import arrowDown from "@iconify/icons-humbleicons/arrow-down";
  import Icon from "@iconify/svelte";
  import { afterUpdate, onMount } from "svelte";
  import { fade } from "svelte/transition";
  import type { MessageDto } from "../../../../db/postgres/types";
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import EmitInView from "../../atoms/EmitInView/EmitInView.svelte";
  import MessageList from "../../molecules/MessageList/MessageList.svelte";
  import type { Maybe } from "../../../types";
  export let loggedUserId: string;
  export let chatId: string;
  export let messages: MessageDto[];
  export let total: number;
  export let participants: Map<string, { name: string; avatar: Maybe<string> }>;
  export let loadPrevious: MessageLoadPrevious;

  const SCROLL_BUFFER = 50;
  let div!: HTMLDivElement;
  let userScroll: boolean | null = null;
  let previousLoaded = false;
  let alertMessage = false;
  let msgCount = 0;
  let showEmit: boolean;
  let smoothScroll = false;

  let timeout: ReturnType<typeof setTimeout>;

  const resetSmoothScroll = (_chatId: string) => {
    clearTimeout(timeout);
    smoothScroll = false;
    timeout = setTimeout(() => {
      smoothScroll = true;
    }, 50);
  };

  $: resetSmoothScroll(chatId);

  const isContentInvisible = (div: HTMLDivElement) => {
    return div.scrollTop < div.scrollHeight - div.offsetHeight - SCROLL_BUFFER;
  };
  const scrollToBottom = () => {
    div.scrollTop = div.scrollHeight;
  };
  const handleScroll = debounce(() => {
    if (previousLoaded) {
      previousLoaded = false;
    }
    // If scroll position is more than 50 pixels upwards from bottom
    // we presume the user wishes to stay at the scrolled position.
    const isInvisible = isContentInvisible(div);
    userScroll = isInvisible;
  }, 20);

  const shouldScroll = () => {
    return (userScroll === null || !userScroll) && !previousLoaded;
  };

  const handlePreviousLoad = async () => {
    if (messages.length >= total) return;
    previousLoaded = true;
    const currentHeight = div.scrollHeight;
    await loadPrevious();
    div.scrollTo({ top: div.scrollHeight - currentHeight, behavior: "instant" });
  };

  const handleNotification = () => {
    alertMessage = false;
    scrollToBottom();
  };

  const onMessageAdd = (msgLength: number) => {
    alertMessage =
      !previousLoaded &&
      !!userScroll &&
      msgCount !== 0 &&
      msgLength > msgCount &&
      isContentInvisible(div);
    msgCount = msgLength;
  };

  $: onMessageAdd(messages.length);

  afterUpdate(() => {
    if (shouldScroll()) {
      scrollToBottom();
    }
  });
  onMount(() => {
    // Delay rendering of EmitInView to allow container to scroll if needed,
    // hide the emit element and prevent unneeded fetch
    setTimeout(() => {
      showEmit = true;
    }, 50);
  });
</script>

<svelte:window on:resize={handleScroll} />
<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
<div
  tabindex="0"
  role="group"
  aria-label={CONVERSATION_MESSAGES.containerLabel}
  class={`h-full overflow-y-auto ${smoothScroll ? "scroll-smooth" : ""}`}
  on:scroll={handleScroll}
  bind:this={div}
>
  {#if alertMessage}
    <button
      class="sticky right-3 top-1 ml-auto block aspect-square cursor-pointer rounded-full bg-green-600 text-3xl font-thin text-white shadow-sm"
      title={CONVERSATION_MESSAGES.newMessagesInvisible}
      transition:fade={{ duration: 100 }}
      on:click={handleNotification}
    >
      <Icon class="p-1" icon={arrowDown} />
    </button>
  {/if}
  {#if showEmit}
    <EmitInView inViewHandler={handlePreviousLoad} />
  {/if}
  <MessageList {loggedUserId} {messages} {participants} />
</div>

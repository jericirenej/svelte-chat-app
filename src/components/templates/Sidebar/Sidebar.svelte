<script context="module" lang="ts">
  export type WidthDimensions = Record<"min" | "max", string>;
</script>

<script lang="ts">
  import { onMount } from "svelte";

  import { debounce } from "$lib/utils";
  import {
    CONVERSATION_MESSAGES,
    CREATE_CHAT,
    PREVIEW_LIST_EMPTY,
    PREVIEW_LIST_TITLE
  } from "../../../messages";
  import type { Nullish, UnreadChatMessages, UsersTyping } from "../../../types";
  import AddChat from "../../atoms/Add/AddChat.svelte";
  import NavIcons from "../../molecules/NavIcons/NavIcons.svelte";
  import ChatPreviewList from "../../organisms/ChatPreviewList/ChatPreviewList.svelte";
  import type { ChatPreviewProp } from "../../organisms/ChatPreviewList/types";
  import Dialog from "../../organisms/Dialog/Dialog.svelte";

  export let chatPreviewList: ChatPreviewProp[] | null;
  export let chatUnreadList: UnreadChatMessages;
  export let usersTyping: UsersTyping;
  export let routeId: string | null;
  export let onActivateHandler: (chatId: string) => void;
  export let handleLogout: () => Promise<void>;
  export let handleChatDelete: (chatId: string) => Promise<void>;
  export let handleChatCreate: () => void;
  let showLeaveChatDialog = false,
    leaveChatTarget: string | null = null,
    previewRef: HTMLDivElement | undefined,
    chatTransparencyMask = true;

  const showDialogForChatLeave = (chatId: string) => {
    leaveChatTarget = chatId;
    showLeaveChatDialog = true;
  };
  const handleScroll = debounce(() => {
    if (!previewRef) return;
    chatTransparencyMask =
      previewRef.scrollTop + previewRef.clientHeight !== previewRef.scrollHeight;
  }, 30);

  const handlePreviewChange = (_length: number | Nullish) => {
    handleScroll();
  };
  $: handlePreviewChange(chatPreviewList?.length);
  onMount(() => {
    handleScroll();
  });
</script>

<svelte:window on:resize={handleScroll} />
<div
  class="flex h-full w-full flex-col rounded-md bg-slate-700 text-neutral-50 transition-max-width duration-500"
  style:min-width="350px"
  style:max-width="max(500px, 25%)"
>
  <div class="my-5 ml-3 mr-4 flex shrink-0 justify-between text-neutral-200">
    <h2 class="select-none text-right text-xl uppercase">{PREVIEW_LIST_TITLE}</h2>
    <AddChat disabled={false} on:click={handleChatCreate} title={CREATE_CHAT.title} />
  </div>
  {#if chatPreviewList !== null}
    {#if chatPreviewList.length}
      <div
        bind:this={previewRef}
        class="max-h-[85%] overflow-y-auto rounded-[inherit] bg-slate-700"
        class:chat-previews={chatTransparencyMask}
        on:scroll={handleScroll}
      >
        <ChatPreviewList
          {chatPreviewList}
          {chatUnreadList}
          {usersTyping}
          onActive={onActivateHandler}
          onDelete={showDialogForChatLeave}
          {routeId}
        />
      </div>
      <div class="pb-10"></div>
    {:else}
      <p class="ml-3">{PREVIEW_LIST_EMPTY}</p>
    {/if}
  {/if}
  <nav class="mt-auto shrink-0">
    <NavIcons {routeId} {handleLogout} />
  </nav>
</div>

<!-- Dialog for confirming chat leave action -->
<Dialog
  bind:open={showLeaveChatDialog}
  confirmAction={async () => {
    if (leaveChatTarget) {
      await handleChatDelete(leaveChatTarget);
      leaveChatTarget = null;
    }
  }}
>
  <h1 class="mb-3 text-center text-lg font-semibold">
    {CONVERSATION_MESSAGES.leaveChat}
  </h1>
  <p>
    {CONVERSATION_MESSAGES.leaveChatMessage}
  </p>
</Dialog>

<style lang="css">
  .chat-previews {
    mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
  }
</style>

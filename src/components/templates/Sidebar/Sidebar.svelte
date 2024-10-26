<script context="module" lang="ts">
  export type WidthDimensions = Record<"min" | "max", string>;
</script>

<script lang="ts">
  import { page } from "$app/stores";

  import { fade, fly } from "svelte/transition";
  import type { UnreadChatMessages, UsersTyping } from "../../../types";
  import NavIcons from "../../molecular/NavIcons/NavIcons.svelte";
  import ChatPreviewList from "../../organic/ChatPreviewList/ChatPreviewList.svelte";
  import type { ChatPreviewProp } from "../../organic/ChatPreviewList/types";
  import Dialog from "../../organic/Dialog/Dialog.svelte";
  import { CONVERSATION_MESSAGES } from "../../../messages";

  export let showNav: boolean;
  export let chatPreviewList: ChatPreviewProp[];
  export let chatUnreadList: UnreadChatMessages;
  export let usersTyping: UsersTyping;

  export let onActivateHandler: (chatId: string) => void;
  export let handleLogout: () => Promise<void>;
  export let handleChatDelete: (chatId: string) => Promise<void>;

  let min: string, max: string;
  let showLeaveChatDialog = false,
    leaveChatTarget: string | null = null;

  const setWidth = (showNav: boolean) => {
    if (showNav) {
      max = "max(500px, 25%)";
      setTimeout(() => {
        min = "350px";
      }, 300);
      return;
    }
    min = "0px";
    max = "0px";
  };

  const showDialogForChatLeave = (chatId: string) => {
    leaveChatTarget = chatId;
    showLeaveChatDialog = true;
  };

  $: setWidth(showNav);
</script>

<section
  transition:fly={{ duration: 300, y: -400 }}
  class="sidebar h-full w-full rounded-s-[inherit] bg-slate-700 text-neutral-50 transition-max-width duration-500"
  style:min-width={min}
  style:max-width={max}
>
  <nav>
    {#if showNav}
      <section in:fade>
        <NavIcons routeId={$page.route.id} {handleLogout} />
      </section>
    {/if}
  </nav>
  {#if chatPreviewList.length}
    <div class="mt-5">
      <ChatPreviewList
        {chatPreviewList}
        {chatUnreadList}
        {usersTyping}
        onActive={onActivateHandler}
        onDelete={showDialogForChatLeave}
      />
    </div>
  {/if}
</section>

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

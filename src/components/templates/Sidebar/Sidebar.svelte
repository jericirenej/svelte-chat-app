<script context="module" lang="ts">
  export type WidthDimensions = Record<"min" | "max", string>;
</script>

<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { handleLogoutCall } from "$lib/client/session-handlers";
  import {
    chatPreviews,
    showSessionExpirationWarning,
    unreadChatMessages,
    usersTyping
  } from "$lib/client/stores";
  import { fade, fly } from "svelte/transition";
  import { CHAT_ROUTE } from "../../../constants";
  import NavIcons from "../../molecular/NavIcons/NavIcons.svelte";
  import ChatPreviewList from "../../organic/ChatPreviewList/ChatPreviewList.svelte";

  export let showNav: boolean;
  export let handleChatDelete: (chatId: string) => Promise<void>;

  let min: string, max: string;

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

  const closeSession = async () => {
    await handleLogoutCall();
    $showSessionExpirationWarning = false;
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
        <NavIcons routeId={$page.route.id} handleLogout={closeSession} />
      </section>
    {/if}
  </nav>
  {#if $chatPreviews.length}
    <div class="mt-5">
      <ChatPreviewList
        chatPreviewList={$chatPreviews}
        chatUnreadList={$unreadChatMessages}
        onActive={(id) => {
          void goto(`${CHAT_ROUTE}/${id}`);
        }}
        usersTyping={$usersTyping}
        onDelete={handleChatDelete}
      />
    </div>
  {/if}
</section>

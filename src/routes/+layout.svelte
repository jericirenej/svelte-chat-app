<script lang="ts">
  import { page } from "$app/stores";
  import { handleLogoutCall } from "$lib/client/session-handlers";
  import {
    notificationStore,
    showSessionExpirationWarning,
    unreadChatMessages,
    chatPreviews
  } from "$lib/client/stores";
  import { fade, fly } from "svelte/transition";
  import "../app.css";

  import { goto } from "$app/navigation";
  import NavIcons from "../components/molecular/NavIcons/NavIcons.svelte";
  import NotificationWrapper from "../components/molecular/wrappers/NotificationWrapper/NotificationWrapper.svelte";
  import ChatPreviewList from "../components/organic/ChatPreviewList/ChatPreviewList.svelte";
  import { CHAT_ROUTE } from "../constants.js";
  import type { LayoutData } from "./$types";
  import { onMount } from "svelte";
  import { LayoutClientHandlers } from "$lib/client/layout-handlers";
  export let data: LayoutData;
  let minWidth: string, maxWidth: string;
  const setWidth = (loggedIn: boolean) => {
    if (loggedIn) {
      maxWidth = "max(500px, 25%)";
      setTimeout(() => {
        minWidth = "350px";
      }, 300);
      return;
    }
    minWidth = "0px";
    maxWidth = "0px";
  };

  $: setWidth(!!data.user);

  const closeSession = async () => {
    await handleLogoutCall();
    $showSessionExpirationWarning = false;
  };
  onMount(() => {
    LayoutClientHandlers.initiateSocket(data);
    LayoutClientHandlers.setPreviewAndUnreadOnLoad(data);
  });
</script>

<div class="flex h-screen w-screen items-center justify-center overflow-hidden bg-neutral-400">
  <div
    class="app relative flex h-[95vh] w-[95vw] max-w-[1900px] overflow-y-auto rounded-md bg-white"
  >
    <section
      transition:fly={{ duration: 300, y: -400 }}
      class="sidebar h-full w-full rounded-s-[inherit] bg-slate-700 text-neutral-50 transition-max-width duration-500"
      style:min-width={minWidth}
      style:max-width={maxWidth}
    >
      <nav>
        {#if data.user}
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
            onDelete={(id) => {
              console.log("Delete:", id);
            }}
          />
        </div>
      {/if}
    </section>
    <slot />

    <div class="absolute right-3 top-3 z-10">
      <NotificationWrapper notifications={notificationStore} lifespan={3000} />
    </div>
  </div>
</div>

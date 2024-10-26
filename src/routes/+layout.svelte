<script lang="ts">
  import {
    chatPreviews,
    notificationStore,
    showSessionExpirationWarning,
    unreadChatMessages,
    usersTyping
  } from "$lib/client/stores";
  import "../app.css";

  import { goto } from "$app/navigation";
  import { layoutOnMountHandler } from "$lib/client/layout-handlers";
  import { removeChat, setPreviewAndUnreadOnLoad } from "$lib/client/message-handlers";
  import { handleLogoutCall } from "$lib/client/session-handlers";
  import { onMount } from "svelte";
  import NotificationWrapper from "../components/molecular/wrappers/NotificationWrapper/NotificationWrapper.svelte";
  import Sidebar from "../components/templates/Sidebar/Sidebar.svelte";
  import { CHAT_ROUTE } from "../constants";
  import type { LayoutData } from "./$types";
  export let data: LayoutData;

  const handleChatDelete = async (chatId: string) => {
    if (!data.user) return;
    await removeChat(chatId, data.user.id);
  };

  const navigateToChat = (chatId: string) => {
    void goto(`${CHAT_ROUTE}/${chatId}`);
  };
  const handleLogout = async () => {
    await handleLogoutCall();
    $showSessionExpirationWarning = false;
  };
  onMount(() => {
    layoutOnMountHandler(data);
    setPreviewAndUnreadOnLoad(data);
  });
</script>

<div class="flex h-screen w-screen items-center justify-center overflow-hidden bg-neutral-400">
  <div
    class="app relative flex h-[95vh] w-[95vw] max-w-[1900px] overflow-y-auto rounded-md bg-white"
  >
    <Sidebar
      usersTyping={$usersTyping}
      chatUnreadList={$unreadChatMessages}
      chatPreviewList={$chatPreviews}
      showNav={!!data.user}
      {handleChatDelete}
      onActivateHandler={navigateToChat}
      {handleLogout}
    />
    <slot />

    <div class="absolute right-3 top-3 z-10">
      <NotificationWrapper notifications={notificationStore} lifespan={3000} />
    </div>
  </div>
</div>

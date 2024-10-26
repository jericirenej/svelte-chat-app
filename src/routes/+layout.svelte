<script lang="ts">
  import { notificationStore } from "$lib/client/stores";
  import "../app.css";

  import { layoutOnMountHandler } from "$lib/client/layout-handlers";
  import { removeChat, setPreviewAndUnreadOnLoad } from "$lib/client/message-handlers";
  import { onMount } from "svelte";
  import NotificationWrapper from "../components/molecular/wrappers/NotificationWrapper/NotificationWrapper.svelte";
  import Sidebar from "../components/templates/Sidebar/Sidebar.svelte";
  import type { LayoutData } from "./$types";
  export let data: LayoutData;

  const handleChatDelete = async (chatId: string) => {
    if (!data.user) return;
    await removeChat(chatId, data.user.id);
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
    <Sidebar {handleChatDelete} showNav={!!data.user} />
    <slot />

    <div class="absolute right-3 top-3 z-10">
      <NotificationWrapper notifications={notificationStore} lifespan={3000} />
    </div>
  </div>
</div>

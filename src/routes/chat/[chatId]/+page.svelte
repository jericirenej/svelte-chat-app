<script lang="ts">
  import { page } from "$app/stores";
  import { loadPrevious, sendMessage } from "$lib/client/message-handlers";

  import {
    chats,
    socket,
    unreadChatMessages,
    usersTyping as usersTypingStore
  } from "$lib/client/stores";
  import { debounce } from "$lib/utils";
  import { onDestroy, onMount } from "svelte";
  import { type Unsubscriber } from "svelte/store";
  import ChatContainer from "../../../components/organic/ChatContainer/ChatContainer.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: chatId = $page.params.chatId;
  $: target = $chats[chatId];
  $: clientSocket = $socket;

  let resetMessage: (() => void) | undefined;
  let isTyping = false;
  const typingOff = debounce(() => {
    isTyping = false;
  }, 700);
  const setTypingStatus = () => {
    isTyping = true;
    typingOff();
  };

  const emitTypingStatus = (status: boolean) => {
    if (!clientSocket) return;
    clientSocket.emit("userTyping", { chatId, userId: data.user.id, status });
  };

  $: emitTypingStatus(isTyping);

  const resetMessageHandler = () => {
    if (resetMessage) resetMessage();
  };

  let unsubscribe: Unsubscriber | undefined;
  onMount(() => {
    unsubscribe = page.subscribe(({ params }) => {
      const { chatId } = params;
      resetMessageHandler();
      unreadChatMessages.update((unread) => {
        unread[chatId] = 0;
        return unread;
      });

      chats.update((chats) => {
        if (chatId in chats) return chats;
        return {
          ...chats,
          [chatId]: data
        };
      });
    });
  });
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
</script>

<svelte:head>
  <title>{data.chats?.find((c) => c.chatId === chatId)?.chatLabel}</title>
</svelte:head>
{#if target}
  <div class="w-full px-4 pb-5">
    <ChatContainer
      data={target}
      userId={data.user.id}
      usersTyping={$usersTypingStore[chatId]?.label}
      {loadPrevious}
      onInput={setTypingStatus}
      {sendMessage}
      bind:resetMessage
    />
  </div>
{/if}

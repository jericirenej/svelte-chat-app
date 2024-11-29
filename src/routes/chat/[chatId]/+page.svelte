<script lang="ts">
  import { page } from "$app/stores";
  import { loadPrevious, sendMessage } from "$lib/client/chat-handlers";

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
  import { fade } from "svelte/transition";

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
  <div in:fade class="mb-5 mt-6 w-full px-4">
    <ChatContainer
      data={target}
      userId={data.user.id}
      {chatId}
      usersTyping={$usersTypingStore[chatId]?.label}
      {loadPrevious}
      onInput={setTypingStatus}
      {sendMessage}
      bind:resetMessage
    />
  </div>
{/if}

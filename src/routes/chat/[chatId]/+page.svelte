<script lang="ts">
  import { page } from "$app/stores";
  import { postChatMessage } from "$lib/client/message-handlers";
  import {
    chats,
    socket,
    unreadChatMessages,
    usersTyping as usersTypingStore
  } from "$lib/client/stores";
  import { debounce, participantName } from "$lib/utils";
  import { onDestroy, onMount } from "svelte";
  import { type Unsubscriber } from "svelte/store";
  import ChatContainer from "../../../components/organic/ChatContainer/ChatContainer.svelte";
  import { MESSAGE_TAKE } from "../../../constants";
  import type { SingleChatData } from "../../../types";
  import type { PageData } from "./$types";

  export let data: PageData;

  $: chatId = $page.params.chatId;
  $: target = $chats[chatId];
  $: href = `${$page.url.origin}/api/chat/${chatId}`;
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

  const typingParticipants = (ids: string[]): string[] => {
    return data.participants.filter((p) => ids.includes(p.id)).map((p) => participantName(p));
  };

  $: emitTypingStatus(isTyping);
  $: usersTyping = typingParticipants([...($usersTypingStore[chatId] ?? [])]);

  const sendMessage = async (message: string) => {
    const result = await postChatMessage(href, message);
    if (result) {
      if (clientSocket) {
        clientSocket.emit("messagePush", result);
      }
      chats.update((chats) => {
        chats[chatId].messages.unshift(result);
        return chats;
      });
    }
    return !!result;
  };
  const resetMessageHandler = () => {
    resetMessage && resetMessage();
  };
  const updateChats = async () => {
    const loaded = target.messages.length;
    const allLoaded = target.total === loaded;
    if (allLoaded) return;
    const url = new URL(href);
    url.searchParams.set("skip", loaded.toString());
    url.searchParams.set("take", Math.min(target.total - loaded, MESSAGE_TAKE).toString());
    const response = await fetch(url, {
      method: "GET",
      headers: { "content-type": "application/json" }
    });
    const data = (await response.json()) as SingleChatData;
    chats.update((chats) => {
      chats[chatId].messages.push(...data.messages);
      chats[chatId].total = data.total;
      return chats;
    });
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
    unsubscribe && unsubscribe();
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
      {usersTyping}
      loadPrevious={updateChats}
      onInput={setTypingStatus}
      {sendMessage}
      bind:resetMessage
    />
  </div>
{/if}

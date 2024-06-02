<script lang="ts">
  import { debounce } from "$lib/utils";
  import exclamationIcon from "@iconify/icons-humbleicons/exclamation";
  import Icon from "@iconify/svelte";
  import { afterUpdate } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { fade, fly } from "svelte/transition";
  import type { MessageDto } from "../../../../db/postgres/types";
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import Message from "../Message/Message.svelte";
  export let loggedUserId: string;
  export let messages: MessageDto[];
  export let participants: Map<string, string>;

  const { ownMessageAuthor, newMessagesInvisible } = CONVERSATION_MESSAGES;

  const SCROLL_BUFFER = 50;

  let ul: HTMLUListElement | undefined;
  let userScroll = false;
  let alertMessage = false;
  let msgCount = 0;

  const isContentInvisible = (ul: HTMLUListElement) => {
    return ul.scrollTop < ul.scrollHeight - ul.offsetHeight - SCROLL_BUFFER;
  };
  const scrollToBottom = () => {
    if (!ul) return;
    ul.scrollTop = ul.scrollHeight;
  };
  const handleScroll = debounce(() => {
    if (!ul) return;
    // If scroll position is more than 50 pixels upwards from bottom
    // we presume user scrolled and they want to stay there.
    const isInvisible = isContentInvisible(ul);
    userScroll = isInvisible;
  }, 50);

  const handleNewContent = (msgLength: number, userScroll: boolean) => {
    if (!ul) return;
    alertMessage = userScroll && msgLength > msgCount && isContentInvisible(ul);
    msgCount = msgLength;
  };

  afterUpdate(() => {
    if (ul && !userScroll) {
      scrollToBottom();
    }
  });

  $: handleNewContent(messages.length, userScroll);

  const getName = (userId: string): string => {
    if (userId === loggedUserId) return ownMessageAuthor;
    return participants.get(userId) ?? userId;
  };
</script>

<svelte:window on:resize={handleScroll} />
<ul
  on:scroll={handleScroll}
  class="relative flex h-full flex-col gap-5 overflow-y-auto overflow-x-hidden scroll-smooth"
  bind:this={ul}
>
  {#if alertMessage}
    <button
      class="fixed right-8 top-6 inline-block aspect-square cursor-pointer rounded-full bg-green-600 text-3xl font-thin text-white shadow-sm"
      title={newMessagesInvisible}
      transition:fade={{ duration: 100 }}
      on:click={scrollToBottom}
    >
      <Icon icon={exclamationIcon} />
    </button>
  {/if}
  {#each messages as { userId, createdAt, message, id } (id)}
    {@const ownMessage = userId === loggedUserId}
    <li
      in:fly={{ duration: 300, x: (ownMessage ? 1 : -1) * 400, easing: cubicOut }}
      class={`max-w-[75%] ${ownMessage ? "ml-auto" : "mr-auto"}`}
    >
      <Message author={getName(userId)} {createdAt} {message} />
    </li>
  {/each}
</ul>

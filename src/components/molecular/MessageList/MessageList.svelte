<script lang="ts">
  import { fly } from "svelte/transition";
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import Message from "../Message/Message.svelte";
  import type { MessageDto } from "../../../../db/postgres";
  import { cubicOut } from "svelte/easing";

  export let loggedUserId: string;
  export let messages: MessageDto[];
  export let participants: Map<string, string>;
  export let transitionsEnabled: boolean = true;

  const getName = (userId: string): string => {
    if (userId === loggedUserId) return CONVERSATION_MESSAGES.ownMessageAuthor;
    return participants.get(userId) ?? userId;
  };
</script>

<ul class="flex flex-col gap-5 overflow-x-hidden">
  {#each messages as { userId, createdAt, message, id } (id)}
    {@const ownMessage = userId === loggedUserId}
    <li
      in:fly={{
        duration: transitionsEnabled ? 300 : 0,
        x: (ownMessage ? 1 : -1) * 400,
        easing: cubicOut
      }}
      class={`max-w-[75%] ${ownMessage ? "ml-auto" : "mr-auto"}`}
    >
      <Message author={getName(userId)} {createdAt} {message} />
    </li>
  {/each}
</ul>

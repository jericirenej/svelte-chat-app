<script lang="ts">
  import type { MessageDto } from "../../../../db/postgres/types";
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import Message from "../Message/Message.svelte";
  export let loggedUserId: string;
  export let messages: MessageDto[];
</script>

<ul class="flex flex-col gap-5">
  {#each messages as { userId, createdAt, message }}
    {@const author = userId === loggedUserId ? CONVERSATION_MESSAGES.ownMessage : userId}
    <li class="grid list-none grid-cols-2 gap-3">
      {#if userId === loggedUserId}
        <div></div>
      {/if}
      <Message {author} {createdAt} {message} />
      {#if userId !== loggedUserId}
        <div></div>
      {/if}
    </li>
  {/each}
</ul>

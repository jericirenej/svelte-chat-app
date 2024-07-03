<script lang="ts">
  import { getParticipant } from "$lib/client/participant-map";
  import { cubicOut } from "svelte/easing";
  import { fly } from "svelte/transition";
  import type { MessageDto } from "../../../../db/postgres";
  import Message from "../Message/Message.svelte";

  export let loggedUserId: string;
  export let messages: MessageDto[];
  export let participants: Map<string, string>;
  export let transitionsEnabled: boolean = true;
</script>

<ul class="flex flex-col gap-5 overflow-x-hidden">
  {#each messages as { userId, createdAt, message, id } (id)}
    {@const self = userId === loggedUserId}
    <li
      in:fly={{
        duration: transitionsEnabled ? 300 : 0,
        x: (self ? 1 : -1) * 400,
        easing: cubicOut
      }}
      class={`max-w-[75%] ${self ? "ml-auto" : "mr-auto"}`}
    >
      <Message author={getParticipant(participants, userId, loggedUserId)} {createdAt} {message} />
    </li>
  {/each}
</ul>

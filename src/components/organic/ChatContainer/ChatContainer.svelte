<script lang="ts">
  import { participantName } from "$lib/utils";
  import type { SingleChatData } from "../../../types";
  import TypingIndicator from "../../atomic/TypingIndicator/TypingIndicator.svelte";
  import SendMessage, {
    type SendMessageHandler,
    type SendOnInput
  } from "../../molecular/SendMessage/SendMessage.svelte";
  import MessageContainer, {
    type MessageLoadPrevious
  } from "../MessageContainer/MessageContainer.svelte";

  export let userId: string;
  export let data: SingleChatData;
  export let usersTyping: string | undefined = undefined;
  export let sendMessage: SendMessageHandler;
  export let onInput: SendOnInput;
  export let loadPrevious: MessageLoadPrevious;
  let value = "";

  export const resetMessage = () => {
    value = "";
  };

  $: participants = new Map(data.participants.map((p) => [p.id, participantName(p)]));
</script>

<div class="flex h-full w-full flex-col justify-between gap-4 overflow-y-auto">
  <MessageContainer
    messages={data.messages}
    loggedUserId={userId}
    {participants}
    total={data.total}
    {loadPrevious}
  />
  <div class="relative mt-6 pb-2">
    <div class="absolute bottom-[115%] right-16">
      <TypingIndicator {usersTyping} />
    </div>
    <div class="pr-2">
      <SendMessage {sendMessage} {onInput} bind:value />
    </div>
  </div>
</div>

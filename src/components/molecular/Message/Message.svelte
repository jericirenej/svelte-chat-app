<script lang="ts">
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import MessageDate from "../MessageDate/MessageDate.svelte";

  export let message: string;
  export let author: string | undefined = undefined;
  export let date: Date | number;
  const { from, message: messageLabel, publishedAt } = CONVERSATION_MESSAGES;
  $: paragraphs = message.split("\n");
</script>

<div class="flex w-fit max-w-[75%] flex-col gap-4 rounded-md bg-sky-700/15 px-3 py-2 text-sm">
  <article aria-label={messageLabel} class=" flex flex-col gap-2">
    {#each paragraphs as line}
      <p>{line}</p>
    {/each}
  </article>
  <footer class="flex items-center justify-between text-ellipsis text-[12px] text-gray-600">
    {#if author}
      <span aria-label={from}>{author}</span>
    {/if}
    <span aria-label={publishedAt} class="ml-auto">
      <MessageDate {date} />
    </span>
  </footer>
</div>

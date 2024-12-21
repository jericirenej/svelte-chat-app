<script lang="ts">
  import { CONVERSATION_MESSAGES } from "../../../messages";
  import Avatar from "../../atomic/Avatar/Avatar.svelte";
  import MessageDate from "../MessageDate/MessageDate.svelte";

  export let message: string;
  export let author: string | undefined = undefined;
  export let avatar: string | undefined = undefined;
  export let createdAt: Date | number;
  const { message: messageLabel, from, publishedAt } = CONVERSATION_MESSAGES;
  $: paragraphs = message.split("\n");
</script>

<section class="flex w-fit flex-col gap-4 rounded-md bg-sky-700/15 px-3 py-2 text-sm">
  <article aria-label={messageLabel} class=" flex flex-col gap-2">
    {#each paragraphs as line}
      <p>{line}</p>
    {/each}
  </article>
  <footer class="flex items-start justify-between gap-8 text-ellipsis text-[12px] text-gray-600">
    {#if author}
      <div class="flex items-center gap-2" aria-label={from}>
        {#if avatar}
          <Avatar src={avatar} name={author} size={20} />
        {/if}
        <span class="overflow-hidden text-ellipsis whitespace-nowrap text-nowrap">{author}</span>
      </div>
    {/if}
    <div class="ml-auto" aria-label={publishedAt}>
      <MessageDate date={createdAt} />
    </div>
  </footer>
</section>

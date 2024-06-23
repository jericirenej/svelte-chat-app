<script lang="ts">
  import ChatPreview from "../../molecular/ChatPreview/ChatPreview.svelte";

  export let chatPreviewList: { chatId: string; chatLabel: string; message: string }[];
</script>

<ul>
  {#each chatPreviewList as { chatLabel, message, chatId } (chatId)}
    <li class="border-b-2 border-t-2 p-2 pl-0 first:border-b-0 last:border-t-0">
      <ChatPreview {chatLabel} {message} />
    </li>
  {/each}
</ul>

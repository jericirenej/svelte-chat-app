<script lang="ts">
  import ChatPreview from "../../molecular/ChatPreview/ChatPreview.svelte";
  type ChatPreviewProp = {
    chatId: string;
    chatLabel: string;
    unreadMessages: number;
    message: string;
  }[];

  export let chatPreviewList: ChatPreviewProp;
</script>

<ul>
  {#each chatPreviewList as { chatLabel, message, unreadMessages, chatId } (chatId)}
    <li class="border-b-2 border-t-2 p-2 pl-0 first:border-b-0 last:border-t-0">
      <ChatPreview {chatLabel} {message} {unreadMessages} />
    </li>
  {/each}
</ul>

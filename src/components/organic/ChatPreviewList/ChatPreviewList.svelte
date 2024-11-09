<script lang="ts">
  import type { UsersTyping } from "../../../types";
  import ChatPreview from "../../molecular/ChatPreview/ChatPreview.svelte";
  import type { ChatPreviewProp } from "./types";

  export let chatPreviewList: ChatPreviewProp[];
  export let chatUnreadList!: Record<string, number>;
  export let usersTyping: UsersTyping | undefined = undefined;
  export let routeId: string | null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let onDelete: (_id: string) => unknown;
  export let onActive: (_id: string) => unknown;
  let active: string | null = null;

  const reactOnRoute = (route: string | null, active: string | null) => {
    if (!route || !route.includes("chat")) {
      return null;
    }
    return active;
  };

  const handleActive = (id: string) => {
    active = id;
    onActive(id);
  };

  $: active = reactOnRoute(routeId, active);
</script>

<ul>
  {#each chatPreviewList as { chatLabel, message, chatId } (chatId)}
    <li
      class="b border-b-[1px] border-t-[1px] py-4 pl-0 pr-2 hover:bg-neutral-200 hover:bg-opacity-50"
      class:active={active === chatId}
    >
      <div class="px-3">
        <ChatPreview
          onDelete={() => onDelete(chatId)}
          on:click={() => {
            handleActive(chatId);
          }}
          on:keydown={(e) => {
            if (e.key === "Enter") {
              handleActive(chatId);
            }
          }}
          {chatLabel}
          {message}
          labelOverride={usersTyping?.[chatId]?.label}
          unreadMessages={chatUnreadList[chatId]}
        />
      </div>
    </li>
  {/each}
</ul>

<style lang="css">
  li:not(:first-child) {
    border-top: none;
  }
  .active {
    background-color: hsla(0deg, 0%, 85%, 75%);
  }
</style>

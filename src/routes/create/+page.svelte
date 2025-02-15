<script lang="ts">
  import { page } from "$app/stores";

  import { createChatHandler } from "$lib/client/chat-handlers";
  import type { CreateChatResponseData } from "$lib/client/createChat.types";
  import { createChatCall } from "$lib/client/session-handlers";
  import type { SubmitFunction } from "@sveltejs/kit";
  import ChatCreate from "../../components/organisms/ChatCreate/ChatCreate.svelte";
  import { CREATE_CHAT } from "../../messages";
  import type { Entity } from "../../types";
  import type { PageData } from "./$types.js";
  export let data: PageData;

  const handlePostCall = async (input: Parameters<SubmitFunction>[0]) => {
    return await createChatCall(input);
  };

  const handleSuccess = async ({ id, chatLabel, participants }: CreateChatResponseData) => {
    await createChatHandler(id, chatLabel, participants);
  };

  const performUserSearch = async (term: string, excludedIds: string[] = []) => {
    const url = new URL(`${$page.url.origin}/api/search/user/${term}`);
    url.searchParams.set(
      "excluded",
      [...new Set([...excludedIds, data.user?.id])].filter(Boolean).join(",")
    );
    const response = await fetch(url.href);
    const body = (await response.json()) as { data: Entity[] };
    return body.data;
  };
</script>

<svelte:head><title>{CREATE_CHAT.pageTitle}</title></svelte:head>
<ChatCreate formData={data.form} {performUserSearch} postCall={handlePostCall} {handleSuccess} />

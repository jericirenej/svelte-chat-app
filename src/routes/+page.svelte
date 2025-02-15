<script lang="ts">
  import { setPreviewAndUnreadOnLoad } from "$lib/client/chat-handlers";
  import { onMount } from "svelte";
  import RootHeading from "../components/atoms/RootHeading/RootHeading.svelte";
  import type { PageData } from "./$types.js";
  import { fade } from "svelte/transition";

  export let data: PageData;

  $: name = data.user?.name ?? data.user?.username;

  onMount(() => {
    setPreviewAndUnreadOnLoad(data);
  });
</script>

<svelte:head>
  <title>Chat App</title>
</svelte:head>
<div class="flex w-full flex-col justify-center">
  {#if data.user}
    <div in:fade class="flex w-full flex-col items-center gap-3">
      <RootHeading />
      <p class="text-center font-semibold">Welcome {name}!</p>
    </div>
  {/if}
</div>

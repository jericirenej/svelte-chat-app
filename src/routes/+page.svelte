<script lang="ts">
  import { fade } from "svelte/transition";
  import RootHeading from "../components/atomic/RootHeading/RootHeading.svelte";
  import type { PageData } from "./$types.js";

  export let data: PageData;
</script>

<svelte:head>
  <title>Chat App</title>
</svelte:head>
<div class="flex w-full flex-col justify-center">
  {#if data.user}
    <div in:fade class="flex w-full flex-col items-center gap-3">
      <RootHeading />
      <p class="font-bold">Welcome {data.user.name}!</p>
    </div>
  {/if}
</div>

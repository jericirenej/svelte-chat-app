<script lang="ts">
  import type { PageData } from "./$types.js";

  export let data: PageData;
</script>

<h1>Welcome to Chat app</h1>
{#if data.user}
  <p>Welcome {data.user.name}!</p>
{:else}
  <p>Please <a href="/login">login</a></p>
{/if}

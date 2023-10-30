<script lang="ts">
  import type { PageData } from "./$types.js";

  export let data: PageData;
</script>

<div>
  <h1>Welcome to Chat app</h1>
  {#if data.user}
    <p>Welcome {data.user.name}!</p>
  {:else}
    <p>Please <a href="/login">login</a></p>
  {/if}
</div>

<style lang="scss">
  div {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
  }
</style>

<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { loginCall } from "$lib/client/session-handlers";
  import { onMount } from "svelte";
  import LoginForm from "../../components/organic/LoginForm/LoginForm.svelte";
  import { LOGIN_MESSAGES } from "../../messages";
  import type { PageData } from "./$types.js";

  export let data: PageData;

  onMount(async () => {
    await invalidateAll();
  });
</script>

<svelte:head><title>{LOGIN_MESSAGES.pageTitle}</title></svelte:head>
<LoginForm formData={data.form} postCall={loginCall} />

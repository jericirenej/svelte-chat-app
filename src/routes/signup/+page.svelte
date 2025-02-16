<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { signupCall } from "$lib/client/session-handlers";
  import { onMount } from "svelte";
  import SignupForm from "../../components/organisms/SignupForm/SignupForm.svelte";
  import { SIGNUP_MESSAGES } from "../../messages";
  import type { PageData } from "./$types";

  export let data: PageData;

  onMount(async () => {
    await invalidateAll();
  });
</script>

<svelte:head><title>{SIGNUP_MESSAGES.pageTitle}</title></svelte:head>
<SignupForm formData={data.form} postCall={signupCall} />

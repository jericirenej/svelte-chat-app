<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { handleFormResult } from "$lib/client/session-handlers";
  import { debounce, promisifiedTimeout } from "$lib/utils.js";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { superForm } from "sveltekit-superforms/client";
  import RootHeading from "../../components/atomic/RootHeading/RootHeading.svelte";
  import FormWrapper from "../../components/organic/FormWrapper/FormWrapper.svelte";
  import LoginControls from "../../components/organic/LoginControls/LoginControls.svelte";
  import { loginSchema } from "../../lib/client/login-signup-validators.js";
  import type { PageData } from "./$types.js";

  export let data: PageData;

  let isLoading = false;
  let submitDisabled = true;
  let status: 200 | 404 | undefined = undefined;

  const submitDisabledToggle = debounce(async () => {
    const { valid } = await validate();
    submitDisabled = !valid;
  }, 150);

  const handleInput = async () => {
    submitDisabledToggle();
    status = undefined;
  };

  const { form, enhance, validate } = superForm(data.form, {
    onSubmit: async () => {
      isLoading = true;
    },
    validators: loginSchema,
    customValidity: true,
    onResult: async (event) => {
      isLoading = false;
      status = handleFormResult(event, $page.url.origin);
      // Delay for successful login, so that the user is informed before redirect
      if (status === 200) {
        await promisifiedTimeout(1500);
      }
    }
  });

  onMount(async () => await invalidateAll());
</script>

<svelte:head><title>Chat App - Login</title></svelte:head>
<FormWrapper formTitle="Sign in" subtitle="...and start chatting!">
  <form slot="form" method="POST" use:enhance in:fade>
    <LoginControls
      bind:username={$form.username}
      bind:password={$form.password}
      {isLoading}
      onInput={handleInput}
      {status}
      {submitDisabled}
    />
  </form>
  <RootHeading slot="footer" />
</FormWrapper>

<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { page } from "$app/stores";
  import { handleFormResult } from "$lib/client/form-result-handlers";
  import { debounce, promisifiedTimeout } from "$lib/utils.js";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { superForm } from "sveltekit-superforms/client";
  import RootHeading from "../../components/atomic/RootHeading/RootHeading.svelte";
  import LoginControls from "../../components/organic/LoginControls.svelte";
  import { loginSchema } from "../../lib/client/login-signup-validators.js";
  import type { PageData } from "./$types.js";

  export let data: PageData;
  let isLoading = false;


  let submitDisabled = true;

  let status: 200 | 404 | undefined = undefined;

  const { form, enhance, validate } = superForm(data.form, {
    onSubmit: async () => {
      isLoading = true;
    },
    validators: loginSchema,
    customValidity: true,
    onResult: async (event) => {
      isLoading = false;
      const result = handleFormResult(event, $page.url.origin);
      console.log(result);
      status = result;
      // Delay for successful login, so that the user is informed before redirect
      if (status === 200) {
        await promisifiedTimeout(1500);
      }
    }
  });

  const submitDisabledToggle = debounce(async () => {
    const { valid } = await validate();
    submitDisabled = !valid;
  }, 150);

  const handleInput = async () => {
    submitDisabledToggle();
    status = undefined;
  };

  onMount(async () => await invalidateAll());
</script>

<svelte:head><title>Chat App - Login</title></svelte:head>
<div
  class="absolute left-1/2 top-[30%] flex -translate-x-1/2 -translate-y-[30%] flex-col items-center justify-center"
>
  <div class="mb-8 flex flex-col items-center gap-1">
    <h1 class="text-[2rem] font-light uppercase leading-7 text-sky-800">Sign in</h1>
    <span class="text-sm font-normal text-sky-800">...and start chatting!</span>
  </div>
  <form method="POST" use:enhance in:fade>
    <LoginControls
      bind:username={$form.username}
      bind:password={$form.password}
      {isLoading}
      onInput={handleInput}
      {status}
      {submitDisabled}
    />
  </form>
  <div class="mt-10">
    <RootHeading />
  </div>
</div>

<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { signupSchema } from "$lib/client/login-signup-validators";
  import { handleFormResult } from "$lib/client/session-handlers";
  import { debounce, promisifiedTimeout } from "$lib/utils";
  import { onMount } from "svelte";
  import { superForm } from "sveltekit-superforms";
  import { zodClient } from "sveltekit-superforms/adapters";
  import FormFooter from "../../components/molecular/FormFooter/FormFooter.svelte";
  import FormWrapper from "../../components/molecular/wrappers/FormWrapper/FormWrapper.svelte";
  import SignupControls from "../../components/organic/SignupControls/SignupControls.svelte";
  import { LOGIN_ROUTE } from "../../constants";
  import { SIGNUP_MESSAGES } from "../../messages";
  import type { PageData } from "./$types";
  const { login, pageTitle, subtitle, title: formTitle } = SIGNUP_MESSAGES;

  export let data: PageData;

  let isLoading = false;
  let submitDisabled = true;
  let status: 200 | 400 | 409 | 500 | undefined = undefined;

  const submitDisabledToggle = debounce(async () => {
    const { valid } = await validateForm();
    submitDisabled = !valid;
  }, 50);
  const handleInput = () => {
    submitDisabledToggle();
    status = undefined;
  };

  const { form, enhance, validateForm } = superForm(data.form, {
    onSubmit: () => {
      isLoading = true;
    },
    validators: zodClient(signupSchema),
    customValidity: true,
    onResult: async (event) => {
      isLoading = false;
      status = handleFormResult(event) as typeof status;
      // Delay for successful login, so that the user is informed before redirect
      if (status === 200) {
        await promisifiedTimeout(1500);
      }
    }
  });
  onMount(async () => {
    await invalidateAll();
  });
</script>

<svelte:head><title>{pageTitle}</title></svelte:head>
<FormWrapper {formTitle} {subtitle}>
  <form slot="form" method="POST" use:enhance>
    <SignupControls
      bind:username={$form.username}
      bind:password={$form.password}
      bind:verifyPassword={$form.verifyPassword}
      bind:email={$form.email}
      bind:name={$form.name}
      bind:surname={$form.surname}
      onInput={handleInput}
      {isLoading}
      {status}
      {submitDisabled}
    />
  </form>
  <svelte:fragment slot="footer">
    <FormFooter link={LOGIN_ROUTE} label={login} />
  </svelte:fragment>
</FormWrapper>

<script lang="ts">
  import { enhance } from "$app/forms";
  import FormFooter from "../../components/molecular/FormFooter/FormFooter.svelte";
  import FormWrapper from "../../components/molecular/wrappers/FormWrapper/FormWrapper.svelte";
  import SignupControls from "../../components/organic/SignupControls/SignupControls.svelte";
  import { LOGIN_ROUTE } from "../../constants";
  import { SIGNUP_MESSAGES } from "../../messages";
  const { login, pageTitle, subtitle, title: formTitle } = SIGNUP_MESSAGES;

  const handleInput = async () => {};
  let obj = { username: "", email: "", password: "", name: "", surname: "" };
</script>

<svelte:head><title>{pageTitle}</title></svelte:head>
<FormWrapper {formTitle} {subtitle}>
  <form slot="form" method="POST" use:enhance>
    <SignupControls
      bind:username={obj.username}
      bind:password={obj.password}
      bind:email={obj.email}
      bind:name={obj.name}
      bind:surname={obj.surname}
      onInput={handleInput}
    />
  </form>
  <svelte:fragment slot="footer">
    <FormFooter link={LOGIN_ROUTE} label={login} />
  </svelte:fragment>
</FormWrapper>

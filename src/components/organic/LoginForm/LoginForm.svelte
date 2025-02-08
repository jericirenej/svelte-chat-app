<script lang="ts">
  import { loginSchema, type LoginFormData } from "$lib/client/login-signup.validators";
  import { handleLoginResult } from "$lib/client/session-handlers";
  import { debounce } from "$lib/utils.js";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { superForm } from "sveltekit-superforms/client";
  import { SIGNUP_ROUTE } from "../../../constants";
  import { LOGIN_MESSAGES } from "../../../messages";
  import Input from "../../atomic/Input/Input.svelte";
  import FormFooter from "../../molecular/FormFooter/FormFooter.svelte";
  import SubmitButton from "../../molecular/SubmitButton/SubmitButton.svelte";
  import ControlWrapper from "../../molecular/wrappers/ControlsWrapper/ControlsWrapper.svelte";
  import FormWrapper from "../../molecular/wrappers/FormWrapper/FormWrapper.svelte";

  export let formData: LoginFormData;
  export let postCall: (input: Parameters<SubmitFunction>[0]) => Promise<Response>;
  let isLoading = false;
  let submitDisabled = true;
  let status: 200 | 404 | undefined = undefined;
  const { subtitle, signup, title: formTitle } = LOGIN_MESSAGES;

  const submitDisabledToggle = debounce(async () => {
    const { valid } = await validateForm();

    submitDisabled = !valid;
  }, 50);

  const handleInput = () => {
    submitDisabledToggle();
    status = undefined;
  };

  const { form, enhance, validateForm } = superForm(formData, {
    onSubmit: ({ customRequest }) => {
      isLoading = true;
      customRequest(postCall);
    },
    validators: zodClient(loginSchema),
    customValidity: true,
    onResult: (event) => {
      isLoading = false;
      status = handleLoginResult(event) as typeof status;
    }
  });
  const {
    failure: loginFailure,
    passwordPlaceholder,
    usernamePlaceholder,
    supplyDetailsTitle
  } = LOGIN_MESSAGES;
</script>

<FormWrapper {formTitle} {subtitle}>
  <form slot="form" method="POST" use:enhance>
    <ControlWrapper>
      <svelte:fragment slot="inputs">
        <Input
          label="Username"
          placeholder={usernamePlaceholder}
          name="username"
          type="text"
          input={handleInput}
          bind:value={$form.username}
        />
        <Input
          label="Password"
          placeholder={passwordPlaceholder}
          name="password"
          type="password"
          input={handleInput}
          bind:value={$form.password}
        />
      </svelte:fragment>
      <svelte:fragment slot="controls">
        <SubmitButton
          disabled={submitDisabled}
          text="SUBMIT"
          {isLoading}
          title={submitDisabled ? supplyDetailsTitle : ""}
          config={{ display: "block" }}
          submitStatus={status === 200 ? "success" : "error"}
          submitMessage={status === 404 ? loginFailure : undefined}
        />
      </svelte:fragment>
    </ControlWrapper>
  </form>
  <svelte:fragment slot="footer">
    <FormFooter link={SIGNUP_ROUTE} label={signup} />
  </svelte:fragment>
</FormWrapper>

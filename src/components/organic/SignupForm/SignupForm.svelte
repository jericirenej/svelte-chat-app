<script lang="ts">
  import { signupSchema, type SignupFormData } from "$lib/client/login-signup.validators";
  import { handleLoginResult } from "$lib/client/session-handlers";
  import { debounce, promisifiedTimeout } from "$lib/utils";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { onMount } from "svelte";
  import type { Writable } from "svelte/store";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { superForm } from "sveltekit-superforms/client";
  import { AVATAR_SIZE_LIMIT, LOGIN_ROUTE } from "../../../constants";
  import { SIGNUP_MESSAGES as MSG, SIGNUP_MESSAGES } from "../../../messages";
  import type { Maybe } from "../../../types";
  import Input from "../../atomic/Input/Input.svelte";
  import FormFooter from "../../molecular/FormFooter/FormFooter.svelte";
  import SubmitButton from "../../molecular/SubmitButton/SubmitButton.svelte";
  import ControlsWrapper from "../../molecular/wrappers/ControlsWrapper/ControlsWrapper.svelte";
  import FormWrapper from "../../molecular/wrappers/FormWrapper/FormWrapper.svelte";
  import AddAvatar, { avatarBlob } from "../AddAvatar/AddAvatar.svelte";

  const { login, subtitle, title: formTitle } = SIGNUP_MESSAGES;

  export let formData: SignupFormData;
  export let postCall: (input: Parameters<SubmitFunction>[0]) => Promise<Response>;

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

  const { form, enhance, validateForm } = superForm(formData, {
    onSubmit: ({ customRequest, formData }) => {
      isLoading = true;
      if ($form.avatar) {
        formData.append("avatar", $form.avatar);
      }
      customRequest(postCall);
    },
    validators: zodClient(signupSchema),
    customValidity: true,
    onResult: async (event) => {
      isLoading = false;
      status = handleLoginResult(event) as typeof status;
      // Delay for successful login, so that the user is informed before redirect
      if (status === 200) {
        await promisifiedTimeout(1500);
      }
    }
  });

  const defaultMessage = {
    200: MSG.success,
    400: MSG.badRequestFailure,
    409: MSG.duplicateFailure,
    500: MSG.failure
  };

  onMount(() => {
    const avatarFileSub = (avatarBlob as Writable<Maybe<Blob>>).subscribe((blob) => {
      $form.avatar = blob ?? undefined;
      handleInput();
    });
    return () => {
      avatarFileSub();
    };
  });
</script>

<FormWrapper {formTitle} {subtitle}>
  <form slot="form" enctype="multipart/form-data" method="POST" use:enhance>
    <ControlsWrapper>
      <svelte:fragment slot="inputs">
        <Input
          label="Username"
          placeholder={MSG.usernamePlaceholder}
          name="username"
          type="text"
          input={handleInput}
          bind:value={$form.username}
        />
        <Input
          label="Email"
          placeholder={MSG.emailPlaceholder}
          name="email"
          type="text"
          input={handleInput}
          bind:value={$form.email}
        />
        <Input
          label="Password"
          placeholder={MSG.passwordPlaceholder}
          name="password"
          type="password"
          input={handleInput}
          bind:value={$form.password}
        />
        <Input
          label="Verify password"
          placeholder={MSG.passwordVerifyPlaceholder}
          name="verifyPassword"
          type="password"
          input={handleInput}
          bind:value={$form.verifyPassword}
        />
        <div class="flex gap-2">
          <div class="flex flex-col gap-4">
            <Input
              label={MSG.namePlaceholder}
              placeholder={MSG.namePlaceholder}
              name="name"
              type="text"
              input={handleInput}
              bind:value={$form.name}
            />
            <Input
              label={MSG.surnamePlaceholder}
              placeholder={MSG.surnamePlaceholder}
              name="surname"
              type="text"
              input={handleInput}
              bind:value={$form.surname}
            />
          </div>
          <AddAvatar sizeLimit={AVATAR_SIZE_LIMIT} />
        </div>
      </svelte:fragment>
      <svelte:fragment slot="controls">
        <SubmitButton
          disabled={submitDisabled}
          text="SUBMIT"
          {isLoading}
          title={submitDisabled ? MSG.supplyDetailsTitle : ""}
          config={{ display: "block" }}
          submitStatus={status === 200 ? "success" : "error"}
          submitMessage={status ? defaultMessage[status] : undefined}
        />
      </svelte:fragment>
    </ControlsWrapper>
  </form>
  <svelte:fragment slot="footer">
    <FormFooter link={LOGIN_ROUTE} label={login} />
  </svelte:fragment>
</FormWrapper>

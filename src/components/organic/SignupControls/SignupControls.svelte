<script lang="ts">
  import { SIGNUP_MESSAGES as MSG } from "../../../messages";
  import FormSubmitNotification from "../../atomic/FormSubmitNotification/FormSubmitNotification.svelte";
  import Input from "../../atomic/Input/Input.svelte";
  import SubmitButton from "../../molecular/SubmitButton/SubmitButton.svelte";
  import ControlsWrapper from "../../molecular/wrappers/ControlsWrapper/ControlsWrapper.svelte";

  export let username: string;
  export let password: string;
  export let email: string;
  export let name: string;
  export let surname: string;

  export let onInput: (ev?: Event) => unknown = () => {};
  export let isLoading = false;
  export let status: 200 | 404 | undefined = undefined;
  export let submitDisabled = false;

  const defaultMessage = {
    200: MSG.signupSuccess,
    404: MSG.signupFailure
  };
</script>

<ControlsWrapper>
  <svelte:fragment slot="inputs">
    <Input
      label="Username"
      placeholder={MSG.usernamePlaceholder}
      name="username"
      type="text"
      input={onInput}
      bind:value={username}
    />
    <Input
      label="Email"
      placeholder={MSG.emailPlaceholder}
      name="email"
      type="text"
      input={onInput}
      bind:value={email}
    />
    <Input
      label="Password"
      placeholder={MSG.passwordPlaceholder}
      name="password"
      type="password"
      input={onInput}
      bind:value={password}
    />
    <Input
      label="Name"
      placeholder={MSG.namePlaceholder}
      name="name"
      type="name"
      input={onInput}
      bind:value={name}
    />
    <Input
      label="Surname"
      placeholder={MSG.surnamePlaceholder}
      name="surname"
      type="surname"
      input={onInput}
      bind:value={surname}
    />
  </svelte:fragment>
  <svelte:fragment slot="controls">
    <SubmitButton
      disabled={submitDisabled}
      text="SUBMIT"
      {isLoading}
      title={submitDisabled ? MSG.supplyDetailsTitle : ""}
      config={{ display: "block" }}
    />
    <FormSubmitNotification
      status={status === 200 ? "success" : "error"}
      message={status ? defaultMessage[status] : undefined}
    />
  </svelte:fragment>
</ControlsWrapper>

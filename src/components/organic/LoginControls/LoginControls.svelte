<script lang="ts">
  import { LOGIN_MESSAGES } from "../../../messages";
  import Input from "../../atomic/Input/Input.svelte";
  import SubmitButton from "../../molecular/SubmitButton/SubmitButton.svelte";
  import ControlWrapper from "../../molecular/wrappers/ControlsWrapper/ControlsWrapper.svelte";

  export let username: string;
  export let password: string;
  export let onInput: (ev?: Event) => unknown = () => {};
  export let isLoading = false;
  export let status: 200 | 404 | undefined = undefined;
  export let submitDisabled = false;
  const {
    failure: loginFailure,
    passwordPlaceholder,
    usernamePlaceholder,
    supplyDetailsTitle
  } = LOGIN_MESSAGES;
</script>

<ControlWrapper>
  <svelte:fragment slot="inputs">
    <Input
      label="Username"
      placeholder={usernamePlaceholder}
      name="username"
      type="text"
      input={onInput}
      bind:value={username}
    />
    <Input
      label="Password"
      placeholder={passwordPlaceholder}
      name="password"
      type="password"
      input={onInput}
      bind:value={password}
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

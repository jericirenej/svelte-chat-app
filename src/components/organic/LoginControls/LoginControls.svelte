<script lang="ts">
  import { fade } from "svelte/transition";
  import Input from "../../atomic/Input/Input.svelte";
  import SubmitButton from "../../molecular/SubmitButton/SubmitButton.svelte";

  export let username: string;
  export let password: string;
  export let onInput: (ev?: Event) => unknown = () => {};
  let message: string | undefined = undefined;
  export let isLoading = false;
  export let status: 200 | 404 | undefined = undefined;
  export let submitDisabled = false;
  const defaultMessage = {
    200: "Login successful!",
    404: "Username or password not correct!"
  };
</script>

<div class="flex min-w-[30ch] flex-initial flex-col gap-4">
  <div class="flex flex-col gap-4">
    <Input
      label="Username"
      placeholder="Enter your username"
      name="username"
      type="text"
      input={onInput}
      bind:value={username}
    />
    <Input
      label="Password"
      placeholder="Enter your password"
      name="password"
      type="password"
      input={onInput}
      bind:value={password}
    />
  </div>
  <div class="relative pb-5">
    <SubmitButton
      disabled={submitDisabled}
      text="SUBMIT"
      {isLoading}
      title={submitDisabled ? "Please supply a username and password." : ""}
      config={{ display: "block" }}
    />
    {#if status}
      <small
        transition:fade={{ duration: 150 }}
        class={`
      absolute bottom-0 w-[100%]
      whitespace-nowrap
      text-center
      text-xs
      ${status === 200 ? "text-emerald-500" : "text-red-600"}
      `}>{message ?? defaultMessage[status]}</small
      >
    {/if}
  </div>
</div>

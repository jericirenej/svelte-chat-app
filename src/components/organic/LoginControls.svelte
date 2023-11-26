<script lang="ts">
  import { fade } from "svelte/transition";
  import Input from "../atomic/Input/Input.svelte";
  import SubmitButton from "../molecular/SubmitButton/SubmitButton.svelte";

  export let username: string;
  export let password: string;
  export let onInput: (ev?: Event) => unknown = () => {};
  let message: string | undefined = undefined;
  export let isLoading = false;
  export let status: 200 | 404 | 400 | undefined = undefined;
  const defaultMessage = {
    200: "Login successful!",
    404: "Username or password not correct!",
    400: "Please supply a username and password"
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
    <div class={isLoading ? "loading relative" : ""}>
      <SubmitButton text="SUBMIT" {isLoading} config={{ display: "block" }} />
    </div>
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

<style>
  .loading {
    overflow: hidden;
  }
  .loading::after {
    position: absolute;
    content: "";
    left: -150%;
    height: 120%;
    width: 75%;
    bottom: 0;
    transform: skewX(-20deg);
    background-color: hsla(0deg, 0%, 100%, 20%);
    box-shadow: 0 0 10px 10px hsla(0deg, 0%, 100%, 20%);
    animation: swoosh 2s infinite;
  }
  @keyframes swoosh {
    from {
      left: -150%;
    }
    to {
      left: 150%;
    }
  }
</style>

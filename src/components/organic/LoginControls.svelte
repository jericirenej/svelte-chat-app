<script lang="ts">
  import { fade } from "svelte/transition";
  import Input from "../atomic/Input/Input.svelte";
  import SubmitButton from "../molecular/SubmitButton/SubmitButton.svelte";

  export let isLoading = false;
  export let status: "success" | "error" | undefined = undefined;
  const message = { success: "Login successful!", error: "Username or password not correct!" };
</script>

<div class="flex flex-initial flex-col gap-4">
  <div class="flex flex-col gap-4">
    <Input label="Username" placeholder="Enter your username" name="username" type="text" />
    <Input label="Password" placeholder="Enter your password" name="password" type="password" />
  </div>
  <div class="relative pb-5">
    <SubmitButton text="LOGIN" {isLoading} config={{ display: "block" }} />
    {#if status}
      <small
        transition:fade={{ duration: 150 }}
        class={`
      absolute bottom-0 text-xs
      left-[50%] translate-x-[-50%]
      ${status === "error" ? "text-red-600" : "text-emerald-500"}
      `}>{message[status]}</small
      >
    {/if}
  </div>
</div>

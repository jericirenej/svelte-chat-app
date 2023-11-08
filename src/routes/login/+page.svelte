<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { ActionResult } from "@sveltejs/kit";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { superForm } from "sveltekit-superforms/client";
  import LoginControls from "../../components/organic/LoginControls.svelte";
  import { LOCAL_SESSION_CSRF_KEY } from "../../constants.js";
  import type { ActionData, PageData } from "./$types.js";
  import { loginSchema } from "./login-form-validator.js";

  export let data: PageData;
  let isLoading = false;
  type FormResult<T extends Record<string, unknown> | null> = ActionResult<
    NonNullable<T>,
    NonNullable<T>
  >;

  let status: undefined | "success" | "error" = undefined;

  const handleInput = () => {
    status = undefined;
  };

  const { form, enhance } = superForm(data.form, {
    onSubmit: () => {
      isLoading = true;
    },
    validators: loginSchema,
    customValidity: true,
    onResult(event) {
      const result = event.result as FormResult<Required<ActionData>>;
      console.log(result.type);
      isLoading = false;
      if (result.type === "success" && result.data) {
        status = "success";
        const data = result.data;
        localStorage.setItem(LOCAL_SESSION_CSRF_KEY, data.csrfToken);
      } else {
        status = "error";
      }
    }
  });

  onMount(async () => await invalidateAll());
</script>

<div
  class="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-[30%] flex flex-col justify-center items-center"
>
  <div class="flex flex-col items-center gap-1 mb-8">
    <h1 class="text-[2rem] font-light text-sky-800 uppercase leading-7">Sign in</h1>
    <span class="text-sm font-normal text-sky-800">And start chatting!</span>
  </div>
  <form method="POST" use:enhance transition:fade>
    <LoginControls
      bind:username={$form.username}
      bind:password={$form.password}
      {isLoading}
      onInput={handleInput}
      {status}
    />
  </form>
</div>

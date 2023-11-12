<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { ActionResult } from "@sveltejs/kit";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { superForm } from "sveltekit-superforms/client";
  import LoginControls from "../../components/organic/LoginControls.svelte";
  import { LOCAL_SESSION_CSRF_KEY } from "../../constants.js";
  import { promisifiedTimeout } from "../../lib/shared/utils.js";
  import type { ActionData, PageData } from "./$types.js";
  import { loginSchema } from "./login-form-validator.js";

  export let data: PageData;
  let isLoading = false;
  type FormResult<T extends Record<string, unknown> | null> = ActionResult<
    NonNullable<T>,
    NonNullable<T>
  >;

  let status: undefined | "success" | "error" = undefined;

  const { form, enhance } = superForm(data.form, {
    onSubmit: () => {
      isLoading = true;
    },
    validators: loginSchema,
    customValidity: true,
    onResult: async (event) => {
      const result = event.result as FormResult<Required<ActionData>>;
      isLoading = false;
      if (result.type === "success" && result.data) {
        status = "success";
        const data = result.data;

        localStorage.setItem(LOCAL_SESSION_CSRF_KEY, data.csrfToken);
        await promisifiedTimeout(1500);
      } else {
        status = "error";
      }
    }
  });

  const handleInput = () => {
    status = undefined;
  };

  onMount(async () => await invalidateAll());
</script>

<div
  class="absolute left-1/2 top-[30%] flex -translate-x-1/2 -translate-y-[30%] flex-col items-center justify-center"
>
  <div class="mb-8 flex flex-col items-center gap-1">
    <h1 class="text-[2rem] font-light uppercase leading-7 text-sky-800">Sign in</h1>
    <span class="text-sm font-normal text-sky-800">And start chatting!</span>
  </div>
  <form method="POST" use:enhance in:fade>
    <LoginControls
      bind:username={$form.username}
      bind:password={$form.password}
      {isLoading}
      onInput={handleInput}
      {status}
    />
  </form>
</div>

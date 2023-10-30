<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { ActionResult } from "@sveltejs/kit";
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import { superForm } from "sveltekit-superforms/client";
  import { LOCAL_SESSION_CSRF_KEY } from "../../constants.js";
  import { capitalize } from "../../utils/text-utils.js";
  import type { ActionData, PageData } from "./$types.js";

  export let data: PageData;
  type FormResult<T extends Record<string, unknown> | null> = ActionResult<
    NonNullable<T>,
    NonNullable<T>
  >;

  let showResultMessage = false;

  const handleInput = () => {
    if (showResultMessage) showResultMessage = false;
  };

  const { form, errors, constraints, enhance, message, validate } = superForm(data.form, {
    onResult(event) {
      const result = event.result as FormResult<Required<ActionData>>;
      showResultMessage = true;
      if (result.type === "success" && result.data) {
        const data = result.data;
        localStorage.setItem(LOCAL_SESSION_CSRF_KEY, data.csrfToken);
      }
    }
  });

  const typeAction = (node: HTMLInputElement, type: "text" | "password") => {
    node.type = type;
  };

  const formInputs = [
    { type: "text", name: "username" },
    { type: "password", name: "password" }
  ] as const;

  onMount(async () => await invalidateAll());
</script>

<div class="wrapper">
  <form method="POST" use:enhance transition:fade>
    <h1>LOGIN</h1>
    {#each formInputs as { name, type }}
      <section>
        <div class="input-wrapper">
          <input
            id={name}
            {name}
            use:typeAction={type}
            aria-label={capitalize(name)}
            aria-invalid={$errors[name] ? "true" : undefined}
            bind:value={$form[name]}
            on:input={handleInput}
            {...$constraints[name]}
          />
          <div aria-hidden={true}>{capitalize(name)}</div>
          {#if $errors[name]}
            <small class="invalid-field">{$errors[name]}</small>
          {/if}
        </div>
      </section>
    {/each}
    <div class="submit-wrapper">
      <button type="submit">Login</button>
      {#if showResultMessage}
        {#if $errors?._errors?.length}
          <small class="submission-result invalid">{$errors._errors[0]}</small>
        {:else if !Object.keys($errors).length}
          <small class="submission-result valid">Login successful!</small>
        {/if}
      {/if}
    </div>
  </form>
</div>

<style lang="scss">
  .wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    justify-content: center;
    & > * {
      font-family: "Poppins", sans-serif;
    }
  }
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    font-size: 13px;
    padding: 2rem;
    outline: 1px solid gray;
    border-radius: 5px;
    width: 500px;
  }
  .submit-wrapper {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: end;
    align-items: center;
    gap: 1rem;
  }

  h1 {
    user-select: none;
  }

  h1 {
    margin-top: 0;
  }

  section {
    width: 100%;
    margin-bottom: 15px;
  }

  .input-wrapper {
    position: relative;
  }
  input {
    padding-block: 5px;
    width: 100%;
  }

  .submission-result {
    font-size: 11px;
    position: absolute;
    top: 110%;
    text-justify: center;
    &.invalid {
      color: hsl(0, 75%, 60%);
    }
    &.valid {
      color: hsl(140deg, 70%, 50%);
    }
  }
  .invalid-field {
    font-size: 11px;
    color: hsl(0, 75%, 60%);
    position: absolute;
    top: 100%;
    left: 0;
  }
  button {
    outline: 1px solid var(--almost-black, black);
    border: none;
    background-color: white;
    border-radius: 3px;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.05ch;
    text-transform: uppercase;
    color: var(--almost-black, black);
    width: 100%;
    padding: 5px 15px;
    transition: color 0.2s ease-out, background-color 0.2s ease-out;
    align-self: flex-end;
    &:hover,
    &:active,
    &:focus {
      background-color: var(--almost-black, black);
      color: white;
    }
  }
</style>

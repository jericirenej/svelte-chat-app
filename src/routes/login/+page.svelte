<script lang="ts">
  import { goto } from "$app/navigation";
  import type { ActionResult } from "@sveltejs/kit";
  import { superForm } from "sveltekit-superforms/client";
  import SuperDebug from "sveltekit-superforms/client/SuperDebug.svelte";
  import { LOCAL_SESSION_CSRF_KEY } from "../../constants.js";
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
        setTimeout(() => goto("/"), 2000);
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
</script>

<SuperDebug data={$form} />
<div class="wrapper">
  <form method="POST" use:enhance>
    <h1>LOGIN</h1>
    {#each formInputs as { name, type }}
      <section>
        <label for={name}>{`${name[0].toUpperCase()}${name.slice(1)}`}</label>
        <div class="input-wrapper">
          <input
            id={name}
            {name}
            use:typeAction={type}
            aria-invalid={$errors[name] ? "true" : undefined}
            bind:value={$form[name]}
            on:input={handleInput}
            {...$constraints[name]}
          />
          {#if $errors[name]}
            <small class="invalid-field">{$errors[name]}</small>
          {/if}
        </div>
      </section>
    {/each}
    <div class="submit-wrapper">
      {#if showResultMessage}
        {#if $errors?._errors?.length}
          <small class="submission-result invalid">{$errors._errors[0]}</small>
        {:else if !Object.keys($errors).length}
          <small class="submission-result valid">Login successful!</small>
        {/if}
      {/if}
      <button type="submit">Login</button>
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
  }
  .submit-wrapper {
    display: flex;
    justify-content: end;
    align-items: center;
    gap: 1rem;
  }

  h1,
  label {
    user-select: none;
  }

  h1 {
    margin-top: 0;
  }

  section {
    display: grid;
    grid-template-columns: 10ch 1fr;
    gap: 1rem;
    align-items: center;
    margin-bottom: 15px;
  }

  .input-wrapper {
    position: relative;
  }
  input {
    padding-block: 5px;
  }

  .submission-result {
    font-size: 11px;
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
    width: fit-content;
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

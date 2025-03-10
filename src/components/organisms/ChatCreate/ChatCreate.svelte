<script lang="ts">
  import type { CreateChatFormData, CreateChatResponseData } from "$lib/client/createChat.types";
  import { createChatSchema } from "$lib/client/createChat.validator";
  import { debounce } from "$lib/utils";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { onMount } from "svelte";
  import { derived, writable } from "svelte/store";
  import { zodClient } from "sveltekit-superforms/adapters";
  import { superForm } from "sveltekit-superforms/client";
  import { CREATE_CHAT } from "../../../messages";
  import Input from "../../atoms/Input/Input.svelte";
  import SubmitButton from "../../molecules/SubmitButton/SubmitButton.svelte";
  import UserEntityList from "../../molecules/UserEntityList/UserEntityList.svelte";
  import ControlsWrapper from "../../molecules/wrappers/ControlsWrapper/ControlsWrapper.svelte";
  import FormWrapper from "../../molecules/wrappers/FormWrapper/FormWrapper.svelte";
  import EntityAutocomplete from "../EntityAutocomplete/EntityAutocomplete.svelte";
  import type { Entity } from "../../../types";
  export let performUserSearch: (term: string, excludedIds: string[]) => Promise<Entity[]>;
  export let handleSuccess: (data: CreateChatResponseData) => Promise<void>;

  export let formData: CreateChatFormData;
  export let postCall: (input: Parameters<SubmitFunction>[0]) => Promise<Response>;

  let isLoading = false;
  const entities = writable<Entity[]>([]);
  const participants = derived(entities, ($entities) => $entities.map(({ id }) => id));
  const pickUser = (entity: Entity): void => {
    entities.update((entities) => [...entities, entity]);
  };
  const removeUser = (userId: string): void => {
    entities.update((entities) => entities.filter(({ id }) => id !== userId));
  };
  let createDisabled = true;
  let isVisible = true;

  const { enhance, validateForm, form, errors, constraints } = superForm(formData, {
    dataType: "json",
    onSubmit: ({ customRequest }) => {
      isLoading = true;
      customRequest(postCall);
    },
    validators: zodClient(createChatSchema),
    customValidity: true,
    onResult: async (event) => {
      isLoading = false;
      isVisible = false;
      if (event.result.type === "success") {
        await handleSuccess(event.result.data as CreateChatResponseData);
      }
    }
  });

  const submitDisabledToggle = debounce(async () => {
    const { valid } = await validateForm();
    createDisabled = !valid;
  }, 20);
  const searchUsers = async (term: string) => {
    return performUserSearch(term, $participants);
  };
  onMount(() => {
    const participantSub = participants.subscribe((participants) => {
      $form.participants = participants;
      submitDisabledToggle();
    });
    return () => {
      participantSub();
    };
  });
</script>

{#if isVisible}
  <FormWrapper>
    <form slot="form" method="POST" use:enhance class="flex flex-col gap-2">
      <ControlsWrapper controlOnTop={true}>
        <svelte:fragment slot="inputs">
          <Input
            type="text"
            label={CREATE_CHAT.chatLabel}
            placeholder={CREATE_CHAT.chatLabel}
            name="chatLabel"
            errors={$errors.chatLabel}
            constraints={$constraints.chatLabel}
            input={submitDisabledToggle}
            bind:value={$form.chatLabel}
          />

          <EntityAutocomplete {pickUser} {searchUsers} errors={$errors.participants?._errors} />
          <div id="participant-list">
            <UserEntityList
              entities={$entities}
              removeAction={removeUser}
              animationDuration={200}
              staggeredAnimation={false}
            />
          </div>
        </svelte:fragment>
        <svelte:fragment slot="controls">
          <SubmitButton
            {isLoading}
            disabled={createDisabled}
            title={createDisabled ? CREATE_CHAT.supplyDetailsTitle : ""}
            text="Create chat"
            config={{ display: "block", variant: "outline", size: "md" }}
            >{CREATE_CHAT.submitText}</SubmitButton
          >
        </svelte:fragment>
      </ControlsWrapper>
    </form>
  </FormWrapper>
{/if}

<style lang="css">
  #participant-list:global(#participant-list li) {
    padding: 0;
    padding-block: 0.5rem;
    width: 98%;
    transform: translateX(2%);
  }
  #participant-list:global(#participant-list li:hover) {
    background-color: inherit;
  }
</style>

<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { handleDeleteAccountCall } from "$lib/client/session-handlers.js";
  import type { CompleteUserDto } from "../../../db/index.js";
  import Button from "../../components/atomic/Button/Button.svelte";
  import Dialog from "../../components/organic/Dialog/Dialog.svelte";
  import { PROFILE_MESSAGES } from "../../messages.js";
  import { capitalize } from "../../utils/text-utils.js";
  import type { PageData } from "./$types.js";
  export let data: PageData;

  const user = data.user as CompleteUserDto;
  const keys = Object.keys(user) as (keyof CompleteUserDto)[];
  const profileFields = keys
    .filter((key) => !["username", "avatar"].includes(key))
    .map((key) => ({
      label: key,
      value: user[key]
    }));
  const handleValue = (val: string | Date | null): string => {
    if (!val) return "Not given";
    if (val instanceof Date) return new Intl.DateTimeFormat(navigator.language).format(val);
    return val;
  };
  const { deleteButton, deleteDialogHeading, deleteMessage, pageTitle, deleteConfirm } =
    PROFILE_MESSAGES;

  let openDeleteDialog = false;
  const deleteProfile = async () => {
    await handleDeleteAccountCall();
    await invalidateAll();
    void goto("/");
  };
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>
<div class="flex h-full w-full flex-col items-center justify-center overflow-hidden px-3">
  <div class="flex flex-col justify-start">
    <div class="flex items-center gap-6 self-start">
      <h1 class="mb-5 text-[2rem] font-light uppercase leading-7 text-sky-800">Profile</h1>
      <div class="relative -top-2.5 flex w-fit items-center gap-2 text-lg">
        {#if user.avatar}
          <img
            class="inline-block aspect-square h-5 rounded-full object-contain"
            src={user.avatar}
            alt="{user.username} avatar"
          />
        {/if}
        <p class="font-bold">{user.username}</p>
      </div>
    </div>
    <dl class="grid grid-cols-[120px,_1fr] text-sm">
      {#each profileFields as { label, value }}
        <dt>{capitalize(label)}:</dt>
        <dd>{handleValue(value)}</dd>
      {/each}
    </dl>
    <div class="mt-3 flex">
      <Button
        action="danger"
        size="sm"
        on:click={() => {
          openDeleteDialog = true;
        }}>{deleteButton}</Button
      >
    </div>
  </div>
</div>

<Dialog
  bind:open={openDeleteDialog}
  confirmMessage={deleteConfirm}
  confirmAction={() => deleteProfile()}
>
  <h1 class="mb-3 text-center text-lg font-semibold">
    {deleteDialogHeading}
  </h1>
  <p>
    {deleteMessage}
  </p>
</Dialog>

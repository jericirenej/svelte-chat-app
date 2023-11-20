<script lang="ts">
  import type { CompleteUserDto } from "../../../db/index.js";
  import { capitalize } from "../../utils/text-utils.js";
  import type { PageData } from "./$types.js";

  type UserProfileData = {
    [T in keyof CompleteUserDto]: { label: string; value: CompleteUserDto[T] };
  };

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
</script>

<svelte:head>
  <title>Chat App - Profile</title>
</svelte:head>
<div class="flex h-full w-full flex-col items-center justify-center overflow-hidden px-3">
  <div>
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
    <div class="grid grid-cols-[120px,_1fr] text-sm">
      {#each profileFields as { label, value }}
        <p>{capitalize(label)}:</p>
        <p>{handleValue(value)}</p>
      {/each}
    </div>
  </div>
</div>

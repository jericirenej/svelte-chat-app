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
</script>

<div class="flex h-full w-full flex-col items-center justify-center px-3">
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
    <div class="properties-wrapper">
      {#each profileFields as { label, value }}
        <p>{capitalize(label)}:</p>
        <p>{value ?? "Not given"}</p>
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .wrapper {
  }
  .username-block {
    display: flex;
    align-items: center;
    width: fit-content;
    gap: 10px;
    font-size: 18px;
    margin-block: 1rem;

    img {
      display: inline-block;
      height: 1.5em;
      object-fit: contain;
      aspect-ratio: 1 / 1;
      border-radius: 100%;
    }
    p {
      font-weight: 600;
    }
  }
  .properties-wrapper {
    display: grid;
    grid-template-columns: 120px 1fr;
    font-size: 14px;
  }
</style>

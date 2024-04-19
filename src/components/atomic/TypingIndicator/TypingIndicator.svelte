<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { toArray } from "../../../helpers";
  import type { MaybeArray, Nullish } from "../../../types";

  export let usersTyping: MaybeArray<string> | Nullish = null;
  // export let debounceTime = 200;

  const handleUsers = (users: typeof usersTyping): string => {
    const userArr = toArray(users).filter(Boolean) as string[];
    let subjects = "";
    if (!userArr.length) return subjects;
    const verb = userArr.length === 1 ? "is typing" : "are typing";
    switch (userArr.length) {
      case 1:
        subjects = userArr[0];
        break;
      case 2:
        subjects = userArr.join(" and ");
        break;
      default:
        subjects = [userArr.slice(0, -1).join(", "), userArr.at(-1) as string].join(", and ");
    }
    return `${subjects} ${verb}`;
  };

  $: writing = handleUsers(usersTyping);
</script>

{#if usersTyping?.length}
  <div
    in:scale={{ duration: 150 }}
    out:fade={{ duration: 70 }}
    class="flex w-fit items-baseline rounded-lg bg-slate-200 px-2 py-1"
  >
    <span class="text-xs font-medium text-gray-500">{writing}</span>
    <div class=" mx-2 flex gap-1">
      {#each [0, 1, 2] as dot}
        <div
          class="dot relative inline-block aspect-square w-[4px] rounded-md bg-slate-500 opacity-0"
          style:animation-delay={`${dot * 200}ms`}
        ></div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .dot {
    animation: jump 1s infinite linear;
  }
  @keyframes jump {
    0% {
      opacity: 0;
    }
    45% {
      opacity: 1;
    }
  }
</style>

<script lang="ts">
  import { fade, scale } from "svelte/transition";
  import { toArray } from "../../../helpers";
  import type { MaybeArray, Nullish } from "../../../types";
  import AnimatedDots from "../AnimatedDots/AnimatedDots.svelte";

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
    in:scale={{ duration: 150}}
    out:fade={{ duration: 70 }}
    class="flex w-fit items-baseline rounded-lg bg-slate-200 px-2 py-1"
  >
    <span class="text-xs font-medium text-gray-500">{writing}</span>
    <AnimatedDots />
  </div>
{/if}

<script lang="ts">
  import { slide } from "svelte/transition";
  import type { Nullish } from "../../../types";
  import UserEntity from "../UserEntity/UserEntity.svelte";
  import Icon from "@iconify/svelte";
  import CancelIcon from "@iconify/icons-iconoir/cancel";
  import { ENTITY_LIST } from "../../../messages";

  const duration = 20;
  export let entities: { name: string; avatar: string | Nullish; id: string }[];
  export let removeAction: ((id: string) => unknown) | undefined = undefined;
</script>

<ul class="flex list-none flex-col">
  {#each entities as { name, avatar, id }, i (id)}
    <li
      in:slide|global={{ duration, delay: i * duration }}
      out:slide|global={{ duration, delay: (entities.length - i - 1) * duration }}
      class="cursor-default p-2 transition-colors hover:bg-slate-300"
    >
      <UserEntity {name} {avatar} size="base">
        {#if removeAction}
          <button type="button" class="cursor-pointer" on:click={() => removeAction(id)}>
            <span class="sr-only">{ENTITY_LIST.remove}</span>
            <Icon icon={CancelIcon} />
          </button>
        {/if}
      </UserEntity>
    </li>
  {/each}
</ul>

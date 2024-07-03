<script lang="ts">
  import { slide } from "svelte/transition";
  import UserEntity from "../UserEntity/UserEntity.svelte";
  import Icon from "@iconify/svelte";
  import CancelIcon from "@iconify/icons-iconoir/cancel";
  import { ENTITY_LIST } from "../../../messages";
  import type { Entity } from "../../../types";

  const duration = 20;
  export let entities: Entity[];
  export let removeAction: ((id: string) => unknown) | undefined = undefined;
  export let handleSelect: (id: string) => unknown = (id) => {
    id;
  };
</script>

<ul class="flex list-none flex-col">
  {#each entities as entity, i (entity.id)}
    <li
      in:slide|global={{ duration, delay: i * (duration / 2) }}
      out:slide|global={{ duration, delay: (entities.length - i - 1) * duration }}
      class="cursor-default p-2 transition-colors hover:bg-slate-300"
    >
      <UserEntity {entity} {handleSelect} size="base">
        {#if removeAction}
          <button type="button" class="cursor-pointer" on:click={() => removeAction(entity.id)}>
            <span class="sr-only">{ENTITY_LIST.remove}</span>
            <Icon icon={CancelIcon} />
          </button>
        {/if}
      </UserEntity>
    </li>
  {/each}
</ul>

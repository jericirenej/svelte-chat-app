<script lang="ts">
  import { slide } from "svelte/transition";
  import { ENTITY_LIST } from "../../../messages";
  import type { Entity } from "../../../types";
  import DeleteButton from "../../atomic/DeleteButton/DeleteButton.svelte";
  import UserEntity from "../UserEntity/UserEntity.svelte";

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
          <DeleteButton on:click={() => removeAction(entity.id)} label={ENTITY_LIST.remove} />
        {/if}
      </UserEntity>
    </li>
  {/each}
</ul>

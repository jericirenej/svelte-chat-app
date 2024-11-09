<script lang="ts">
  import { slide } from "svelte/transition";
  import { ENTITY_LIST } from "../../../messages";
  import type { Entity } from "../../../types";
  import DeleteButton from "../../atomic/DeleteButton/DeleteButton.svelte";
  import UserEntity from "../UserEntity/UserEntity.svelte";

  const duration = 20;
  export let entities: Entity[];
  export let removeAction: ((id: string) => unknown) | undefined = undefined;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  export let handleSelect: (id: string) => unknown = (_id) => {};
  export let colorTheme: "dark" | "light" = "light";
  $: hover = `hover:${colorTheme === "light" ? "bg-slate-300" : "bg-slate-700"}`;
</script>

<ul class="flex list-none flex-col">
  {#each entities as entity, i (entity.id)}
    <li
      in:slide|global={{ duration, delay: i * (duration / 2) }}
      out:slide|global={{ duration, delay: (entities.length - i - 1) * duration }}
      class={`"cursor-default p-2 transition-colors ${hover}`}
    >
      <UserEntity {entity} {handleSelect} size="base">
        {#if removeAction}
          <DeleteButton on:click={() => removeAction(entity.id)} label={ENTITY_LIST.remove} />
        {/if}
      </UserEntity>
    </li>
  {/each}
</ul>

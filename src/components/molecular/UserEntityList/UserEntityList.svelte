<script lang="ts">
  import { slide } from "svelte/transition";
  import { ENTITY_LIST } from "../../../messages";
  import type { Entity } from "../../../types";
  import DeleteButton from "../../atomic/DeleteButton/DeleteButton.svelte";
  import UserEntity from "../UserEntity/UserEntity.svelte";

  export let handleSelect: (entity: Entity) => unknown = (_entity) => {};
  export let removeAction: ((id: string) => unknown) | undefined = undefined;
  export let entities: Entity[];
  export let animationDuration = 25;
  export let staggeredAnimation = true;
  export let colorTheme: "dark" | "light" = "light";

  $: hover = colorTheme === "light" ? "hover:bg-slate-300" : "hover:bg-slate-700";
</script>

<ul class="mb-1 flex list-none flex-col bg-inherit">
  {#each entities as entity, i (entity.id)}
    <li
      in:slide|global={{
        duration: animationDuration,
        delay: staggeredAnimation ? i * (animationDuration / 2) : 0
      }}
      out:slide|global={{
        duration: animationDuration,
        delay: staggeredAnimation ? (entities.length - i - 1) * animationDuration : 0
      }}
      class={`"cursor-default bg-neutral-50 p-2 ${hover}`}
    >
      <UserEntity {entity} {handleSelect} size="base">
        {#if removeAction}
          <DeleteButton on:click={() => removeAction(entity.id)} label={ENTITY_LIST.remove} />
        {/if}
      </UserEntity>
    </li>
  {/each}
</ul>

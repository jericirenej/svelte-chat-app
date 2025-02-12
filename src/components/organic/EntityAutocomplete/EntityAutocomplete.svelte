<script lang="ts">
  import type { InputConstraint } from "sveltekit-superforms";
  import { ENTITY_LIST } from "../../../messages";
  import type { Entity } from "../../../types";
  import Search from "../../molecular/Search/Search.svelte";
  import UserEntityList from "../../molecular/UserEntityList/UserEntityList.svelte";

  export let label = ENTITY_LIST.searchLabel;
  export let constraints: InputConstraint | undefined = undefined;
  export let errors: string[] | { _errors: string[] | undefined } | undefined = undefined;
  export let searchUsers: (term: string) => Promise<Entity[]>;
  export let pickUser: (entity: Entity) => unknown;

  let entities: Entity[] = [];
  // eslint-disable-next-line prefer-const
  let search: string = "";
  let showList = true;
  let ref: HTMLDivElement;

  const handleSearch = async (term: string) => {
    if (!term) {
      entities = [];
      return;
    }
    const result = await searchUsers(term);
    entities = result;
  };
  let clear: () => void;

  const handleSelect = (entity: Entity) => {
    pickUser(entity);
    entities = [];
    clear();
  };
</script>

<svelte:window
  on:click={(ev) => {
    showList = ev.composedPath().includes(ref);
  }}
/>
<div bind:this={ref} class="autocomplete-wrapper">
  <Search
    searchCb={handleSearch}
    {label}
    placeholder={ENTITY_LIST.searchPlaceholder}
    {search}
    bind:clear
    on:blur
    name="user-search"
    {constraints}
    {errors}
    {...$$restProps}
  >
    {#if entities.length && showList}
      <div
        class="absolute left-0 top-full z-20 w-full rounded-b-md border-[1px] border-t-0 border-neutral-400 bg-neutral-50"
      >
        <UserEntityList {entities} {handleSelect} />
      </div>
    {/if}
  </Search>
</div>

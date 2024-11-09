<script lang="ts">
  import UserEntityList from "../../molecular/UserEntityList/UserEntityList.svelte";
  import Search from "../../molecular/Search/Search.svelte";
  import { ENTITY_LIST } from "../../../messages";
  import type { Entity } from "../../../types";

  const { searchLabel: label, searchPlaceholder: placeholder } = ENTITY_LIST;
  export let searchUsers: (term: string) => Promise<Entity[]>;
  export let pickUser: (id: string) => unknown;

  let entities: Entity[] = [];

  const handleSearch = async (term: string) => {
    const result = await searchUsers(term);
    entities = result;
  };

  const handleSelect = (id: string) => {
    pickUser(id);
    entities = [];
  };
</script>

<Search searchCb={handleSearch} {label} {placeholder} name="user-search">
  {#if entities.length}
    <div class="rounded-b-md border-[1px] border-t-0 border-neutral-400">
      <UserEntityList {entities} {handleSelect} />
    </div>
  {/if}
</Search>

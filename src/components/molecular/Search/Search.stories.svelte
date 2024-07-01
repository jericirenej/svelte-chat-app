<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import SearchComponent from "./Search.svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import { fn } from "@storybook/test";

  export const meta: Meta<SearchComponent> = {
    title: "Molecular/Search",
    component: SearchComponent,
    argTypes: {
      label: { control: "text" },
      name: { control: "text" },
      placeholder: { control: "text" },
      search: { table: { disable: true } }
    },

    args: { searchCb: fn() }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) =>
    args as RemoveIndexSignature<ComponentProps<SearchComponent>>;

  const args: Omit<RemoveIndexSignature<ComponentProps<SearchComponent>>, "searchCb"> = {
    label: "Search",
    placeholder: "Search for stuff",
    name: "search"
  };
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <SearchComponent {...storyArgs}>
    <div class="flex h-40 items-center justify-center bg-neutral-300">Example search slot</div>
  </SearchComponent>
</Template>

<Story name="Search" {args} />

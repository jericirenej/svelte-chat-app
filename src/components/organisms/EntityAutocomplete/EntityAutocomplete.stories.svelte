<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import { searchUsers } from "../../story-helpers/createChat";
  import EntityAutocompleteComponent from "./EntityAutocomplete.svelte";

  type CustomProps = RemoveIndexSignature<ComponentProps<EntityAutocompleteComponent>> & {
    containerWidth: number;
  };
  export const meta: Meta<CustomProps> = {
    title: "Organisms/EntityAutocomplete",
    component: EntityAutocompleteComponent,
    argTypes: {
      containerWidth: {
        control: { type: "range", max: 100, min: 10, step: 5 }
      },
      pickUser: { table: { disable: true } },
      searchUsers: { table: { disable: true } },

      label: { control: "text" }
    },
    args: {
      containerWidth: 30,
      pickUser: (_entity: Entity) => {},
      label: ENTITY_LIST.searchLabel,
      searchUsers
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { Entity, RemoveIndexSignature } from "../../../types";
  import { ENTITY_LIST } from "../../../messages";
  const width = (arg: number) => `${arg}%`;
  const assertArgs = (args: unknown) => args as CustomProps;
</script>

<Template let:args>
  {@const { containerWidth, ...rest } = assertArgs(args)}
  <div style:width={width(containerWidth)}>
    <EntityAutocompleteComponent {...rest} />
  </div>
</Template>

<Story name="EntityAutocomplete" />

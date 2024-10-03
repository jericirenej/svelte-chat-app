<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import EntityAutocompleteComponent from "./EntityAutocomplete.svelte";

  type CustomProps = RemoveIndexSignature<ComponentProps<EntityAutocompleteComponent>> & {
    containerWidth: number;
  };
  export const meta: Meta<CustomProps> = {
    title: "Organic/EntityAutocomplete",
    component: EntityAutocompleteComponent,
    argTypes: {
      containerWidth: {
        control: { type: "range", max: 100, min: 10, step: 5 }
      },
      pickUser: { table: { disable: true } },
      searchUsers: { table: { disable: true } }
    },
    args: {
      containerWidth: 30,
      pickUser: (id: string) => {
        id;
      },

      searchUsers: async (term: string) =>
        Promise.resolve(
          USERS_WITH_ID.filter((u) =>
            [u.username, u.name, u.surname]
              .map((val) => val.toLowerCase())
              .some((val) => !!term && val.includes(term.toLowerCase()))
          ).map(({ id, name, surname }, i) => ({
            id,
            name: `${name} ${surname}`,
            avatar: assignAvatar(i)
          }))
        )
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { USERS_WITH_ID } from "@utils/users";
  import type { RemoveIndexSignature } from "../../../types";
  import { assignAvatar } from "../../story-helpers/avatarSrc";
  const width = (arg: number) => `${arg}%`;
  const assertArgs = (args: unknown) => args as CustomProps;
</script>

<Template let:args>
  {@const { containerWidth, pickUser, searchUsers } = assertArgs(args)}
  <div style:width={width(containerWidth)}>
    <EntityAutocompleteComponent {pickUser} {searchUsers} />
  </div>
</Template>

<Story name="EntityAutocomplete" />

<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  import AddAvatarComponent from "./AddAvatar.svelte";
  type Props = RemoveIndexSignature<ComponentProps<AddAvatarComponent>>;

  export const meta: Meta<Props> = {
    title: "Organisms/AddAvatar",
    component: AddAvatarComponent,
    argTypes: { sizeLimit: { control: "number" } }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { AVATAR_SIZE_LIMIT } from "../../../constants";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const props = assertArgs(args)}
  <AddAvatarComponent {...props} />
</Template>

<Story name="AddAvatar" args={{ sizeLimit: AVATAR_SIZE_LIMIT }} />

<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import AvatarComponent from "./Avatar.svelte";

  type CustomProps = RemoveIndexSignature<ComponentProps<AvatarComponent>> & {
    avatarType: AvatarTypeKeys;
  };

  export const meta: Meta<CustomProps> = {
    title: "Atoms/Avatar",
    component: AvatarComponent,
    argTypes: {
      name: { control: "text" },
      avatarType: { control: "radio", options: ["empty", "transparentBg", "full"] },
      src: { table: { disable: true } },
      size: { control: "number" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  import { avatars } from "../../story-helpers/avatars";
  import type { AvatarTypeKeys } from "@utils/avatarKeys";

  const assertArgs = (args: unknown) => {
    return args as CustomProps;
  };
</script>

<Template let:args>
  {@const { name, size, avatarType } = assertArgs(args)}
  <AvatarComponent {name} {size} src={avatars[avatarType]} />
</Template>

<Story name="Avatar" args={{ name: "Mr. Robot", avatarType: "transparentBg", size: 75 }} />

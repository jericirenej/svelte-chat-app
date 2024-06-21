<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import AvatarComponent from "./Avatar.svelte";

  type CustomProps = RemoveIndexSignature<ComponentProps<AvatarComponent>> & {
    avatarType: keyof typeof avatarTypes;
  };

  export const meta: Meta<CustomProps> = {
    title: "Atomic/Avatar",
    component: AvatarComponent,
    argTypes: {
      name: { control: "text" },
      avatarType: { control: "radio", options: ["empty", "transparentBg", "full"] },
      size: { control: "radio", options: ["sm", "md", "lg"] },

      src: { table: { disable: true } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  import { avatarTypes } from "../../helpers/avatarSrc";

  const assertArgs = (args: unknown) => {
    return args as CustomProps;
  };
</script>

<Template let:args>
  {@const { name, size, avatarType } = assertArgs(args)}
  <AvatarComponent {name} {size} src={avatarTypes[avatarType]} />
</Template>

<Story name="Avatar" args={{ name: "Mr. Robot", avatarType: "transparentBg", size: "md" }} />

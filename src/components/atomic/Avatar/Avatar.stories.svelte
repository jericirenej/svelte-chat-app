<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import AvatarComponent from "./Avatar.svelte";

  const sizeVariants = ["sm", "md", "lg"] as const;

  type CustomProps = RemoveIndexSignature<ComponentProps<AvatarComponent>> & {
    avatarType: keyof typeof avatarTypes;
    sizeVariant: (typeof sizeVariants)[number] | undefined;
    sizeNumber: number | undefined;
  };

  export const meta: Meta<CustomProps> = {
    title: "Atomic/Avatar",
    component: AvatarComponent,
    argTypes: {
      name: { control: "text" },
      avatarType: { control: "radio", options: ["empty", "transparentBg", "full"] },
      sizeVariant: {
        control: "radio",
        options: sizeVariants,
        description: `Size property can be given as one of the ${sizeVariants.join(", ")} keywords.`
      },
      sizeNumber: { control: "number", description: "Size prop can also be given as a number" },
      src: { table: { disable: true } },
      size: { table: { disable: true } }
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
  {@const { name, sizeNumber, sizeVariant, avatarType } = assertArgs(args)}
  <AvatarComponent {name} size={sizeVariant ?? sizeNumber ?? "md"} src={avatarTypes[avatarType]} />
</Template>

<Story
  name="Avatar"
  argTypes={{ sizeNumber: { table: { disable: true } } }}
  args={{ name: "Mr. Robot", avatarType: "transparentBg", sizeVariants: "md" }}
/>

<Story
  name="Avatar - number size"
  argTypes={{ sizeVariant: { table: { disable: true } } }}
  args={{ name: "Mr. Robot", avatarType: "transparentBg", sizeNumber: 45 }}
/>

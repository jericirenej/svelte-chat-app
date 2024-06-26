<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import UserEntityComponent from "./UserEntity.svelte";
  import type { EntitySize, RemoveIndexSignature } from "../../../types";
  import { avatarTypes } from "../../story-helpers/avatarSrc";

  type CustomProps = RemoveIndexSignature<ComponentProps<UserEntityComponent>> & {
    avatarType: keyof typeof avatarTypes;
    containerWidth: number;
    sizeVariant: Exclude<EntitySize, "number"> | undefined;
    sizeNumber: number | undefined;
  };

  export const meta: Meta<CustomProps> = {
    title: "Molecular/UserEntity",
    component: UserEntityComponent,
    argTypes: {
      name: { control: "text" },
      avatar: { table: { disable: true } },
      avatarType: { control: "radio", options: ["empty", "transparentBg", "full"] },
      containerWidth: { control: { type: "range", max: 100, min: 10, step: 5 } },
      ...sizeArgTypes
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { sizeArgTypes } from "../../story-helpers/sizeHandler";
  const assertArgs = (args: unknown) => args as Omit<CustomProps, "avatar">;
  const args: Omit<CustomProps, "avatar" | "sizeVariant" | "sizeNumber"> = {
    avatarType: "empty",
    name: "Linda Lovelace",
    containerWidth: 20
  };
</script>

<Template let:args>
  {@const { avatarType, containerWidth, name, sizeNumber, sizeVariant } = assertArgs(args)}
  <div style:width={`${containerWidth}%`}>
    <UserEntityComponent
      avatar={avatarTypes[avatarType]}
      {name}
      size={sizeVariant ?? sizeNumber ?? "base"}
    />
  </div>
</Template>

<Story name="UserEntity" {args} argTypes={{ sizeNumber: { table: { disable: true } } }} />
<Story
  name="UserEntity - number size"
  args={{ ...args, sizeNumber: 25 }}
  argTypes={{ sizeVariant: { table: { disable: true } } }}
/>

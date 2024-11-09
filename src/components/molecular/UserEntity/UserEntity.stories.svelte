<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { EntitySize, RemoveIndexSignature } from "../../../types";
  import { avatarTypes } from "../../story-helpers/avatarSrc";
  import UserEntityComponent, { sizeVariants } from "./UserEntity.svelte";

  type CustomProps = RemoveIndexSignature<ComponentProps<UserEntityComponent>> & {
    avatarType: keyof typeof avatarTypes;
    containerWidth: number;
    sizeVariant: Exclude<EntitySize, "number"> | undefined;
    sizeNumber: number | undefined;
    slotContent: boolean;
  };

  export const meta: Meta<CustomProps> = {
    title: "Molecular/UserEntity",
    component: UserEntityComponent,
    argTypes: {
      entity: { control: "object", table: { disable: true } },
      avatarType: { control: "radio", options: ["empty", "transparentBg", "full"] },
      containerWidth: { control: { type: "range", max: 100, min: 10, step: 5 } },
      slotContent: { control: "boolean" },
      sizeVariant: {
        control: "radio",
        options: sizeVariants,
        description: `Size property can be given as one of the ${(sizeVariants as string[]).join(", ")} keywords.`
      },
      sizeNumber: { control: "number", description: "Size prop can also be given as a number" },
      size: { table: { disable: true } }
    },
    args: { handleSelect: fn() }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { fn } from "@storybook/test";
  const assertArgs = (args: unknown) => args as CustomProps;
  const args = {
    containerWidth: 20,
    slotContent: false
  };
</script>

<Template let:args>
  {@const { containerWidth, sizeVariant, sizeNumber, slotContent, avatarType, handleSelect } =
    assertArgs(args)}
  <div class="border-[1px] border-neutral-300" style:width={`${containerWidth}%`}>
    <UserEntityComponent
      {handleSelect}
      entity={{ name: "Linda Lovelace", avatar: avatarTypes[avatarType], id: "id" }}
      size={sizeVariant ?? sizeNumber ?? "base"}
    >
      {#if slotContent}<span>X</span>{/if}</UserEntityComponent
    >
  </div>
</Template>

<Story name="UserEntity" {args} argTypes={{ sizeNumber: { table: { disable: true } } }} />
<Story
  name="UserEntity - number size"
  args={{ ...args, sizeNumber: 25 }}
  argTypes={{ sizeVariant: { table: { disable: true } } }}
/>

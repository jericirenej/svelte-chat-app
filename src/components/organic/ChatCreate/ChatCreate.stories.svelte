<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import { searchUsers } from "../../story-helpers/createChat";
  import ChatCreateComponent from "./ChatCreate.svelte";

  const form: CreateChatFormData = await superValidate(zod(createChatSchema));

  type CustomProps = RemoveIndexSignature<ComponentProps<ChatCreateComponent>> & {
    containerWidth: number;
  };
  export const meta: Meta<CustomProps> = {
    title: "Organic/ChatCreate",
    component: ChatCreateComponent,
    argTypes: {
      containerWidth: {
        control: { type: "range", max: 100, min: 10, step: 5 }
      },
      performUserSearch: { table: { disable: true } },
      createChat: { table: { disable: true } },
      formData: { table: { disable: true } }
    },
    args: {
      containerWidth: 30,
      performUserSearch: searchUsers,
      createChat: fn(() => Promise.resolve(true))
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { fn } from "@storybook/test";
  import type { RemoveIndexSignature } from "../../../types";
  import { createChatSchema, type CreateChatFormData } from "$lib/client/createChat.validator";
  import { superValidate } from "sveltekit-superforms";
  import { zod } from "sveltekit-superforms/adapters";
  const width = (arg: number) => `${arg}%`;

  const assertArgs = (args: unknown) => args as CustomProps;
</script>

<Template let:args>
  {@const { containerWidth, ...rest } = assertArgs(args)}
  <div style:width={width(containerWidth)}>
    <ChatCreateComponent {...rest} formData={form} />
  </div>
</Template>

<Story name="ChatCreate" />

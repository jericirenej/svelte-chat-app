<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import SendMessageComponent from "./SendMessage.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<SendMessageComponent> & { containerWidth: number; sendSuccess: boolean }
  >;
  export const meta: Meta<ExtendedProps> = {
    title: "Molecules/SendMessage",
    component: SendMessageComponent,
    argTypes: {
      sendMessage: { table: { disable: true } },
      containerWidth: { control: "range" },
      sendSuccess: { control: "boolean" },
      onInput: { table: { disable: true } }
    },
    args: { onInput: fn() }
  };
</script>

<script lang="ts">
  import { Template, Story } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  import { promisifiedTimeout } from "$lib/utils";
  import { fn } from "@storybook/test";
  let sendResult = true;
  const assertArgs = (args: unknown) => {
    const currentArgs = args as ExtendedProps;
    sendResult = currentArgs.sendSuccess;
    return currentArgs;
  };

  const sendMessage = async (val: string): Promise<boolean> => {
    console.log("Sending message:", val);
    await promisifiedTimeout(300);
    return sendResult;
  };
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div style:width={`${storyArgs.containerWidth}%`}>
    <SendMessageComponent {sendMessage} onInput={storyArgs.onInput} />
  </div>
</Template>

<Story name="SendMessage" args={{ containerWidth: 50, sendSuccess: true, sendMessage }} />

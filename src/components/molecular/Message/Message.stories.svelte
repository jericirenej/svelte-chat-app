<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import MessageComponent from "./Message.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<MessageComponent> & { containerWidth: number }
  >;

  export const meta: Meta<ExtendedProps> = {
    title: "Molecular/Message",
    component: MessageComponent,
    argTypes: {
      message: { control: "text" },
      createdAt: { control: "date" },
      author: { control: "text" },
      containerWidth: { control: { type: "range", min: 20, max: 100, step: 5 } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { sub } from "date-fns";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  const args: ExtendedProps = {
    message:
      "Suffragium spiritus verumtamen venia cunctatio paulatim suppellex aegre quis statua. Vapulus capillus comedo decretum acceptus statim contigo. Sequi alter aegre derelinquo causa uberrime infit vulgaris aspernatur.\nVito vester strenuus ante contabesco bibo auctor tamdiu summa. Ustulo temptatio sunt ventito. Anser angustus casus capto vae perferendis alienus audacia terebro vorax.",
    createdAt: sub(Date.now(), { hours: 1 }),
    author: "",
    containerWidth: 50
  };
  const assertArgs = (args: unknown) => args as ExtendedProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div style:width={`${storyArgs.containerWidth}%`}>
    <MessageComponent
      author={storyArgs.author}
      createdAt={storyArgs.createdAt}
      message={storyArgs.message}
    />
  </div>
</Template>

<Story name="Message" {args} />

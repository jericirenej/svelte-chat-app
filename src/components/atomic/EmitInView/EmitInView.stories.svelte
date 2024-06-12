<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { fn } from "@storybook/test";
  import type { ComponentProps } from "svelte";
  import EmitInViewComponent from "./EmitInView.svelte";

  type Props = RemoveIndexSignature<ComponentProps<EmitInViewComponent>>;

  export const meta: Meta<Props> = {
    title: "Atomic/EmitInView",
    component: EmitInViewComponent,
    args: {
      inViewHandler: fn()
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  const assertArgs = (args: unknown) => args as Props;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div class="h-52 w-64 overflow-auto rounded-md border-2">
    <div style:height="200px"></div>
    <div class="h-8 bg-yellow-700 text-center align-middle leading-none text-white">
      Just before emit
    </div>
    <EmitInViewComponent inViewHandler={storyArgs.inViewHandler} />
  </div>
</Template>

<Story name="EmitInView" />

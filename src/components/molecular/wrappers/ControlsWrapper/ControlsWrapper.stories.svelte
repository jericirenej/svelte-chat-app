<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import ControlsWrapperComponent from "./ControlsWrapper.svelte";
  import type { RemoveIndexSignature } from "../../../../types";
  import type { ComponentProps } from "svelte";

  type StoryProps = RemoveIndexSignature<ComponentProps<ControlsWrapperComponent>>;

  export const meta: Meta<StoryProps> = {
    title: "Molecular/ControlsWrapper",
    component: ControlsWrapperComponent,
    argTypes: {
      controlOnTop: { control: "boolean" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  const assertArgs = (args: unknown) => args as StoryProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <ControlsWrapperComponent {...storyArgs}>
    <div
      slot="inputs"
      class="min-h-[15ch] min-w-[30ch] place-content-center rounded-md bg-gray-400 text-black"
    >
      <p class="text-center">Inputs</p>
    </div>
    <div
      slot="controls"
      class="min-h-[15ch] min-w-[30ch] place-content-center rounded-md bg-gray-400 text-black"
    >
      <p class="text-center">Controls</p>
    </div>
  </ControlsWrapperComponent>
</Template>
<Story name="ControlsWrapper" args={{ controlOnTop: false }} />

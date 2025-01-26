<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import CropImageComponent from "./CropImage.svelte";

  type Props = RemoveIndexSignature<ComponentProps<CropImageComponent>> & {
    containerWidth: number;
    showContainerBorder: boolean;
  };

  export const meta: Meta<Props> = {
    title: "Organic/CropImage",
    component: CropImageComponent,
    argTypes: {
      src: { control: "text", table: { disable: true } },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } },
      showContainerBorder: { control: "boolean" }
    },
    args: { cancelCallback: fn() }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { fn } from "@storybook/test";
  import { writable } from "svelte/store";
  import portrait from "../../story-helpers/images/Caillebote_1876_Young_man_ at_his_window.jpg";
  import landscape from "../../story-helpers/images/Ruisdael_1653_Two_watermills_an_an_open_sluice.jpg";
  const assertArgs = (args: unknown) => args as Props;
  let dataUrl = writable<string | null>(null);
</script>

<Template let:args>
  {@const { src, containerWidth, showContainerBorder, cancelCallback } = assertArgs(args)}
  <div class="flex items-start">
    <div
      style:outline-width={showContainerBorder ? "1px" : "0px"}
      class="outline-dashed outline-neutral-500"
      style:width={`${containerWidth}%`}
    >
      <CropImageComponent
        {src}
        {cancelCallback}
        extract={(val) => {
          dataUrl.set(val);
        }}
      />
    </div>
    <div
      class="pointer-events-none relative ml-[130px] aspect-square w-60 rounded-[25%] border-4 border-dashed border-neutral-600 p-2"
    >
      <p class="absolute left-1/2 top-[105%] w-max -translate-x-1/2 select-none">Extracted image</p>
      {#if $dataUrl}
        <img
          class="inline-block rounded-[inherit] object-contain"
          src={$dataUrl}
          alt="extracted avatar"
        />
      {/if}
    </div>
  </div>
</Template>

<Story name="Portrait" args={{ src: portrait, containerWidth: 30, showContainerBorder: false }} />
<Story name="Landscape" args={{ src: landscape, containerWidth: 30, showContainerBorder: false }} />

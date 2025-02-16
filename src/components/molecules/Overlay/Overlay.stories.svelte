<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import OverlayComponent from "./Overlay.svelte";
  type Props = RemoveIndexSignature<ComponentProps<OverlayComponent>>;
  export const meta: Meta<Props> = {
    title: "Molecules/Overlay",
    component: OverlayComponent,
    argTypes: { showClose: { control: "boolean" } }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import Button from "../../atoms/Button/Button.svelte";
  let isOpen = false;
</script>

<Template let:args>
  <div>
    <Button
      type="button"
      variant="outline"
      action="confirm"
      on:click={() => {
        isOpen = true;
      }}>Open overlay</Button
    >
  </div>
  {#if isOpen}
    <OverlayComponent
      {...args}
      on:close
      on:close={() => {
        isOpen = false;
      }}
    >
      <div class="flex h-[200px] w-[300px] items-center justify-center bg-sky-700">
        <span class="text-white">Projected content</span>
      </div>
    </OverlayComponent>
  {/if}
</Template>

<Story name="Overlay" args={{ showClose: false }} />

<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { action } from "@storybook/addon-actions";

  import DialogComponent from "./Dialog.svelte";
  import type { ComponentProps } from "svelte";
  export const meta: Meta<ComponentProps<DialogComponent>> = {
    title: "Organisms/Dialog",
    component: DialogComponent,
    argTypes: {
      open: { control: "boolean", table: { disable: true } },
      confirmAction: { table: { disable: true } },
      message: { control: "text" },
      heading: { control: "text" },
      confirmMessage: { control: "text" },
      rejectMessage: { control: "text" }
    },
    args: { confirmAction: action("confirmAction") }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import Button from "../../atoms/Button/Button.svelte";
  let isOpen = true;
</script>

<Template let:args>
  <div
    class="wrapper repeat flex items-center justify-center rounded-md border-2 border-violet-500 from-violet-400 to-violet-600"
  >
    <Button
      action="cancel"
      on:click={() => {
        if (!isOpen) isOpen = true;
      }}>Open dialog</Button
    >
  </div>

  <DialogComponent
    {...args}
    open={isOpen}
    on:close
    on:close={() => {
      isOpen = false;
    }}
  />
</Template>

<Story
  name="Dialog"
  args={{
    open: isOpen,
    message: "Is this what you want, what you really really want?",
    heading: "",
    confirmMessage: "",
    rejectMessage: ""
  }}
/>

<style>
  .wrapper {
    height: calc(100vh - 2rem);
    width: calc(100vw - 2rem);
    background: repeating-linear-gradient(
      135deg,
      rgb(167, 139, 250),
      rgb(167, 139, 250) 20px,
      lightgray 20px,
      lightgray 40px
    );
  }
</style>

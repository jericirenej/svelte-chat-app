<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import SubmitButton from "./SubmitButton.svelte";
  export const meta: Meta<SubmitButton> = {
    title: "Molecular/SubmitButton",
    component: SubmitButton,
    argTypes: { isLoading: { control: "boolean" }, text: { control: "text" } }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
</script>

<Template let:args>
  <SubmitButton {...args} />
</Template>

<Story name="primary" args={{ isLoading: false, text: "Login" }} />

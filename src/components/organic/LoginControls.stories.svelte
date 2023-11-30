<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import LoginForm from "./LoginControls.svelte";

  export const meta: Meta<LoginForm> = {
    title: "Organic/Login",
    component: LoginForm,
    argTypes: {
      isLoading: { control: "boolean" },
      submitDisabled: { control: "boolean" },
      status: { control: "radio", options: [200, 404, undefined] }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  const args: Partial<ComponentProps<LoginForm>> = {
    isLoading: false,
    submitDisabled: false,
    status: undefined
  };
</script>

<Template let:args>
  <LoginForm {...args} />
</Template>

<Story name="Primary" {args} />

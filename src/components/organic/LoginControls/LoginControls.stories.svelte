<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import LoginControls from "./LoginControls.svelte";

  export const meta: Meta<LoginControls> = {
    title: "Organic/Login",
    component: LoginControls,
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
  const args: Partial<ComponentProps<LoginControls>> = {
    isLoading: false,
    submitDisabled: false,
    status: undefined
  };
</script>

<Template let:args>
  <LoginControls {...args} />
</Template>

<Story name="Primary" {args}/>

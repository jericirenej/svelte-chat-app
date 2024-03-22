<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import FormFooter from "./FormFooter.svelte";

  export const meta: Meta<FormFooter> = {
    title: "Molecular/FormFooter",
    component: FormFooter,
    argTypes: {
      link: { control: "text" },
      label: { control: "text" }
    },
    args: {
      label: "Follow this link to win great prizes!",
      link: "https://nowhere.anywhere"
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
</script>

<Template let:args>
  <FormFooter {...args} />
</Template>

<Story name="Primary"/>

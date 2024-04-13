<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import ExpireWarning from "./ExpireWarning.svelte";

  export const meta: Meta<ExpireWarning> = {
    title: "Molecular/ExpireWarning",
    component: ExpireWarning,
    argTypes: {
      status: { control: "radio", options: [undefined, "success", "fail"] }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import StoryFieldsetWrapper from "../../helpers/StoryFieldsetWrapper.svelte";

  $: show = true;

  const args: Omit<ComponentProps<ExpireWarning>, `on${string}`> = {
    status: undefined
  };
</script>

<Template let:args>
  <StoryFieldsetWrapper labelCallback={() => (show = !show)} label={`${show ? "Hide" : "Show"} extend notification`}>
    {#if show}
      <ExpireWarning
        on:dismiss={() => (show = false)}
        on:sessionExtend={() => {
          console.log("Extend session fired.");
        }}
        {...args}
      />
    {/if}
  </StoryFieldsetWrapper>
</Template>

<Story name="Primary" {args} />

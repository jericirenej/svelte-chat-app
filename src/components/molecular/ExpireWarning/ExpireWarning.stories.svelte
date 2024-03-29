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

  $: show = true;

  const args: Omit<ComponentProps<ExpireWarning>, `on${string}`> = {
    status: undefined
  };
</script>

<Template let:args>
  <fieldset
    class="flex
  h-[125px] w-[270px] flex-row items-center
  gap-x-5
  rounded
  border-2
  border-stone-300
  px-4
  pb-2
  "
  >
    <legend class="select-none">
      <button class="text-xs uppercase tracking-wide" on:click={() => (show = !show)}
        >{show ? "Hide" : "Show"} notification</button
      ></legend
    >
    {#if show}
      <ExpireWarning
        on:dismiss={() => (show = false)}
        on:sessionExtend={() => {
          console.log("Extend session fired.");
        }}
        {...args}
      />
    {/if}
  </fieldset>
</Template>

<Story name="Primary" {args} />

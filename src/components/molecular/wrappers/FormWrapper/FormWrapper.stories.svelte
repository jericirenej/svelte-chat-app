<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import FormWrapper from "./FormWrapper.svelte";

  export const meta: Meta<FormWrapper> = {
    title: "Molecular/FormWrapper",
    component: FormWrapper,
    argTypes: {
      subtitle: { control: "text" },
      formTitle: { control: "text" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import SlotFills from "./stroybook-helpers/SlotFills.svelte";
  const args: Partial<ComponentProps<FormWrapper>> & { footer: boolean } = {
    formTitle: "Form title",
    subtitle: "Form subtitle",
    footer: true
  };

  const formWrapperArgs = (completeArgs: typeof args): Omit<typeof args, "footer"> => {
    return Object.fromEntries(Object.entries(completeArgs).filter(([key]) => key !== "footer"));
  };
</script>

<Template let:args>
  {@const formArgs = formWrapperArgs(args)}
  {#if args.footer}
    <FormWrapper {...formArgs}>
      <div slot="form">
        <SlotFills />
      </div>
      <div slot="footer"><SlotFills isFooter={true} /></div>
    </FormWrapper>
  {:else}
    <FormWrapper {...formArgs}>
      <div slot="form">
        <SlotFills />
      </div>
    </FormWrapper>
  {/if}
</Template>

<Story name="Primary" {args} />
<Story name="No footer" args={{ ...args, footer: false }} />

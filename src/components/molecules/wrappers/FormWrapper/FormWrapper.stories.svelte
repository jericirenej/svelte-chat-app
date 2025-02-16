<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import FormWrapperComponent from "./FormWrapper.svelte";

  type StoryProps = RemoveIndexSignature<ComponentProps<FormWrapperComponent>>;

  export const meta: Meta<StoryProps> = {
    title: "Organisms/FormWrapper",
    component: FormWrapperComponent,
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
  import type { RemoveIndexSignature } from "../../../../types";
  type ExpandedProps = Partial<StoryProps> & { footer: boolean };
  const args: ExpandedProps = {
    formTitle: "Form title",
    subtitle: "Form subtitle",
    footer: true
  };

  const assertArgs = (args: unknown) => args as ExpandedProps;
  const formWrapperArgs = (completeArgs: typeof args): Omit<typeof args, "footer"> => {
    return Object.fromEntries(Object.entries(completeArgs).filter(([key]) => key !== "footer"));
  };
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  {@const formArgs = formWrapperArgs(storyArgs)}
  {#if storyArgs.footer}
    <FormWrapperComponent {...formArgs}>
      <div slot="form">
        <SlotFills />
      </div>
      <div slot="footer"><SlotFills isFooter={true} /></div>
    </FormWrapperComponent>
  {:else}
    <FormWrapperComponent {...formArgs}>
      <div slot="form">
        <SlotFills />
      </div>
    </FormWrapperComponent>
  {/if}
</Template>

<Story name="FormWrapper" {args} />
<Story name="No footer" args={{ ...args, footer: false }} />

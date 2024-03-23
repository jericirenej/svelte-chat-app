<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import FormHeader from "./FormHeader.svelte";
  type ExtendedProps = ComponentProps<FormHeader> & { containerWidth: number };
  export const meta: Meta<ExtendedProps> = {
    title: "Molecular/FormHeader",
    component: FormHeader,
    argTypes: {
      formTitle: { control: "text" },
      subtitle: { control: "text" },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  const args: ExtendedProps = {
    formTitle: "A form title",
    subtitle: "A form subtitle",
    containerWidth: 50
  };
</script>

<Template let:args>
  <div class="border" style:width={`${args.containerWidth}%`}>
    <FormHeader formTitle={args.formTitle} subtitle={args.subtitle} />
  </div>
</Template>

<Story name="Primary" {args}></Story>

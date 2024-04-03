<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import FormHeader from "./FormHeader.svelte";
  type ExtendedProps = RemoveIndexSignature<
    ComponentProps<FormHeader> & { containerWidth: number }
  >;
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
  import type { RemoveIndexSignature } from "../../../types";
  const args: ExtendedProps = {
    formTitle: "A form title",
    subtitle: "A form subtitle",
    containerWidth: 50
  };

  const assertArgs = (args: unknown) => args as ExtendedProps;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div class="border" style:width={`${storyArgs.containerWidth}%`}>
    <FormHeader formTitle={storyArgs.formTitle} subtitle={storyArgs.subtitle} />
  </div>
</Template>

<Story name="Primary" {args}></Story>

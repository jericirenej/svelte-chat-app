<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import InputComponent from "./Input.svelte";

  type StoryProps = RemoveIndexSignature<ComponentProps<InputComponent>>;
  type ExpandedProps = StoryProps & { containerWidth: number };

  export const meta: Meta<ExpandedProps> = {
    title: "Atomic/Input",
    component: InputComponent,
    argTypes: {
      name: { control: "text" },
      type: {
        control: "select",
        options: [
          "date",
          "datetime-local",
          "email",
          "month",
          "number",
          "password",
          "radio",
          "range",
          "search",
          "tel",
          "text",
          "time",
          "url",
          "week"
        ]
      },
      placeholder: { control: "text" },
      disabled: { control: "boolean" },
      label: { control: "text" },
      containerWidth: { control: { type: "range", min: 10, max: 100, step: 5 } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  const componentKeys = ["name", "type", "label", "disabled", "placeholder"] as const,
    wrapperKeys = ["containerWidth"] as const;
  const handleArgs = (args: ExpandedProps) => {
    return {
      props: componentKeys.reduce(
        (obj, key) => {
          obj[key] = args[key];
          return obj;
        },
        {} as Record<string, unknown>
      ) as StoryProps,
      container: wrapperKeys.reduce(
        (obj, key) => {
          obj[key] = args[key];
          return obj;
        },
        {} as Omit<ExpandedProps, keyof StoryProps>
      )
    };
  };
</script>

<Template let:args>
  {#if args}
    {@const { props, container } = handleArgs(args)}
    <div style:width={`${container.containerWidth}%`}>
      <InputComponent {...props} />
    </div>
  {/if}
</Template>

<Story
  name="Input"
  args={{
    disabled: false,
    type: "text",
    label: "Username",
    name: "username",
    placeholder: "Enter your username",
    containerWidth: 50
  }}
/>

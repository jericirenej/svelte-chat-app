<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import Input from "./Input.svelte";

  export const meta: Meta<Input> = {
    title: "Atomic/Input",
    component: Input,
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
  const componentKeys = ["name", "type", "label", "disabled", "placeholder"],
    wrapperKeys = ["containerWidth"];
  const handleArgs = <T extends Record<string, unknown>>(args: T) => {
    return {
      props: componentKeys.reduce((obj, key) => {
        obj[key] = args[key];
        return obj;
      }, {} as ComponentProps<Input>),
      container: wrapperKeys.reduce((obj, key) => {
        obj[key] = args[key];
        return obj;
      }, {} as Record<string, unknown>)
    };
  };
</script>

<Template let:args>
  {#if args}
    {@const { props, container } = handleArgs(args)}
    <div style:width={`${container.containerWidth}%`}>
      <Input {...props} />
    </div>
  {/if}
</Template>

<Story
  name="Primary"
  args={{
    disabled: false,
    type: "text",
    label: "Username",
    name: "username",
    placeholder: "Enter your username",
    containerWidth: 50
  }}
/>

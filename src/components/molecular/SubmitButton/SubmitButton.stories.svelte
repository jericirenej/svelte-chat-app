<script context="module" lang="ts">
  import type { ComponentProps } from "svelte";
  import type { Meta } from "@storybook/svelte";
  import SubmitButton from "./SubmitButton.svelte";
  type StoryProps = RemoveIndexSignature<ComponentProps<SubmitButton>>;
  type CompleteArgs =StoryProps & { containerWidth: number };

  export const meta: Meta<CompleteArgs> = {
    title: "Molecular/SubmitButton",
    component: SubmitButton,
    argTypes: {
      isLoading: { control: "boolean" },
      text: { control: "text" },
      title: { control: "text" },
      submitStatus: { control: "radio", options: ["success", "failure", undefined] },
      submitMessage: { control: "text" },
      disabled: { control: "boolean" },
      containerWidth: { control: { type: "range", min: 200, max: 500, step: 10 } }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { RemoveIndexSignature } from "../../../types";
  const componentArgs = (completeArgs: CompleteArgs): StoryProps =>
    Object.fromEntries(
      Object.entries(completeArgs as Record<string, unknown>).filter(
        ([key]) => key !== "containerWidth"
      )
    );
  const getContainerWidth = (args: CompleteArgs) => args.containerWidth;
</script>

<Template let:args>
  {@const submitArgs = componentArgs(args)}
  <div class="flex flex-col gap-3" style:width={`${getContainerWidth(args)}px`}>
    <fieldset class="border border-l-gray-400 p-7">
      <legend class="text-xs uppercase tracking-wide">Inline-block</legend>
      <SubmitButton {...submitArgs} />
    </fieldset>
    <fieldset class="border border-l-gray-400 p-7">
      <legend class="text-xs uppercase tracking-wide">Block</legend>
      <SubmitButton {...submitArgs} config={{ display: "block" }} />
    </fieldset>
  </div>
</Template>

<Story
  name="primary"
  args={{
    isLoading: false,
    text: "Login",
    title: "",
    submitStatus: undefined,
    submitMessage: "Some long submit message to be shown",
    disabled: false,
    containerWidth: 250
  }}
/>

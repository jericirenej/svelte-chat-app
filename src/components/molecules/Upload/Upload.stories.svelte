<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import UploadComponent from "./Upload.svelte";
  type Props = RemoveIndexSignature<ComponentProps<UploadComponent>>;

  export const meta: Meta<UploadComponent> = {
    title: "Molecules/Upload",
    component: UploadComponent,
    argTypes: {
      label: { control: "text" },
      title: { control: "text" },
      accept: { control: "text" },
      errMessage: { control: "text" }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import Button from "../../atoms/Button/Button.svelte";
  const assertArgs = (args: unknown) => args as Props;
  let isError = false;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <div class="flex flex-col items-start gap-5">
    <UploadComponent bind:isError on:change {...storyArgs} />
    <Button
      customClasses="border-[1px]"
      action="cancel"
      size="sm"
      variant="outline"
      display="inline-block"
      on:click={() => {
        isError = true;
      }}>Set error</Button
    >
  </div>
</Template>

<Story
  name="Upload"
  args={{
    label: "Upload",
    accept: ".jpg,.png,.webp,.avif",
    title: "Upload some file",
    errMessage: undefined
  }}
/>

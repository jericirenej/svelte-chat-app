<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { fn } from "@storybook/test";
  import type { CreateProps } from "../../story-helpers/types";
  import CroppedAvatarComponent from "./CroppedAvatar.svelte";
  type Props = CreateProps<CroppedAvatarComponent>;

  export const meta: Meta<Props> = {
    title: "Molecular/CroppedAvatar",
    component: CroppedAvatarComponent,
    argTypes: {
      sizeLimit: { control: "number" },
      sizeLimitLabel: { control: "text" },
      src: { table: { disable: true } },
      deleteCb: { table: { disable: true } },
      modifyCb: { table: { disable: true } }
    },
    args: {
      deleteCb: fn(() => "delete"),
      modifyCb: fn(() => "modify"),
      updateBlob: fn(() => "updateBlob")
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import landscape from "../../../../utils/images/Ruisdael_1653_Two_watermills_an_an_open_sluice-SQUARE.webp";
  const assertArgs = (args: unknown) => args as Omit<Props, "src">;
</script>

<Template let:args>
  {@const storyArgs = assertArgs(args)}
  <CroppedAvatarComponent {...storyArgs} src={landscape} />
</Template>

<Story name="CroppedAvatar" args={{ sizeLimit: 1, sizeLimitLabel: "1B", src: landscape }} />

<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import CrossFadeTextComponent from "./CrossFadeText.svelte";

  export const meta: Meta<CrossFadeTextComponent> = {
    title: "Atoms/CrossFadeText",
    component: CrossFadeTextComponent,
    argTypes: {
      text: { table: { disable: true } }
    },
    parameters: {
      a11y: { config: { rules: [{ id: "color-contrast", selector: "toggle-button" }] } }
    }
  };
</script>

<script lang="ts">
  import { faker } from "@faker-js/faker";
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import Button from "../Button/Button.svelte";
  let text = "Example";
  const changeText = () => {
    text = faker.word.sample({ length: { min: 4, max: 10 } });
  };
</script>

<Template>
  <div class="flex w-fit flex-col">
    <CrossFadeTextComponent {text} />
    <Button
      customClasses="mt-7"
      type="button"
      action="info"
      size="sm"
      variant="outline"
      display="inline-block"
      id="toggle-button"
      on:click={changeText}>Change</Button
    >
  </div>
</Template>

<Story name="CrossFadeText" />

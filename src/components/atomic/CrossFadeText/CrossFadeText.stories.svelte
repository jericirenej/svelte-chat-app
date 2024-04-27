<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import CrossFadeText from "./CrossFadeText.svelte";

  export const meta: Meta<CrossFadeText> = {
    title: "Atomic/CrossFadeText",
    component: CrossFadeText,
    argTypes: {
      text: { table: { disable: true } }
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
  <div class="flex flex-col w-fit">
    <CrossFadeText {text} />
    <Button customClasses="mt-7" type="button" action="info" size="sm" variant="outline" display="inline-block" on:click={changeText}>Change</Button>
  </div>
</Template>

<Story name="Primary" />

<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import UserEntityListComponent from "./UserEntityList.svelte";
  import { assignAvatar } from "../../story-helpers/avatars";
  import type { RemoveIndexSignature } from "../../../types";

  type CustomProps = RemoveIndexSignature<ComponentProps<UserEntityListComponent>> & {
    containerWidth: number;
    show: boolean;
    removeCallback: boolean;
  };

  const entitiesArr = USERS_WITH_ID.map(({ id, name, surname }, index) => ({
    id,
    name: `${name} ${surname}`,
    avatar: assignAvatar(index)
  }));

  export const meta: Meta<CustomProps> = {
    title: "Molecular/UserEntityList",
    component: UserEntityListComponent,
    argTypes: {
      entities: { table: { disable: true } },
      removeAction: { table: { disable: true } },
      removeCallback: { control: "boolean" },
      containerWidth: {
        control: { type: "range", max: 100, min: 10, step: 5 }
      },
      show: { control: "boolean" },
      animationDuration: { control: "number" },
      colorTheme: { control: "inline-radio", options: ["light", "dark"] }
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { USERS_WITH_ID } from "@utils/users";
  import Button from "../../atomic/Button/Button.svelte";
  import { fn } from "@storybook/test";
  const assertArgs = (args: unknown) => args as CustomProps;
  const width = (arg: number) => `${arg}%`;
  let entities = JSON.parse(JSON.stringify(entitiesArr)) as typeof entitiesArr;
  const removeAction = (id: string) => {
    entities = entities.filter((e) => id !== e.id);
  };
  const setEntities = () => {
    entities = JSON.parse(JSON.stringify(entitiesArr)) as typeof entitiesArr;
  };
</script>

<Template let:args>
  {@const { containerWidth, show, removeCallback, handleSelect, animationDuration, colorTheme } =
    assertArgs(args)}
  <div>
    <div class="border-[1px] border-neutral-200" style:width={width(containerWidth)}>
      <UserEntityListComponent
        entities={show ? entities : []}
        removeAction={removeCallback ? removeAction : undefined}
        {handleSelect}
        {colorTheme}
        {animationDuration}
      />
    </div>
    <div class="ml-auto mt-2">
      <Button action="info" size="sm" type="button" variant="outline" on:click={setEntities}
        >Reset</Button
      >
    </div>
  </div>
</Template>

<Story
  name="UserEntityList"
  args={{
    containerWidth: 25,
    show: true,
    removeCallback: false,
    animationDuration: 25,
    colorTheme: "light",
    handleSelect: fn(),
    removeAction: fn()
  }}
/>

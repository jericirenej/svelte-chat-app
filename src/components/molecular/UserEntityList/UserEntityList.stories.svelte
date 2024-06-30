<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import type { ComponentProps } from "svelte";
  import UserEntityListComponent from "./UserEntityList.svelte";
  import type { RemoveIndexSignature } from "../../../types";
  import { avatarTypes, type AvatarTypeKeys } from "../../story-helpers/avatarSrc";

  type CustomProps = RemoveIndexSignature<ComponentProps<UserEntityListComponent>> & {
    containerWidth: number;
    show: boolean;
    removeCallback: boolean;
  };

  const assignAvatar = (num: number) => {
    const avatarIndices: AvatarTypeKeys[] = ["empty", "full", "transparentBg"];
    return avatarTypes[avatarIndices[(num + 1) % avatarIndices.length]];
  };

  const entitiesArr = BASE_USERS.map(({ id, name, surname }, index) => ({
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
        control: { type: "range", max: 100, min: 10, step: 5 },
        show: { control: "boolean" }
      }
    },
    args: { containerWidth: 25, show: true, removeCallback: false }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { BASE_USERS } from "@utils/base-users";
  import Button from "../../atomic/Button/Button.svelte";
  const assertArgs = (args: unknown) => args as CustomProps;
  const width = (arg: number) => `${arg}%`;
  let entities = JSON.parse(JSON.stringify(entitiesArr)) as typeof entitiesArr;
  const removeAction = (id: string) => {
    console.log("REMOVING");
    entities = entities.filter((e) => id !== e.id);
  };
  const setEntities = () => {
    entities = JSON.parse(JSON.stringify(entitiesArr)) as typeof entitiesArr;
  };
</script>

<Template let:args>
  {@const { containerWidth, show, removeCallback } = assertArgs(args)}
  <div>
    <div class="border-[1px] border-neutral-200" style:width={width(containerWidth)}>
      <UserEntityListComponent
        entities={show ? entities : []}
        removeAction={removeCallback ? removeAction : undefined}
      />
    </div>
    <div class="ml-auto mt-2">
      <Button action="info" size="sm" type="button" variant="outline" on:click={setEntities}
        >Reset</Button
      >
    </div>
  </div>
</Template>

<Story name="UserEntityList" />

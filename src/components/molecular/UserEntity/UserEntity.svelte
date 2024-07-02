<script lang="ts">
  import { afterUpdate } from "svelte";
  import type { EntitySize, Entity } from "../../../types";
  import Avatar from "../../atomic/Avatar/Avatar.svelte";
  import { sizeMap } from "../../story-helpers/sizeHandler";

  export let entity: Entity;
  export let size: EntitySize = "xs";
  export let handleSelect: (id: string) => unknown;

  let span: HTMLSpanElement | undefined;
  const getSize = () => {
    if (!span) return 24;
    return Number(getComputedStyle(span).fontSize.replace("px", "")) * 1.5;
  };
  let avatarSize: number = 24;
  $: textSize = typeof size === "number" ? "" : sizeMap[size];
  $: textSizeStyle = typeof size === "number" ? `${size}px` : null;

  afterUpdate(() => {
    avatarSize = getSize();
  });
</script>

<div class="flex items-center justify-between">
  <button
    type="button"
    class="flex min-w-0 flex-grow items-center gap-2"
    on:click={() => handleSelect(entity.id)}
  >
    <div>
      <Avatar name={entity.name} src={entity.avatar} size={avatarSize} />
    </div>
    <span
      bind:this={span}
      style:font-size={textSizeStyle}
      class={`overflow-hidden text-ellipsis whitespace-nowrap ${textSize}`}>{entity.name}</span
    >
  </button>
  <!-- Add additional elements, like delete controls, etc. to the
   current entity. -->
  <slot />
</div>

<script lang="ts">
  import { afterUpdate } from "svelte";
  import type { EntitySize, Nullish } from "../../../types";
  import Avatar from "../../atomic/Avatar/Avatar.svelte";
  import { sizeMap } from "../../story-helpers/sizeHandler";

  export let name: string;
  export let avatar: string | Nullish;
  export let size: EntitySize = "xs";

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
  <div class="flex items-center gap-2">
    <div>
      <Avatar {name} src={avatar} size={avatarSize} />
    </div>
    <span
      bind:this={span}
      style:font-size={textSizeStyle}
      class={`overflow-hidden text-ellipsis whitespace-nowrap ${textSize}`}>{name}</span
    >
  </div>
  <!-- Add additional elements, like delete controls, etc. to the
   current entity. -->
  <slot />
</div>

<script lang="ts">
  import { AVATAR } from "../../../constants";
  import { avatarLabel } from "../../../messages";
  import type { Maybe } from "../../../types";

  export let size: number;
  export let src: Maybe<string> = undefined;
  export let name: string;

  $: alt = avatarLabel(name);
  $: width = `${size}px`;
</script>

<div
  class="flex aspect-square items-center justify-center bg-gradient-to-br from-slate-500 to-slate-900"
  style:width
  style:border-radius={AVATAR.borderRadius}
>
  {#if src}
    <img class="object-cover" style:width {alt} {src} style:border-radius="inherit" />
  {:else}
    <div class="text-neutral-100" role="img" aria-label={alt} style:border-radius="inherit">
      <!-- Humble Icons User icon [MIT license, Jiří Zralý](https://github.com/zraly/humbleicons/blob/master/license)-->
      <svg xmlns="http://www.w3.org/2000/svg" {width} height={width} viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M18 19v-1.25c0-2.071-1.919-3.75-4.286-3.75h-3.428C7.919 14 6 15.679 6 17.75V19m9-11a3 3 0 1 1-6 0a3 3 0 0 1 6 0"
        />
      </svg>
    </div>
  {/if}
</div>

<style lang="css">
  path {
    stroke-width: 1;
  }
</style>

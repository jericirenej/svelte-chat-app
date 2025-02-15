<script lang="ts">
  import CancelIcon from "@iconify/icons-iconoir/cancel";
  import Icon from "@iconify/svelte";
  import type { Maybe } from "../../../types";
  export let label: string;
  export let color: Maybe<string> = undefined;
</script>

<button type="button" class="cursor-pointer" on:click on:pointerdown>
  <span class="sr-only">{label}</span>
  <Icon icon={CancelIcon} color={color ?? undefined} style="font-size: 24px;" />
</button>

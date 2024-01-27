<script lang="ts">
  import { capitalize } from "../../../../utils/text-utils";

  export let isFooter: boolean = false;
  $: slotHeight = isFooter ? "min-h-[10ch]" : "min-h-[15ch]";
</script>

<div
  class={`flex ${slotHeight} min-w-[30ch] items-center justify-center rounded-md bg-gray-400 text-black`}
>
  <span>{isFooter ? "Footer" : "Form"} slot fill</span>
</div>

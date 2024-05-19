<script lang="ts">
  import { onDestroy } from "svelte";
  import CrossFadeText from "../../atomic/CrossFadeText/CrossFadeText.svelte";
  import { handleDate } from "./dateHandler";

  export let date: Date | number;
  export let locale = navigator.language;

  $: dateVal = date instanceof Date ? date : new Date(date);

  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

  $: dataObj = { display: "", title: "" };

  const repeat = (date: Date) => {
    clearTimeout(timeout);
    const { repeatIn, display, title } = handleDate({ date, locale });
    dataObj = { display, title };
    if (!repeatIn) return;
    timeout = setTimeout(() => {
      repeat(date);
    }, repeatIn);
  };
  $: repeat(dateVal);

  onDestroy(() => {
    clearTimeout(timeout);
  });
</script>

<div class="cursor-default select-none text-xs text-gray-700">
  <CrossFadeText text={dataObj.display} title={dataObj.title} />
</div>

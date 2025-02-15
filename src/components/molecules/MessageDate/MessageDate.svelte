<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import CrossFadeText from "../../atoms/CrossFadeText/CrossFadeText.svelte";
  import { handleDate } from "./dateHandler";

  export let date: Date | number;
  export let locale: string | undefined = undefined;

  $: dateVal = date instanceof Date ? date : new Date(date);

  let timeout: ReturnType<typeof setTimeout> | undefined = undefined;

  $: dataObj = { display: "", title: "" };

  const repeat = (date: Date) => {
    if (!locale) return;
    clearTimeout(timeout);
    const { repeatIn, display, title } = handleDate({ date, locale });
    dataObj = { display, title };
    if (!repeatIn) return;
    timeout = setTimeout(() => {
      repeat(date);
    }, repeatIn);
  };
  $: repeat(dateVal);

  onMount(() => {
    if (!locale) {
      locale = navigator.language;
      repeat(dateVal);
    }
  });
  onDestroy(() => {
    clearTimeout(timeout);
  });
</script>

<div class="cursor-default select-none">
  <CrossFadeText text={dataObj.display} title={dataObj.title} />
</div>

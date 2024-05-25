<script lang="ts">
  import { CONVERSATION_MESSAGES } from "../../../messages";
  let ref: HTMLTextAreaElement | undefined;

  export let value: string;
  export let onInput: ((ev?: Event) => unknown) | undefined = undefined;

  const handleHeight = (value: string) => {
    if (!ref) return;
    ref.style.height = "auto";
    if (value.length) {
      ref.style.height = `${ref.scrollHeight + 4}px`;
    }
  };

  const handleInput = (ev: Event) => {
    onInput && onInput(ev);
  };

  $: handleHeight(value);
</script>

<textarea
  bind:this={ref}
  class="focus-visible:shadow-bluborder-blue-500 w-full resize-none overflow-hidden rounded-md border-2 border-neutral-400 p-[8px] focus-visible:border-blue-500 focus-visible:outline-none"
  bind:value
  spellcheck="true"
  placeholder={CONVERSATION_MESSAGES.textPlaceholder}
  on:input={handleInput}
  rows="1"
></textarea>

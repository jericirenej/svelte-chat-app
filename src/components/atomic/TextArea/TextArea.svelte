<script lang="ts">
  import { CONVERSATION_MESSAGES } from "../../../messages";
  let ref: HTMLTextAreaElement;

  export let value: string | undefined;
  export let onInput: ((ev?: Event) => unknown) | undefined = undefined;

  const handleHeight = () => {
    ref.style.height = "auto";
    ref.style.height = `${ref.scrollHeight + 4}px`;
  };

  const handleInput = (ev: Event) => {
    handleHeight();
    onInput && onInput(ev);
  };
</script>

<textarea
  bind:this={ref}
  class="w-full resize-none overflow-hidden rounded-md border-2 border-neutral-400 p-[8px] focus-visible:border-violet-500 focus-visible:shadow-violet-500 focus-visible:outline-none"
  bind:value
  spellcheck="true"
  placeholder={CONVERSATION_MESSAGES.textPlaceholder}
  on:input={handleInput}
  rows="1"
></textarea>

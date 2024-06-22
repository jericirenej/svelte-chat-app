<script lang="ts">
  /** This can be either a chat title or
   * a list of chat participants that does
   * not include the current user. */
  export let chatLabel: string;
  export let message: string;

  const oneLine = "overflow-hidden text-ellipsis whitespace-nowrap";
</script>

<div class="flex flex-col gap-1">
  <span class={`${oneLine} text-md font-medium text-neutral-600`}>{chatLabel}</span>
  <p class={`${oneLine} text-sm`}>{message}</p>
</div>

<script lang="ts">
  import CancelIcon from "@iconify/icons-iconoir/cancel";
  import Icon from "@iconify/svelte";
  export let label!: string;
</script>

<button type="button" class="cursor-pointer" on:click on:pointerdown>
  <span class="sr-only">{label}</span>
  <Icon icon={CancelIcon} />
</button>

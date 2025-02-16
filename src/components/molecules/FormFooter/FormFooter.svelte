<script lang="ts">
  import RootHeading from "../../atoms/RootHeading/RootHeading.svelte";
  export let link: string;
  export let label: string;
</script>

<div class="flex flex-col items-center">
  <RootHeading />
  <div class="mt-3 text-center">
    <a
      class="text-xs font-normal text-sky-700 transition hover:text-sky-600 hover:drop-shadow-sm"
      href={link}
    >
      <span>{label}</span></a
    >
  </div>
</div>

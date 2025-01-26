<script lang="ts">
  import { onMount } from "svelte";
  import { readable } from "svelte/store";
  import { IMAGE_CROP } from "../../../messages";
  import { ImageCrop } from "./crop";
  import CropActions from "./CropAction/CropActions.svelte";
  import CropBox from "./CropBox/CropBox.svelte";
  let imgRef: HTMLImageElement;
  let isError = false;
  let cropper: ImageCrop | undefined;

  $: position = cropper ? cropper.position : readable(null);
  $: dirty = cropper ? cropper.dirty : readable(false);

  const handleImageLoad = () => {
    isError = false;
    cropper = new ImageCrop(imgRef);
  };

  export let src: string;
  export let extract: (dataUrl: string) => unknown;
  export let cancelCallback: () => unknown;

  let prevWidth: number | undefined;
  let clientWidth: number;
  const handleResize = (width: number) => {
    if (!cropper) return;
    cropper.newWidthUpdate(prevWidth ? width / prevWidth : 1);
    prevWidth = clientWidth;
  };
  $: handleResize(clientWidth);

  const handleExtract = () => {
    if (!cropper) return;
    extract(cropper.extractCrop());
  };
  onMount(() => {
    prevWidth = clientWidth;
  });
</script>

<div class="relative">
  <div class="absolute left-full top-0">
    <CropActions
      resetCallback={() => {
        cropper?.reset();
      }}
      confirmCallback={handleExtract}
      resetDisabled={!$dirty}
      confirmDisabled={false}
      {cancelCallback}
    />
  </div>
  <div
    bind:clientWidth
    class="relative w-full select-none bg-black/[0.66] bg-contain bg-blend-darken"
    style:background-image={`url(${src})`}
    role="img"
    aria-label={IMAGE_CROP.alt}
  >
    <!-- svelte-ignore a11y-missing-attribute -->
    <img
      bind:this={imgRef}
      class="invisible inline-block h-auto w-full object-contain"
      {src}
      on:load={handleImageLoad}
      on:error={() => {
        isError = true;
      }}
    />

    {#if cropper && $position}
      <div
        class="crop-wrapper absolute z-10 aspect-square"
        style:width={$position.width}
        style:left={$position.left}
        style:right={$position.right}
        style:top={$position.top}
        style:bottom={$position.bottom}
      >
        <CropBox backdropBrightness={3} {cropper} />
      </div>
    {/if}
    {#if isError}
      <small>{IMAGE_CROP.error}</small>
    {/if}
  </div>
</div>

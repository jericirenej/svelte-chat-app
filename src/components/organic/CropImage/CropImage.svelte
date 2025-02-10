<script lang="ts">
  import { finalize, interval, map, pairwise, startWith, takeWhile } from "rxjs";
  import { onMount } from "svelte";
  import { readable } from "svelte/store";
  import { IMAGE_CROP } from "../../../messages";
  import type { Maybe } from "../../../types";
  import { ImageCrop } from "./crop";
  import CropActions from "./CropAction/CropActions.svelte";
  import CropBox from "./CropBox/CropBox.svelte";

  export let src: Maybe<string>;
  export let extract: (dataUrl: string) => unknown;
  export let cancelCallback: () => unknown;

  let imgRef: HTMLImageElement;
  let isError = false;
  let cropper: ImageCrop | undefined;

  $: position = cropper ? cropper.position : readable(null);
  $: dirty = cropper ? cropper.dirty : readable(false);

  const handleImageLoad = () => {
    isError = false;
    cropper = new ImageCrop(imgRef);
  };

  let prevWidth: number | undefined;
  let offsetWidth: number;
  const handleResize = (width: number) => {
    if (!cropper) return;
    cropper.newWidthUpdate(prevWidth ? width / prevWidth : 1);
    prevWidth = width;
  };
  $: handleResize(offsetWidth);
  let actionsRef: HTMLDivElement | undefined;

  const handleExtract = async () => {
    if (!cropper) return;
    const blob = await cropper.extractCrop();
    extract(URL.createObjectURL(blob));
  };

  onMount(() => {
    /** Wrapper element's dimensions might be resized several times
     * on initial render. In order for resize adjustments to work,
     * the element needs to be stable. It is considered stable
     * when its offsetWidth has not changed in a 30ms interval. */
    interval(30)
      .pipe(
        map(() => offsetWidth),
        startWith(offsetWidth),
        pairwise(),
        takeWhile(([prev, current]) => prev !== current),
        finalize(() => {
          prevWidth = offsetWidth;
        })
      )
      .subscribe();
  });
</script>

<div class="relative" style:margin-right={`${actionsRef?.clientWidth ?? 0}px`}>
  <div class="absolute left-full top-0" bind:this={actionsRef}>
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
    bind:offsetWidth
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

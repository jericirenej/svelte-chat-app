<script lang="ts">
  import { AVATAR } from "../../../../constants";
  import type { EventType, ImageCrop } from "../crop";
  import CropMove from "./CropMove/CropMove.svelte";
  import CropResize from "./CropResize/CropResize.svelte";

  export let backdropBrightness: number;
  export let cropper: ImageCrop;

  let cropRef: HTMLDivElement;

  $: brightness = `brightness(${backdropBrightness})`;

  const addRemoveListener = (ev: EventType) => {
    cropper.removeListeners(ev);
  };

  const handleDown = (ev: EventType) => {
    cropper.addMoveListener(ev, window.document.body);
  };

  const handleResize = (ev: EventType) => {
    cropper.addDragResizeListener(ev, window.document.body);
  };
  const handleHover = (ev: EventType) => {
    return cropper.getRegionFromEvent(ev);
  };
</script>

<svelte:document on:mouseup={addRemoveListener} on:touchend={addRemoveListener} />
<div
  bind:this={cropRef}
  style:border-radius={AVATAR.borderRadius}
  class="relative h-full w-full"
  style:backdrop-filter={brightness}
>
  <CropResize borderWidth={3} handleDown={handleResize} {handleHover} />
  <CropMove {handleDown} />
</div>

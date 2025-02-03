<script lang="ts">
  import { writable } from "svelte/store";
  import { AVATAR_SIZE_LIMIT, AVATAR_SIZE_LIMIT_ERR } from "../../../constants";
  import { IMAGE_CROP } from "../../../messages";
  import type { Maybe } from "../../../types";
  import CroppedAvatar from "../../molecular/CroppedAvatar/CroppedAvatar.svelte";
  import Overlay from "../../molecular/Overlay/Overlay.svelte";
  import Upload from "../../molecular/Upload/Upload.svelte";
  import CropImage from "../CropImage/CropImage.svelte";
  import { uploadHandler } from "./handlers";

  enum State {
    upload = "UPLOAD",
    crop = "CROP",
    end = "END"
  }

  let imageRef: Maybe<HTMLImageElement>;
  let innerWidth: number;
  let innerHeight: number;

  const setWidth = (imgRef: Maybe<HTMLImageElement>, innerHeight: number, innerWidth: number) => {
    const percent = 0.8;
    if (!imgRef) return "auto";
    const aspectRatio = imgRef.naturalWidth / imgRef.naturalHeight;
    let maxWidth = percent * innerWidth;
    const isOverflowing = aspectRatio * maxWidth > innerHeight;
    if (isOverflowing) {
      maxWidth = (innerHeight * percent) / aspectRatio;
    }
    return `${maxWidth}px`;
  };
  const imageUrl = writable<string | null>(null);
  const croppedUrl = writable<string | null>(null);

  let state = State.upload;
  let errBlock: Record<`is${string}`, boolean> & Record<`${string}Message`, Maybe<string>> = {
    isUploadError: false,
    errMessage: undefined
  };

  const handleUploadChange = async (ev: Event) => {
    const { target } = ev;
    if (!(target instanceof HTMLInputElement && target.files?.length)) return;
    const result = await uploadHandler(target.files);
    if ("err" in result) {
      errBlock.isUploadError = true;
      errBlock.errMessage = result.err;
      return;
    }
    imageUrl.set(result.data);
    // Clear value so uploading an identical file after cancel will still trigger change
    target.value = "";
    state = State.crop;
  };

  $: cropDimension = setWidth(imageRef, innerWidth, innerHeight);

  const clear = () => {
    if (state === State.end) {
      imageUrl.set(null);
      croppedUrl.set(null);
      state = State.upload;
      return;
    }
    if (!$croppedUrl) {
      imageUrl.set(null);
      state = State.upload;
      return;
    }
    state = State.end;
  };
  const extract = (val: Maybe<string>) => {
    if (!val) {
      clear();
      return;
    }
    $croppedUrl = val;
    state = State.end;
  };
</script>

<svelte:window bind:innerHeight bind:innerWidth />

{#if $imageUrl}
  <!-- svelte-ignore a11y-missing-attribute -->
  <img bind:this={imageRef} src={$imageUrl} class="hidden" />
{/if}
{#if state !== State.end && !$croppedUrl}
  <div>
    <Upload
      bind:isError={errBlock.isError}
      errMessage={errBlock.errMessage}
      title={IMAGE_CROP.addAvatarTitle}
      label={IMAGE_CROP.addAvatar}
      accept=".jpg,.png,.webp"
      on:change={handleUploadChange}
    />
  </div>
{/if}
{#if state === State.crop}
  <Overlay on:close={clear}>
    <div style:width={cropDimension}>
      <CropImage cancelCallback={clear} src={$imageUrl} {extract} />
    </div>
  </Overlay>
{/if}
{#if state !== State.upload && $croppedUrl}
  <CroppedAvatar
    src={$croppedUrl}
    deleteCb={clear}
    modifyCb={() => {
      state = State.crop;
    }}
    sizeLimit={AVATAR_SIZE_LIMIT}
    sizeLimitLabel={AVATAR_SIZE_LIMIT_ERR}
  />
{/if}

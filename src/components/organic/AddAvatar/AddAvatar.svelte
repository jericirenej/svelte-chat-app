<script context="module" lang="ts">
  import { writable } from "svelte/store";
  export const avatarBlob = writable<Maybe<Blob>>(null);
</script>

<script lang="ts">
  import { AVATAR_SIZE_LIMIT_ERR } from "../../../constants";
  import { SIGNUP_MESSAGES } from "../../../messages";
  import type { Maybe } from "../../../types";
  import CroppedAvatar from "../../molecular/CroppedAvatar/CroppedAvatar.svelte";
  import Overlay from "../../molecular/Overlay/Overlay.svelte";
  import Upload from "../../molecular/Upload/Upload.svelte";
  import CropImage from "../CropImage/CropImage.svelte";
  import { uploadHandler } from "./handlers";

  export let sizeLimit: number;

  enum State {
    upload = "UPLOAD",
    crop = "CROP",
    end = "END"
  }

  let imageRef: Maybe<HTMLImageElement>;
  let innerWidth: number;
  let innerHeight: number;

  let imageUrl: Maybe<string> = null;
  let croppedUrl: Maybe<string> = null;

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
    imageUrl = result.data;
    // Clear value so uploading an identical file after cancel will still trigger change
    target.value = "";
    state = State.crop;
  };

  $: cropDimension = setWidth(imageRef, innerWidth, innerHeight);

  const clear = () => {
    if (state === State.end) {
      imageUrl = null;
      croppedUrl = null;
      updateBlob(null);
      state = State.upload;
      return;
    }
    if (!croppedUrl) {
      imageUrl = null;
      state = State.upload;
      return;
    }
    state = State.end;
  };

  const updateBlob = (blob: Maybe<Blob>) => {
    avatarBlob.set(blob);
  };
  const extract = (val: Maybe<string>) => {
    if (!val) {
      clear();
      return;
    }
    croppedUrl = val;
    state = State.end;
  };
</script>

<svelte:window bind:innerHeight bind:innerWidth />

{#if imageUrl}
  <!-- svelte-ignore a11y-missing-attribute -->
  <img bind:this={imageRef} src={imageUrl} class="hidden" />
{/if}
{#if state !== State.end && !croppedUrl}
  <div>
    <Upload
      bind:isError={errBlock.isError}
      errMessage={errBlock.errMessage}
      title={SIGNUP_MESSAGES.addAvatarTitle}
      label={SIGNUP_MESSAGES.addAvatar}
      accept=".jpg,.png,.webp,.avif"
      on:change={handleUploadChange}
    />
  </div>
{/if}
{#if state === State.crop}
  <Overlay on:close={clear}>
    <div class="avatar-crop" style:width={cropDimension}>
      <CropImage cancelCallback={clear} src={imageUrl} {extract} />
    </div>
  </Overlay>
{/if}
{#if state !== State.upload && croppedUrl}
  <CroppedAvatar
    src={croppedUrl}
    deleteCb={clear}
    modifyCb={() => {
      state = State.crop;
    }}
    {updateBlob}
    {sizeLimit}
    sizeLimitLabel={AVATAR_SIZE_LIMIT_ERR}
  />
{/if}

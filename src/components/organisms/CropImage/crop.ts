import { get, writable } from "svelte/store";
import { isNonNullish, isNullish } from "../../../helpers";
import type { Nullish } from "../../../types";

export type MoveDiff = Record<"xDiff" | "yDiff", number> & { regionOnDown: ClickRegion | Nullish };
export type EventClientPosition = Record<"clientX" | "clientY", number>;
const verticalDirections = ["n", "s"] as const;
type Vertical = (typeof verticalDirections)[number];
type Horizontal = "e" | "w";
export type ClickRegion = Vertical | Horizontal | `${Vertical}${Horizontal}`;

export type MoveCallback = (diff: MoveDiff) => unknown;
export type EventType = MouseEvent | TouchEvent;
export type EventListenerArgs = {
  ev: EventType;
  ref: HTMLElement;
  cb: (ev: MoveDiff) => unknown;
};

type Sides = "left" | "right" | "top" | "bottom";
type Dimensions = "width";
type Position = Record<Sides | Dimensions, string>;
type PositionNumber = Record<Sides | Dimensions, number>;

export const getPositionFromEvent = (ev: EventType): EventClientPosition => {
  const target = ev instanceof MouseEvent ? ev : ev.changedTouches[0];
  return { clientX: target.clientX, clientY: target.clientY };
};

const toPixel = <T extends number>(val: T): `${T}px` => `${val}px`;
const fromPixel = (val: string) => Number(val.replace("px", ""));
const zeroIfNegative = (val: number) => (val >= 0 ? val : 0);

class DragEventHandler {
  protected regionOnDown: ClickRegion | undefined = undefined;
  protected positionOnDown: EventClientPosition | undefined = undefined;
  protected isDown: boolean = false;
  protected registeredCallbacks: Set<{ cb: (ev: EventType) => unknown; ref: HTMLElement }> =
    new Set();

  removeListeners(ev: EventType): void {
    this.positionOnDown = undefined;
    this.isDown = false;
    const target = ev instanceof MouseEvent ? "mousemove" : "touchmove";
    this.registeredCallbacks.forEach(({ cb, ref }) => {
      ref.removeEventListener(target, cb);
    });
    this.registeredCallbacks.clear();
  }

  attachListenerOnDown({ cb, ev, ref }: EventListenerArgs): void {
    this.isDown = true;
    const evPosition = this.getPositionFromEvent(ev);
    this.positionOnDown = evPosition;
    this.regionOnDown = this.getRegionFromEvent(ev);
    const targetEvent = ev instanceof MouseEvent ? "mousemove" : "touchmove";
    const wrappedCb = this.passDiffToCallback(cb);
    ref.addEventListener(targetEvent, wrappedCb);
    this.registeredCallbacks.add({ ref, cb: wrappedCb });
  }

  protected passDiffToCallback(cb: (args: MoveDiff) => unknown) {
    return (ev: EventType) => {
      if (!(this.isDown && this.positionOnDown)) return;
      const newPosition = this.getPositionFromEvent(ev);
      cb({
        xDiff: newPosition.clientX - this.positionOnDown.clientX,
        yDiff: newPosition.clientY - this.positionOnDown.clientY,
        regionOnDown: this.regionOnDown
      });
      this.positionOnDown = newPosition;
    };
  }

  protected getPositionFromEvent(ev: EventType): EventClientPosition {
    const target = ev instanceof MouseEvent ? ev : ev.changedTouches[0];
    return { clientX: target.clientX, clientY: target.clientY };
  }

  getRegionFromEvent(ev: EventType): ClickRegion | undefined {
    if (!ev.currentTarget) return undefined;
    const target = ev instanceof MouseEvent ? ev : ev.changedTouches[0];
    const { clientX, clientY } = target;
    const { height, width, top, bottom, left, right } = (
      ev.currentTarget as HTMLDivElement & EventType
    ).getBoundingClientRect();
    const horizontalBuffer = width / 4,
      verticalBuffer = height / 4;
    const yRegion = (
      clientY <= top + verticalBuffer ? "n" : clientY >= bottom - verticalBuffer ? "s" : undefined
    ) satisfies ClickRegion | Nullish;
    const xRegion = (
      clientX <= left + horizontalBuffer
        ? "w"
        : clientX >= right - horizontalBuffer
          ? "e"
          : undefined
    ) satisfies ClickRegion | Nullish;
    if (!yRegion && !xRegion) return undefined;
    return [yRegion, xRegion].filter((region) => isNonNullish(region)).join("") as ClickRegion;
  }
}

export class ImageCrop {
  public dirty = writable<boolean>(false);
  public position = writable<Position | null>(null);
  protected eventHandler = new DragEventHandler();

  constructor(public readonly imgRef: HTMLImageElement) {
    this.calculateInitialPosition();
  }

  protected get aspectRatio(): number {
    return this.imgRef.width / this.imgRef.height;
  }
  protected get isPortrait(): boolean {
    return this.aspectRatio < 1;
  }

  getRegionFromEvent(ev: EventType): ClickRegion | undefined {
    return this.eventHandler.getRegionFromEvent(ev);
  }

  calculateInitialPosition(): Position {
    const width = this.getAdjustedWidth(this.imgRef.width);
    const yOffset = this.remainingImageAxisSpace(width, "height") / 2,
      xOffset = this.remainingImageAxisSpace(width, "width") / 2;

    const position: Position = this.toPositionAsPixel({
      width: width,
      top: yOffset,
      bottom: yOffset,
      left: xOffset,
      right: xOffset
    });
    this.position.set(position);
    this.dirty.set(false);
    return position;
  }

  addMoveListener(ev: EventType, ref: HTMLElement) {
    this.eventHandler.attachListenerOnDown({ cb: this.moveUpdate.bind(this), ev, ref });
  }

  addDragResizeListener(ev: EventType, ref: HTMLElement) {
    this.eventHandler.attachListenerOnDown({ cb: this.resizeDragUpdate.bind(this), ev, ref });
  }
  removeListeners(ev: EventType) {
    this.eventHandler.removeListeners(ev);
  }

  resizeDragUpdate({ yDiff, xDiff, regionOnDown }: MoveDiff) {
    if (!regionOnDown) return;
    const current = this.getPositionAsNumber();
    let change!: number;
    if (regionOnDown.length === 2) {
      const isYMax = Math.abs(yDiff) > Math.abs(xDiff);
      const maxSide = isYMax ? yDiff : xDiff;
      if (regionOnDown === "sw") {
        change = isYMax ? maxSide : -maxSide;
      } else if (regionOnDown === "ne") {
        change = isYMax ? -maxSide : maxSide;
      } else {
        change = maxSide;
      }
    }
    if (regionOnDown.length === 1) {
      change = verticalDirections.some((direction) => direction === regionOnDown) ? yDiff : xDiff;
    }

    const adjustWidth = (updatedWidth: number) =>
      Math.ceil(
        updatedWidth > current.width
          ? Math.min(updatedWidth, this.getAdjustedWidth(this.imgRef.width))
          : Math.max(updatedWidth, 15)
      );
    const isSame = (newWidth: number) => newWidth === current.width;

    switch (regionOnDown) {
      case "n":
      case "w":
      case "nw": {
        const newWidth = adjustWidth(current.width - change);
        if (isSame(newWidth)) return;
        current.width = newWidth;
        current.top += change;
        current.left += change;
        break;
      }
      case "s":
      case "se":
      case "ne":
      case "e": {
        const newWidth = adjustWidth(current.width + change);
        if (isSame(newWidth)) return;
        current.width = newWidth;
        if (["s", "se"].includes(regionOnDown)) {
          current.bottom -= change;
        } else {
          current.top -= change;
        }
        current.right -= change;
        break;
      }
      case "sw": {
        current.width += change;
        current.bottom -= change;
        current.left -= change;
        break;
      }
      default:
        return;
    }
    for (const val of Object.values(current)) {
      if (val < 0) return;
    }
    this.position.set(this.toPositionAsPixel(current));
    this.dirty.set(true);
  }
  moveUpdate({ xDiff, yDiff }: MoveDiff): void {
    const { bottom, left, right, top, width } = this.getPositionAsNumber();
    const newPosition = { width } as PositionNumber;
    // For negative diffs, we calculate the new position for top and left,
    // taking care that they do not go below zero (overflow).
    // Then, the complementary point is calculated.
    //
    // Vice versa for positive diffs.
    if (yDiff < 0) {
      newPosition.top = zeroIfNegative(yDiff + top);
      newPosition.bottom = bottom + top - newPosition.top;
    } else {
      newPosition.bottom = zeroIfNegative(bottom - yDiff);
      newPosition.top = top + bottom - newPosition.bottom;
    }

    if (xDiff < 0) {
      newPosition.left = zeroIfNegative(xDiff + left);
      newPosition.right = right + left - newPosition.left;
    } else {
      newPosition.right = zeroIfNegative(right - xDiff);
      newPosition.left = left + right - newPosition.right;
    }

    this.position.set(this.toPositionAsPixel(newPosition));
    this.dirty.set(true);
  }

  newWidthUpdate(changeRatio: number): void {
    const positionAsNumber = this.getPositionAsNumber();
    this.position.set(
      this.toPositionAsPixel(
        Object.entries(positionAsNumber).reduce((acc, [key, value]) => {
          acc[key as keyof Position] = value * changeRatio;
          return acc;
        }, {} as PositionNumber)
      )
    );
  }

  reset(): void {
    this.calculateInitialPosition();
  }

  async extractCrop(): Promise<Blob> {
    const { left, top, width } = this.getPositionAsNumber();
    const { naturalHeight, naturalWidth, width: imageWidth, height } = this.imgRef;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const widthRatio = naturalWidth / imageWidth,
      heightRatio = naturalHeight / height;
    canvas.width = width * widthRatio;
    canvas.height = width * widthRatio;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      this.imgRef,
      left * widthRatio,
      top * heightRatio,
      width * widthRatio,
      height * heightRatio,
      0,
      0,
      width * widthRatio,
      height * heightRatio
    );

    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
        },
        "image/webp",
        0.7
      );
    });
    return blob;
  }

  protected remainingImageAxisSpace(size: number, dimension: "width" | "height"): number {
    return this.imgRef[dimension] - size;
  }

  protected getPositionAsNumber(): PositionNumber {
    const position = get(this.position);
    if (isNullish(position)) {
      throw new Error("Can't extract position numbers, if position not set!");
    }
    return Object.entries(position).reduce((acc, [key, value]) => {
      acc[key as keyof Position] = fromPixel(value);
      return acc;
    }, {} as PositionNumber);
  }

  protected toPositionAsPixel(pos: PositionNumber): Position {
    return Object.entries(pos).reduce((acc, [key, value]) => {
      acc[key as keyof Position] = toPixel(value);
      return acc;
    }, {} as Position);
  }

  protected getAdjustedWidth(width: number): number {
    if (this.isPortrait) return width;
    return (1 / this.aspectRatio) * width;
  }
}

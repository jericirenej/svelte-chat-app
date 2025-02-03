import type { ComponentProps, SvelteComponent } from "svelte";
import type { RemoveIndexSignature } from "../../types";

export type CreateProps<T extends SvelteComponent> = RemoveIndexSignature<ComponentProps<T>>;

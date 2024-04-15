<script lang="ts">
  import { flip } from "svelte/animate";
  import type { Writable } from "svelte/store";
  import type { NotificationEntry } from "../../../../types";
  import Notification from "../../Notification/Notification.svelte";

  export let notifications: Writable<Map<string, NotificationEntry>>;
  /** Passing 0 or Infinity will prevent notifications from being automatically dismissed. */
  export let lifespan = 5e3;
  const handleClose = (id: string) => {
    notifications.update((n) => {
      n.delete(id);
      return n;
    });
  };
</script>

<ul class="flex flex-col gap-3">
  {#each Array.from($notifications) as [id, args] (id)}
    <li animate:flip={{ duration: 200 }}>
      <Notification
        {lifespan}
        close={() => {
          handleClose(id);
        }}
        {...args}
      />
    </li>
  {/each}
</ul>

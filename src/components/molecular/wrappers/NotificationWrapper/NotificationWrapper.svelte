<script lang="ts">
  import type { Writable } from "svelte/store";
  import type { NotificationEntry } from "../../../../types";
  import Notification from "../../Notification/Notification.svelte";
  import { flip } from "svelte/animate";

  export let notifications: Writable<Map<string, NotificationEntry>>;
  const handleClose = (id: string) => {
    notifications.update((n) => {
      n.delete(id);
      return n;
    });
  };
</script>

<ul class="flex flex-col gap-3">
  {#each Array.from($notifications) as [id, args] (id)}
      <li animate:flip={{duration: 200}}>
        <Notification
          close={() => {
            handleClose(id);
          }}
          {...args}
        />
      </li>
  {/each}
</ul>

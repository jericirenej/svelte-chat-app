<script lang="ts">
  import type { NotificationStore } from "$lib/client/stores";
  import { flip } from "svelte/animate";
  import Notification from "../../Notification/Notification.svelte";

  export let notifications: NotificationStore;
  /** Passing 0 or Infinity will prevent notifications from being automatically dismissed. */
  export let lifespan = 5e3;
  const handleClose = (id: string) => {
    notifications.removeNotification(id);
  };
</script>

<ul class="flex flex-col gap-3">
  {#each Array.from($notifications) as [id, { lifespan: notificationLifespan, ...rest }] (id)}
    <li animate:flip={{ duration: 200 }}>
      <Notification
        lifespan={notificationLifespan ?? lifespan}
        close={() => {
          handleClose(id);
        }}
        {...rest}
      />
    </li>
  {/each}
</ul>

<script lang="ts">
  import ProfileIcon from "@iconify/icons-eos-icons/daemon-outlined.js";
  import HomeIcon from "@iconify/icons-humbleicons/home.js";
  import LogoutIcon from "@iconify/icons-humbleicons/logout.js";
  import Icon, { type IconifyIcon } from "@iconify/svelte";
  import { PROFILE_ROUTE, ROOT_ROUTE } from "../../../constants";

  export let routeId: string | null;
  export let handleLogout: () => Promise<void>;

  const classes = {
    li: "border-t border-r transition-[color,_background-color] first:rounded-bl-md last:border-r-0 hover:bg-neutral-100 hover:text-slate-700",
    icon: "inline-block aspect-square text-3xl",
    anchorOrButton:
      "group flex py-2 w-full items-center justify-center hover:bg-neutral-100 hover:text-slate-700 rounded-[inherit]",
    visited:
      "absolute -left-3 top-1/2 h-2/3 w-1 -translate-y-1/2 rounded-md bg-neutral-100 hover:bg-slate-700 group-hover:bg-slate-700"
  };

  type Template = { icon: IconifyIcon; title: string; href?: string };

  const template: Template[] = [
    { icon: HomeIcon, href: ROOT_ROUTE, title: "Homepage" },
    { icon: ProfileIcon, href: PROFILE_ROUTE, title: "Profile" },
    { icon: LogoutIcon, title: "Logout" }
  ];
</script>

<ul class="grid grid-cols-3 rounded-[inherit]">
  {#each template as { icon, href, title }}
    <li class={classes.li}>
      {#if href}
        <a {title} class={classes.anchorOrButton} {href}>
          <span class="relative">
            <Icon {icon} class={classes.icon} />
            {#if routeId === href}
              <span role="presentation" class={classes.visited} />
            {/if}
          </span>
        </a>
      {:else}
        <button
          type="button"
          class={classes.anchorOrButton}
          {title}
          on:click|preventDefault={handleLogout}><Icon {icon} class={classes.icon} /></button
        >
      {/if}
    </li>
  {/each}
</ul>

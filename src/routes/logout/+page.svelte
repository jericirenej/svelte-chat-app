<script lang="ts">
  import { goto } from "$app/navigation";
  import { CSRF_HEADER, LOCAL_SESSION_CSRF_KEY } from "../../constants.js";
</script>

<button
  role="link"
  type="button"
  on:click={async (e) => {
    const csrf = localStorage.getItem(LOCAL_SESSION_CSRF_KEY);
    if (!csrf) return;
    const result = await fetch("/logout", {
      method: "DELETE",
      headers: {
        [CSRF_HEADER]: csrf
      }
    });
    if (result.status === 200) goto("/");
  }}>LOGOUT</button
>

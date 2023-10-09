<script lang="ts">
  import { enhance } from "$app/forms";
</script>

<form method="POST" use:enhance>
  <h1>LOGIN</h1>
  <section>
    <label for="username">Username:</label>
    <input id="username" name="username" type="text" />
  </section>
  <section>
    <label for="password">Username:</label>
    <input id="password" name="password" type="password" />
  </section>
  <button type="submit">Login</button>
</form>

<style lang="scss">
  form {
    display: flex;
    gap: 1rem;
    font-size: 12px;
  }
</style>

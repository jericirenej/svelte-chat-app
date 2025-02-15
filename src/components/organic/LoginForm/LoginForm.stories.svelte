<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import LoginFormComponent from "./LoginForm.svelte";

  type Props = ComponentProps<LoginFormComponent> & {
    responseType: 200 | 404;
  };

  export const meta: Meta<Props> = {
    title: "Organisms/Login",
    component: LoginFormComponent,
    argTypes: {
      formData: { table: { disabled: true } },
      postCall: { table: { disabled: true } },
      responseType: { control: "radio", options: [200, 404] }
    }
  };
</script>

<script lang="ts">
  import { loginSchema, type LoginFormData } from "$lib/client/login-signup.validators";
  import { loginCall } from "$lib/client/session-handlers";
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import type { ComponentProps } from "svelte";
  import { zod } from "sveltekit-superforms/adapters";
  import { superValidate } from "sveltekit-superforms/server";
  const data = async (): Promise<LoginFormData> => await superValidate(zod(loginSchema));
  const handler = (ev: Event) => {
    console.log("ENHANCE EVENT");
  };
  window.addEventListener("storybook:enhance", (ev: Event) => {
    console.log("STORYBOOK ENHANCE", ev);
  });
</script>

<Template let:args>
  {#await data() then formData}
    <LoginFormComponent {formData} postCall={loginCall} />
  {/await}
</Template>

<Story name="Login" />

<script context="module" lang="ts">
  import type { Meta } from "@storybook/svelte";
  import { http, HttpHandler, HttpResponse } from "msw";
  import LoginFormComponent from "./LoginForm.svelte";

  type Props = ComponentProps<LoginFormComponent> & {
    responseType: 200 | 404;
  };

  export const meta: Meta<Props> = {
    title: "Organic/Login",
    component: LoginFormComponent,
    argTypes: {
      formData: { table: { disabled: true } },
      postCall: { table: { disabled: true } },
      responseType: { control: "radio", options: [200, 404] }
    },
    msw: {
      handlers: [
        http.post("/login", () => {
          return HttpResponse.json(
            { form: { user: "user", password: "password" } },
            { status: 200 }
          );
        })
      ]
    }
  };
</script>

<script lang="ts">
  import { Story, Template } from "@storybook/addon-svelte-csf";
  import { superValidate } from "sveltekit-superforms/server";
  import { zod } from "sveltekit-superforms/adapters";
  import {
    loginSchema,
    type LoginFormData,
    type LoginSchema
  } from "$lib/client/login-signup.validators";
  import type { RemoveIndexSignature } from "../../../types";
  import type { ComponentProps } from "svelte";
  import { writable } from "svelte/store";
  import type { SubmitFunction } from "@sveltejs/kit";
  import { loginCall } from "$lib/client/session-handlers";
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

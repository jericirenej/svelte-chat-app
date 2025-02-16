# Svelte Chat App

A chat application created with on SvelteKit, Kysely, PostgreSQL, Redis, and WebSockets.

Goals:

- Allow users to be registered and removed.
- Provide users with overview of chats that they are a part of and allow them to create new chats or leave them.
- Provide real-time indications of other chat participants' activity (i.e. typing hints).
- Handle user sessions securely with CSRF tokens, routing guards and authorization checks when performing database operations
- Ensure adequate tests are present
- Atomic design and Storybook stories where possible for UI components.

Reason for creating: Explore the functionalities of frameworks and libraries on which the application depends.

## Setup

- Have `node, npm` and `Docker|Podman` available on your system.
- Run `npm install`.
- Create an `.env` file, base on the information provided in `.env-example`.
- Create containers and volumes via `docker compose up -d` or `podman-compose up -d`.
  - Update the `MINIO_TOKEN` and `MINIO_SECRET` environment variables after creating the token in the MinioConsole (accessible at port 9001).
- Run `npm run migrator migrate` to create the initial database.
  - Optionally, you can also run `npm run seed` to pre-populate the database with default users and chats (note that you need to setup the Minio access token beforehand otherwise the seed will fail).
  - For the base users usernames, check the `utils/users.ts` file. Each base user's password is auto-generated in the following pattern `username-password`, so for example `lovelace-password`.
- Run `npm run dev` to start the application.

## Areas for improvement

- Responsive design: the application was designed as a purely desktop application, so there is no specific styling for different viewports.
- User management:
  - The profile tab offers information and the possibility of account deletion, but not the ability to change any of the profile fields, avatar, or password.
  - While backend services include user role management and permission checks logic for handling user, admins, and superAdmin groups, these features are not implemented in the frontend.
  - User's email property has no role. In a real application, it would function as an authorization source (confirming signup, password resets, etc.).
- Chats:
  - Users become participants of a chat when a chat is created by a user, but they cannot join an already existing chat.
  - No "contacts" system (all users discoverable and can message anyone).
  - Messages cannot be edited or deleted. Plain text messages only.
- Transitioning to Svelte 5 and Tailwind 4

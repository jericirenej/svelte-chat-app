## Current todo list:

- DB related:
  - _username_ should be enofrced as lowercase only
  - _getMessagesForChat_ should have a "includeDeleted" filter option that defaults to false
  - _username_ should have a minimum number of characters constraint
  - Limit number of concurrent logins per user

Svelte related:

- Updating user details changes the user session

## Future features:

- _Contacts_ feature: invite system with pending/accepted/rejected invites.
  - Connected to this are the _Privacy_ features:
    - Users can choose that only contacts can message them
    - Users can manage their contacts.
    - Chats can be private or public.
    - Managing pending invitations would require a separate table to store the status. After an invitation is accpeted, it should be marked as accepted. Rejected and ignored should also be marked.
- _Joining and existing chat_: After chat is crated, there is the question of how users should be able to join it, if they are not the original members. There are several options:
  - Implicit join by posting a message to it. Presupposes that chats are always public.
  - Implicit join by posting a message OR by accepting an invite. Presupposes private|public chat distinction.

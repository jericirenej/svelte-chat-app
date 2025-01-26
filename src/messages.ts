import { REDIRECT_AFTER_EXPIRE_DELAY } from "./constants";
import { capitalize } from "./helpers";

export const APP_NAME = "Chat App";

export const LOGIN_MESSAGES = {
  pageTitle: `${APP_NAME} - Login`,
  title: "Sign in",
  subtitle: "...and start chatting!",
  signup: "Not registered yet? Create an account!",
  supplyDetailsTitle: "Please supply a username and password.",
  usernamePlaceholder: "Enter your username",
  passwordPlaceholder: "Enter your password",
  success: "Login successful!",
  failure: "Username or password not correct!"
};

export const SIGNUP_MESSAGES = {
  pageTitle: `${APP_NAME} - Signup`,
  title: "Create an account",
  subtitle: LOGIN_MESSAGES.subtitle,
  login: "Already registered? Try logging in!",
  usernamePlaceholder: LOGIN_MESSAGES.usernamePlaceholder,
  emailPlaceholder: "Enter your email",
  namePlaceholder: "Name (optional)",
  surnamePlaceholder: "Surname (optional)",
  passwordPlaceholder: LOGIN_MESSAGES.passwordPlaceholder,
  passwordVerifyPlaceholder: "Confirm password",
  success: "Successfully registered!",
  failure: "Registration failed on the server. Please try again.",
  duplicateFailure: "Username or email combination already taken.",
  badRequestFailure: "Please fill out the signup form as indicated to sign up.",
  supplyDetailsTitle: "Please supply a username, email, and password."
};

export const PROFILE_MESSAGES = {
  pageTitle: `${APP_NAME} - Profile`,
  deleteButton: "Delete account",
  deleteDialogHeading: "Are you sure you want to DELETE your account?",
  deleteMessage:
    "This action cannot be undone. All of you account information, together with stored messages will be deleted permanently!",
  deleteConfirm: "Do it!"
};

export const NOTIFICATION_MESSAGES = {
  403: "Authorization failed",
  defaultSuccess: "Success!",
  defaultFail: "Failed!",
  deleteAccountSuccess: "Account deletion successful.",
  leftChatSuccess: "Left chat",
  logoutSuccess: "Logged out\t👋",
  extend: {
    initial: "Session will expire soon.\nClick here to extend.",
    fail: "Failed to extend session\t😭",
    success: "Session extended\t👍",
    redirectNotification: `Your session has expired. You will be redirected to login in ${
      REDIRECT_AFTER_EXPIRE_DELAY / 1000
    } seconds.`
  }
};

export const TIME_DISPLAY_MESSAGES = {
  now: "Now",
  future: "Coming from the future...",
  minutes: (val: number) => `${val} ${val === 1 ? "minute" : "minutes"} ago`
};

export const CONVERSATION_MESSAGES = {
  message: "Message",
  from: "Message author",
  publishedAt: "Sent date",
  send: "Send message",
  sendEmpty: "Write something first, to be able to send a message",
  textPlaceholder: "Write something...",
  sendError: "Sending message failed. Please try again.",
  ownMessageAuthor: "You",
  missingAuthor: "Missing user",
  newMessagesInvisible: "New message received. Click here to show it.",
  containerLabel: "List of messages for the current chat",
  unreadMessages: "Number of unread messages in this chat",
  leaveChat: "Leave chat",
  leaveChatMessage: "Are you sure you want to leave the chat?"
};

export const avatarLabel = (name: string) => `${capitalize(name)} avatar`;

export const ENTITY_LIST = {
  remove: "Remove",
  searchLabel: "User search",
  searchPlaceholder: "Search for users"
};

export const CREATE_CHAT = {
  pageTitle: `${APP_NAME} - New chat`,
  title: "Create new chat",
  chatLabel: "Label (Optional)",
  submitText: "Create chat",
  supplyDetailsTitle: "Pick at least one chat participant. Add optional chat label."
};

export const LENGTH_ERR_MESSAGES = {
  overMax: (val: number) => `A maximum of ${val} characters permitted.`,
  underMin: (val: number) => `Should contain at least ${val} characters.`
};

export const PREVIEW_LIST_TITLE = "Chats";
export const PREVIEW_LIST_EMPTY = "No active chats. Go and talk to someone!";
export const PREVIEW_LIST_NO_MESSAGES = "No messages yet...";

export const IMAGE_CROP = {
  alt: "Upload profile image",
  error: "Failed to load image",
  reset: "Reset",
  cancel: "Cancel",
  confirm: "Confirm",
  pristine: "Can't reset, since no changes have been made to the original crop."
};

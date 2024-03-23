export const APP_NAME = "Chat App";
export const EXPIRATION_MESSAGES = {
  initial: "Session will expire soon.\nClick here to extend.",
  fail: "Failed to extend session\t😭",
  success: "Session extended\t👍"
};

export const LOGIN_MESSAGES = {
  pageTitle: `${APP_NAME} - Login`,
  title: "Sign in",
  subtitle: "...and start chatting!",
  signup: "Not registered? Create an account!",
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
  namePlaceholder: "Enter your name (optional)",
  surnamePlaceholder: "Enter your surname (optional)",
  passwordPlaceholder: LOGIN_MESSAGES.passwordPlaceholder,
  passwordVerifyPlaceholder: "Confirm password",
  success: "Successfully registered!",
  failure: "Registration failed! Please try again or log in, if you already have an account.",
  usernameFailure: "Username already taken. Please choose a different one.",
  badRequestFailure: "Please fill out the signup form as indicated to sign up.",
  supplyDetailsTitle: "Please supply a username, email, and password.",
};

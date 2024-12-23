import { CSRF_HEADER, LOCAL_SESSION_CSRF_KEY } from "../../constants";

export const setCSRFLocal = (csrfToken: string | undefined): boolean => {
  if (!csrfToken) return false;
  localStorage.setItem(LOCAL_SESSION_CSRF_KEY, csrfToken);
  return true;
};

export const getCSRFLocal = () => localStorage.getItem(LOCAL_SESSION_CSRF_KEY);

export const csrfHeader = (csrf: string) => ({ [CSRF_HEADER]: csrf });

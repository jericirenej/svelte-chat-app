import { redisService, type CompleteUserDto } from "@db";
import { getSessionFromCsrfToken, verifyCsrfToken } from "./password-utils.js";

type BaseAuthenticationArgs = { sessionId: string | undefined; csrfToken: string | null };

type AuthenticationArgs = BaseAuthenticationArgs & { method?: string };
type AuthenticationArgsHTTP = Required<AuthenticationArgs>;
type AuthenticationReturn = CompleteUserDto | null;

const authenticateUser = async ({
  sessionId,
  csrfToken,
  method
}: AuthenticationArgs): Promise<AuthenticationReturn> => {
  if (!sessionId) return null;
  const user = await redisService.getSession(sessionId);
  if (!user) return null;
  if (method === "GET") return user;
  // All non-GET requests, such as POST, PUT, PATCH, or DELETE
  // must satisfy the csrf token header check

  if (!(csrfToken && verifyCsrfToken(csrfToken))) return null;

  const csrfSession = getSessionFromCsrfToken(csrfToken);

  if (csrfSession !== sessionId) return null;
  return user;
};

export const authenticateUserHTTP = async (
  authArgs: AuthenticationArgsHTTP
): Promise<AuthenticationReturn> => {
  return await authenticateUser(authArgs);
};

export const authenticateUserWS = async (
  authArgs: BaseAuthenticationArgs
): Promise<AuthenticationReturn> => {
  return await authenticateUser(authArgs);
};

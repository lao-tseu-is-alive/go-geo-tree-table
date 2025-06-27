import axios from "axios";
import { getLog, BACKEND_URL, defaultAxiosTimeout } from "@/config";

// Logger setup
const log = getLog("AuthService", 4, 1);

// Centralized session storage keys
const SESSION_KEYS = {
  JWT_TOKEN: "_goapi_jwt_session_token",
  USER_ID: "_goapi_idgouser",
  USER_EXTERNAL_ID: "_goapi_user_external_id",
  NAME: "_goapi_name",
  USERNAME: "_goapi_username",
  EMAIL: "_goapi_email",
  IS_ADMIN: "_goapi_isadmin",
  DATE_EXPIRATION: "_goapi_date_expiration",
  SESSION_UUID: "_goapi_session_uuid",
  GROUPS: "_goapi_groups",
} as const;

// Custom error class for authentication errors
class AuthError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "AuthError";
  }
}

// Interface for the JWT payload from the backend
interface JwtPayload {
  User: {
    user_id: number;
    external_id: string;
    login: string;
    email: string;
    is_admin: boolean;
  };
  name: string;
  exp: number;
}

// Interface for the user profile data stored in the session
interface UserProfile {
  jwtToken: string;
  userId: number;
  userExternalId: string;
  name: string;
  username: string;
  email: string;
  isAdmin: boolean;
  dateExpiration: number;
  sessionUuid: string;
  groups: string | null;
}

// Session storage manager to encapsulate prefixing logic
class SessionStorageManager {
  constructor(private appName: string) {}

  set(key: string, value: string): void {
    sessionStorage.setItem(`${this.appName}${key}`, value);
  }

  get(key: string): string | null {
    log.t(`session get called with key:${key}, appName:${this.appName}${key}`);
    return sessionStorage.getItem(`${this.appName}${key}`);
  }

  remove(key: string): void {
    sessionStorage.removeItem(`${this.appName}${key}`);
  }

  clearAll(): void {
    // Clear all keys associated with this app instance
    Object.values(SESSION_KEYS).forEach((key) => this.remove(key));
    log.t("Session storage cleared for app:", this.appName);
  }
}

export class AuthService {
  private readonly appName: string;
  private readonly session: SessionStorageManager;
  private userProfileCache: UserProfile | null | undefined = undefined;

  /**
   * Initializes the AuthService with the application name.
   * @param appName - The name of the application (must be non-empty).
   * @throws {Error} If appName is empty or invalid.
   */
  constructor(appName: string) {
    if (!appName?.trim()) {
      throw new Error("appName is required and must be a non-empty string");
    }
    this.appName = appName.trim();
    this.session = new SessionStorageManager(this.appName);
    log.t(`AuthService initialized with appName: ${this.appName}.`);
  }

  /**
   * Clears all session storage data and the in-memory cache.
   */
  public clearSession(): void {
    this.session.clearAll();
    this.userProfileCache = null;
    log.t("Session storage and cache cleared.");
  }

  /**
   * Checks session validity, retrieves user data, and caches it.
   * This is the single source of truth for session state.
   * @returns {UserProfile | null} The user profile if the session is valid, otherwise null.
   */
  public getUserProfile(): UserProfile | null {
    // Return from cache if already validated in this instance lifecycle
    if (this.userProfileCache !== undefined) {
      return this.userProfileCache;
    }

    log.t("# entering getUserProfile validation...");

    const jwtToken = this.session.get(SESSION_KEYS.JWT_TOKEN);
    const expiration = this.session.get(SESSION_KEYS.DATE_EXPIRATION);
    const userId = this.session.get(SESSION_KEYS.USER_ID);
    const email = this.session.get(SESSION_KEYS.EMAIL);

    if (!jwtToken || !expiration || !userId || !email) {
      log.w("# IN getUserProfile() - Missing one or more required session keys.");
      this.userProfileCache = null;
      return null;
    }

    const dateExpire = new Date(parseInt(expiration, 10) * 1000);
    const now = new Date();

    if (now > dateExpire) {
      log.w(`# IN getUserProfile() - SESSION EXPIRED. Expiration was: ${dateExpire.toString()}`);
      this.clearSession(); // Clear storage and cache
      return null;
    }

    const minutesUntilExpire = Math.floor((dateExpire.getTime() - now.getTime()) / 1000 / 60);
    log.l(`Yes, session exists and is valid for ${minutesUntilExpire} more minutes.`);

    // All checks passed, assemble the profile object
    const profile: UserProfile = {
      jwtToken,
      dateExpiration: parseInt(expiration, 10),
      userId: parseInt(userId, 10),
      email,
      isAdmin: this.session.get(SESSION_KEYS.IS_ADMIN) === "true",
      name: this.session.get(SESSION_KEYS.NAME) ?? "",
      username: this.session.get(SESSION_KEYS.USERNAME) ?? "",
      userExternalId: this.session.get(SESSION_KEYS.USER_EXTERNAL_ID) ?? "",
      sessionUuid: this.session.get(SESSION_KEYS.SESSION_UUID) ?? "",
      groups: this.session.get(SESSION_KEYS.GROUPS),
    };

    this.userProfileCache = profile; // Cache the valid profile
    return profile;
  }

  /**
   * Checks if a valid session exists.
   * @returns True if the session is valid, false otherwise.
   */
  public doesCurrentSessionExist(): boolean {
    return this.getUserProfile() !== null;
  }

  /**
   * Checks the status of the current JWT token on the server.
   * @param baseServerUrl - The base URL of the server (defaults to BACKEND_URL).
   * @returns A promise resolving to an object with status, message, error, and data.
   */
  public async getTokenStatus(baseServerUrl = BACKEND_URL): Promise<{
    msg: string;
    err: Error | null;
    status: number | undefined;
    data: any;
  }> {
    log.t("# entering getTokenStatus...");
    const profile = this.getUserProfile();
    if (!profile) {
      return { msg: "No valid session found locally.", err: new AuthError("No session"), status: 401, data: null };
    }

    try {
      const res = await axios.get(`${baseServerUrl}/goapi/v1/status`, {
        headers: {
          "Authorization": `Bearer ${profile.jwtToken}`,
          "X-Goeland-Token": profile.sessionUuid
        },
        timeout: defaultAxiosTimeout,
      });

      log.l("getTokenStatus() axios.get Success! response:", res);
      const dExpires = new Date(0);
      dExpires.setUTCSeconds(res.data.exp);
      const msg = `getTokenStatus() JWT token expiration: ${dExpires}`;
      log.l(msg);
      return { msg, err: null, status: res.status, data: res.data };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = `Error in getTokenStatus(): ${error.message}`;
        log.w(msg, error.response);
        return { msg, err: error, status: error.response?.status, data: null };
      }
      const msg = `Unexpected error in getTokenStatus(): ${error}`;
      log.e(msg);
      return { msg, err: error instanceof Error ? error : new Error(String(error)), status: undefined, data: null };
    }
  }

  /**
   * Logs out the user on the server and clears the local session.
   * @param baseServerUrl - The base URL of the server.
   * @throws {AuthError} If the logout request fails.
   */
  public async logoutAndResetToken(baseServerUrl: string): Promise<void> {
    log.t("# IN logoutAndResetToken()");
    const profile = this.getUserProfile();
    // Always clear local session, even if server call fails
    this.clearSession();

    if (!profile) {
      log.w("logoutAndResetToken called, but no local session was found.");
      return; // Nothing to do on the server
    }

    try {
      const response = await axios.get(`${baseServerUrl}/goapi/v1/logout`, {
        headers: { "Authorization": `Bearer ${profile.jwtToken}` }
      });
      log.l("logoutAndResetToken() Server logout Success! response:", response);
    } catch (error) {
      log.e("logoutAndResetToken() ## SERVER LOGOUT ERROR ##:", error);
      // We throw an error so the caller knows the server part failed,
      // but the local session is already cleared.
      throw new AuthError(`Server logout failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // --- GETTERS ---
  // All getters now rely on the centralized getUserProfile() method.

  public getLocalJwtTokenAuth(): string {
    return this.getUserProfile()?.jwtToken ?? "";
  }

  /**
   * Gets the token expiration timestamp.
   * @returns The expiration timestamp or 0 if no session exists.
   */
  public getDateExpiration(): number {
    return this.getUserProfile()?.dateExpiration ?? 0;
  }

  /**
   * Gets the user's email.
   * @returns The email or an empty string if no session exists.
   */
  public getUserEmail(): string {
    return this.getUserProfile()?.email ?? "";
  }

  /**
   * Gets the user's ID.
   * @returns The user ID or 0 if no session exists.
   */
  public getUserId(): number {
    return this.getUserProfile()?.userId ?? 0;
  }

  /**
   * Gets the user's name.
   * @returns The name or an empty string if no session exists.
   */
  public getUserName(): string {
    return this.getUserProfile()?.name ?? "";
  }

  /**
   * Gets the user's login.
   * @returns The login or an empty string if no session exists.
   */
  public getUserLogin(): string {
    return this.getUserProfile()?.username ?? "";
  }

  /**
   * Checks if the user is an admin.
   * @returns True if the user is an admin, false otherwise.
   */
  public getUserIsAdmin(): boolean {
    return this.getUserProfile()?.isAdmin ?? false;
  }

  public getSessionId(): string {
    return this.getUserProfile()?.sessionUuid ?? "";
  }

  public getUserGroupsArray(): number[] | null {
    const groups = this.getUserProfile()?.groups;
    if (!groups || groups === "null") return null;
    return groups.split(",").map((i) => parseInt(i.trim(), 10));
  }

  public getUserFirstGroups(): number | null {
    const groupsArray = this.getUserGroupsArray();
    return groupsArray?.[0] ?? null;
  }

  /**
   * Checks if the user has any groups.
   * @returns True if the user has groups, false otherwise.
   */
  public isUserHavingGroups(): boolean {
    const groups = this.getUserProfile()?.groups;
    return !!groups && groups !== "null";
  }
}

/**
 * Parses a JWT token to extract its payload.
 * @param token - The JWT token to parse.
 * @returns The parsed JWT payload.
 * @throws {AuthError} If the token is invalid or cannot be parsed.
 */
const parseJwt = (token: string): JwtPayload => {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) throw new Error("Invalid JWT format: Missing payload.");

    // Polyfill-like replacement for atob
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error) {
    log.e("Error parsing JWT:", error);
    throw new AuthError(`Invalid JWT token: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Authenticates a user, saves the session, and returns a JWT token.
 * @param appName - The application name for session storage.
 * @param baseServerUrl - The base server URL.
 * @param jwt_auth_url - The JWT authentication endpoint.
 * @param username - The user's username.
 * @param passwordHash - The hashed password.
 * @returns A promise resolving to an object with status, message, error, and data.
 * @throws {AuthError} If required parameters are missing.
 */
export async function getToken(
  appName: string,
  baseServerUrl: string,
  jwt_auth_url: string,
  username: string,
  passwordHash: string
): Promise<{
  msg: string;
  err: Error | null;
  status: number | undefined;
  data: any;
}> {
  if (!appName?.trim() || !username?.trim() || !passwordHash?.trim()) {
    throw new AuthError("appName, username, and passwordHash are required");
  }

  const session = new SessionStorageManager(appName.trim());
  const data = { username, password_hash: passwordHash };
  const login_url = `${baseServerUrl}${jwt_auth_url}`;
  log.t(`# entering getToken... ${login_url} data:`, data);

  try {
    const response = await axios.post(login_url, data);
    log.l("getToken() axios.post Success! response:", response.data);

    const jwtValues = parseJwt(response.data.token);
    log.l("getToken() parsed token values:", jwtValues);

    const dExpires = new Date(0);
    dExpires.setUTCSeconds(jwtValues.exp);
    log.l(`getToken() JWT token expiration: ${dExpires}`);

    // Store all values in session storage
    session.set(SESSION_KEYS.JWT_TOKEN, response.data.token);
    if (response.data.session) {
      session.set(SESSION_KEYS.SESSION_UUID, response.data.session);
    }
    session.set(SESSION_KEYS.USER_ID, String(jwtValues.User.user_id));
    session.set(SESSION_KEYS.USER_EXTERNAL_ID, jwtValues.User.external_id);
    session.set(SESSION_KEYS.NAME, jwtValues.name);
    session.set(SESSION_KEYS.USERNAME, jwtValues.User.login);
    session.set(SESSION_KEYS.EMAIL, jwtValues.User.email);
    session.set(SESSION_KEYS.IS_ADMIN, String(jwtValues.User.is_admin));
    session.set(SESSION_KEYS.DATE_EXPIRATION, String(jwtValues.exp));
    // Note: 'groups' are not in the standard JWT payload, so they won't be set here.
    // They would need to be fetched and set separately if required after login.

    return {
      msg: "getToken() axios.post Success.",
      err: null,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const msg = `getToken() Axios Error: ${error.message}`;
      log.w(msg, error.response);
      return { msg, err: error, status: error.response?.status, data: null };
    }
    const msg = `getToken() Unexpected Error: ${error}`;
    log.e(msg);
    return { msg, err: error instanceof Error ? error : new Error(String(error)), status: undefined, data: null };
  }
}

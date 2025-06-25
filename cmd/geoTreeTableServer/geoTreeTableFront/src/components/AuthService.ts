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

// Interface for JWT payload
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

// Session storage manager to encapsulate prefixing logic
class SessionStorageManager {
  constructor(private appName: string) {}

  set(key: string, value: string): void {
    sessionStorage.setItem(`${this.appName}${key}`, value);
  }

  get(key: string): string | null {
    return sessionStorage.getItem(`${this.appName}${key}`);
  }

  remove(key: string): void {
    sessionStorage.removeItem(`${this.appName}${key}`);
  }

  clear(keys: string[]): void {
    keys.forEach((key) => this.remove(key));
  }
}

export class AuthService {
  private readonly appName: string;
  private readonly session: SessionStorageManager;

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
   * Checks the status of the current JWT token.
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
    axios.defaults.headers.common.Authorization = `Bearer ${this.session.get(SESSION_KEYS.JWT_TOKEN)}`;
    const axiosRequestConfig = {
      timeout: defaultAxiosTimeout,
      headers: { "X-Goeland-Token": this.getSessionId() },
    };

    try {
      const res = await axios.get(`${baseServerUrl}/goapi/v1/status`, axiosRequestConfig);
      log.l("getTokenStatus() axios.get Success! response:", res);
      const dExpires = new Date(0);
      dExpires.setUTCSeconds(res.data.exp);
      const msg = `getTokenStatus() JWT token expiration: ${dExpires}`;
      log.l(msg);
      return {
        msg,
        err: null,
        status: res.status,
        data: res.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        log.w("getTokenStatus() ## Try Catch ERROR ## error:", error);
        log.w("axios response was:", error.response);
        log.w("axios message is:", error.message);
        const msg = `Error in getTokenStatus() ## axios.get(${baseServerUrl}/goapi/v1/status) ERROR ## error: ${error.message}`;
        log.w(msg);
        return {
          msg,
          err: error,
          status: error.response?.status,
          data: null,
        };
      }
      const msg = `Unexpected error in getTokenStatus() ## axios.get(${baseServerUrl}/goapi/v1/status) ERROR ## error: ${error}`;
      log.e(msg);
      return {
        msg,
        err: error instanceof Error ? error : new Error(String(error)),
        status: undefined,
        data: null,
      };
    }
  }

  /**
   * Clears all session storage data related to the app.
   */
  public clearSessionStorage(): void {
    this.session.clear(Object.values(SESSION_KEYS));
    log.t("Session storage cleared.");
  }

  /**
   * Logs out the user and clears session storage.
   * @param baseServerUrl - The base URL of the server.
   * @throws {AuthError} If the logout request fails.
   */
  public async logoutAndResetToken(baseServerUrl: string): Promise<void> {
    log.t("# IN logoutAndResetToken()");
    axios.defaults.headers.common.Authorization = `Bearer ${this.session.get(SESSION_KEYS.JWT_TOKEN)}`;
    try {
      const response = await axios.get(`${baseServerUrl}/goapi/v1/logout`);
      log.l("logoutAndResetToken() Success! response:", response);
      this.clearSessionStorage();
    } catch (error) {
      log.e("logoutAndResetToken() ## ERROR ##:", error);
      throw new AuthError(`Logout failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Checks if a valid session exists.
   * @returns True if the session is valid, false otherwise.
   */
  public doesCurrentSessionExist(): boolean {
    log.t("# entering doesCurrentSessionExist...");
    const requiredKeys = [
      SESSION_KEYS.JWT_TOKEN,
      SESSION_KEYS.USER_ID,
      SESSION_KEYS.IS_ADMIN,
      SESSION_KEYS.EMAIL,
    ];

    if (requiredKeys.some((key) => !this.session.get(key))) {
      return false;
    }

    const expiration = this.session.get(SESSION_KEYS.DATE_EXPIRATION);
    if (expiration) {
      const dateExpire = new Date(parseInt(expiration, 10) * 1000);
      const now = new Date();
      if (now > dateExpire) {
        this.clearSessionStorage();
        log.w("# IN doesCurrentSessionExist() SESSION EXPIRED");
        return false;
      }
      const minutesUntilExpire = Math.floor((dateExpire.getTime() - now.getTime()) / 1000 / 60);
      log.l(`Yes session exists, valid for ${minutesUntilExpire} minutes...`);
      return true;
    }
    log.w("# IN doesCurrentSessionExist() goapi_date_expiration was null");
    return false;
  }

  /**
   * Gets the JWT token if the session exists.
   * @returns The JWT token or an empty string.
   */
  public getLocalJwtTokenAuth(): string {
    return this.doesCurrentSessionExist() ? this.session.get(SESSION_KEYS.JWT_TOKEN) ?? "" : "";
  }

  /**
   * Gets the token expiration timestamp.
   * @returns The expiration timestamp or 0 if no session exists.
   */
  public getDateExpiration(): number {
    return this.doesCurrentSessionExist()
        ? parseInt(this.session.get(SESSION_KEYS.DATE_EXPIRATION) ?? "0", 10)
        : 0;
  }

  /**
   * Gets the user's email.
   * @returns The email or an empty string if no session exists.
   */
  public getUserEmail(): string {
    return this.doesCurrentSessionExist() ? this.session.get(SESSION_KEYS.EMAIL) ?? "" : "";
  }

  /**
   * Gets the user's ID.
   * @returns The user ID or 0 if no session exists.
   */
  public getUserId(): number {
    return this.doesCurrentSessionExist()
        ? parseInt(this.session.get(SESSION_KEYS.USER_ID) ?? "0", 10)
        : 0;
  }

  /**
   * Gets the user's name.
   * @returns The name or an empty string if no session exists.
   */
  public getUserName(): string {
    return this.doesCurrentSessionExist() ? this.session.get(SESSION_KEYS.NAME) ?? "" : "";
  }

  /**
   * Gets the user's login.
   * @returns The login or an empty string if no session exists.
   */
  public getUserLogin(): string {
    return this.doesCurrentSessionExist() ? this.session.get(SESSION_KEYS.USERNAME) ?? "" : "";
  }

  /**
   * Checks if the user is an admin.
   * @returns True if the user is an admin, false otherwise.
   */
  public getUserIsAdmin(): boolean {
    return this.doesCurrentSessionExist()
        ? this.session.get(SESSION_KEYS.IS_ADMIN) === "true"
        : false;
  }

  /**
   * Gets the first group ID for the user.
   * @returns The first group ID or null if no session or groups exist.
   */
  public getUserFirstGroups(): number | null {
    if (!this.doesCurrentSessionExist()) return null;
    const groups = this.session.get(SESSION_KEYS.GROUPS);
    if (!groups || groups === "null") return null;
    return groups.includes(",") ? parseInt(groups.split(",")[0], 10) : parseInt(groups, 10);
  }

  /**
   * Gets the array of user group IDs.
   * @returns The group IDs or null if no session or groups exist.
   */
  public getUserGroupsArray(): number[] | null {
    if (!this.doesCurrentSessionExist()) return null;
    const groups = this.session.get(SESSION_KEYS.GROUPS);
    if (!groups || groups === "null") return null;
    return groups.includes(",") ? groups.split(",").map((i) => parseInt(i, 10)) : [parseInt(groups, 10)];
  }

  /**
   * Checks if the user has any groups.
   * @returns True if the user has groups, false otherwise.
   */
  public isUserHavingGroups(): boolean {
    if (!this.doesCurrentSessionExist()) return false;
    const groups = this.session.get(SESSION_KEYS.GROUPS);
    if (!groups || groups === "null") return false;
    return groups.includes(",") || parseInt(groups, 10) > 0;
  }

  /**
   * Gets the session UUID.
   * @returns The session UUID or an empty string if no session exists.
   */
  public getSessionId(): string {
    return this.doesCurrentSessionExist() ? this.session.get(SESSION_KEYS.SESSION_UUID) ?? "" : "";
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
    if (!base64Url) throw new Error("Invalid JWT format");
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
        atob(base64)
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
 * Authenticates a user and retrieves a JWT token.
 * @param appName - The application name for session storage.
 * @param baseServerUrl - The base server URL.
 * @param jwt_auth_url - The JWT authentication endpoint.
 * @param username - The user's username.
 * @param passwordHash - The hashed password.
 * @returns A promise resolving to an object with status, message, error, and data.
 * @throws {AuthError} If the authentication fails.
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

    if (response.data.session) {
      session  .set(SESSION_KEYS.SESSION_UUID, response.data.session);
    }

    const jwtValues = parseJwt(response.data.token);
    log.l("getToken() token values:", jwtValues);
    const dExpires = new Date(0);
    dExpires.setUTCSeconds(jwtValues.exp);
    log.l(`getToken() JWT token expiration: ${dExpires}`);

    if (typeof Storage !== "undefined") {
      session.set(SESSION_KEYS.JWT_TOKEN, response.data.token);
      session.set(SESSION_KEYS.USER_ID, String(jwtValues.User.user_id));
      session.set(SESSION_KEYS.USER_EXTERNAL_ID, jwtValues.User.external_id);
      session.set(SESSION_KEYS.NAME, jwtValues.name);
      session.set(SESSION_KEYS.USERNAME, jwtValues.User.login);
      session.set(SESSION_KEYS.EMAIL, jwtValues.User.email);
      session.set(SESSION_KEYS.IS_ADMIN, String(jwtValues.User.is_admin));
      session.set(SESSION_KEYS.DATE_EXPIRATION, String(jwtValues.exp));
    } else {
      throw new AuthError("Session storage is not supported");
    }

    return {
      msg: "getToken() axios.post Success.",
      err: null,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log.w(`getToken() Try Catch Axios ERROR message: ${error.message}, error:`, error);
      log.l("Axios error.response:", error.response);
      return {
        msg: `getToken() Try Catch Axios ERROR: ${error.message}!`,
        err: error,
        status: error.response?.status,
        data: null,
      };
    }
    log.e("getToken() unexpected error:", error);
    return {
      msg: `getToken() Try Catch unexpected ERROR: ${error}!`,
      err: error instanceof Error ? error : new Error(String(error)),
      status: undefined,
      data: null,
    };
  }
}

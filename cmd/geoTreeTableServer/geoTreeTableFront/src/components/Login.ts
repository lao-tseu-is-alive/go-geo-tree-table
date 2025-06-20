// Login.ts (renamed to AuthService.ts or keep as Login.ts, but logically it's an AuthService)
import axios from "axios";
import { getLog, BACKEND_URL, defaultAxiosTimeout } from "@/config";
import { useAppStore} from "@/stores/appStore";
// Define the type for the AppStore instance
type AppStore = ReturnType<typeof useAppStore>;
const log = getLog("AuthService", 4, 1);

export class AuthService {
  private appStore: AppStore; // Store the appStore internally

  constructor(appStoreInstance: AppStore) {
    this.appStore = appStoreInstance; // Initialize the internal appStore
    log.t("AuthService initialized with appStore.");
  }

  public async getTokenStatus(baseServerUrl = BACKEND_URL) {
    log.t("# entering getTokenStatus...  ");
    const APP = this.appStore.getAppName; // Use the internal appStore
    axios.defaults.headers.common.Authorization = `Bearer ${sessionStorage.getItem(`${APP}_goapi_jwt_session_token`)}`;
    const AxiosRequestConfig = { timeout: defaultAxiosTimeout, headers: { "X-Goeland-Token": this.getSessionId() } }; // Call getSessionId from `this`
    try {
      const res = await axios.get(`${baseServerUrl}/goapi/v1/status`, AxiosRequestConfig);
      log.l("getTokenStatus() axios.get Success ! response :", res);
      const dExpires = new Date(0);
      dExpires.setUTCSeconds(res.data.exp);
      const msg = `getTokenStatus() JWT token expiration : ${dExpires}`;
      log.l(msg);
      const { data } = res;
      return {
        msg,
        err: null,
        status: res.status,
        data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        log.w("getToken() ## Try Catch ERROR ## error :", error);
        log.w("axios response was:", error.response);
        log.w("axios message is:", error.message);
        const msg = `Error: in getTokenStatus() ## axios.get(${baseServerUrl}/goapi/v1/status) ERROR ## error :${error.message}`;
        log.w(msg);
        const status = error.response != undefined ? error.response.status : undefined;
        return {
          msg,
          err: error,
          status: status,
          data: null,
        };
      } else {
        const msg = `An unexpected Error occured in getTokenStatus() ## axios.get(${baseServerUrl}/goapi/v1/status) ERROR ## error :${error}`;
        log.e(msg);
        log.e("unexpected error: ", error);
        return {
          msg: msg,
          err: error,
          status: null,
          data: null,
        };
      }
    }
  }

  public clearSessionStorage(): void {
    const APP = this.appStore.getAppName; // Use the internal appStore
    sessionStorage.removeItem(`${APP}_goapi_jwt_session_token`);
    sessionStorage.removeItem(`${APP}_goapi_idgouser`);
    sessionStorage.removeItem(`${APP}_goapi_user_external_id`);
    sessionStorage.removeItem(`${APP}_goapi_name`);
    sessionStorage.removeItem(`${APP}_goapi_username`);
    sessionStorage.removeItem(`${APP}_goapi_email`);
    sessionStorage.removeItem(`${APP}_goapi_isadmin`);
    sessionStorage.removeItem(`${APP}_goapi_date_expiration`);
  }

  public logoutAndResetToken(baseServerUrl: string) {
    log.t("# IN logoutAndResetToken()");
    const APP = this.appStore.getAppName; // Use the internal appStore
    axios.defaults.headers.common.Authorization = `Bearer ${sessionStorage.getItem(`${APP}_goapi_jwt_session_token`)}`;
    axios
        .get(`${baseServerUrl}/goapi/v1/logout`)
        .then((response) => {
          log.l("logoutAndResetToken() Success ! response :", response);
          this.clearSessionStorage(); // Call clearSessionStorage from `this`
        })
        .catch((error) => {
          log.e("logoutAndResetToken() ##  ERROR ## :", error);
        });
  }

  public doesCurrentSessionExist(): boolean {
    log.t("# entering doesCurrentSessionExist...  ");
    const APP = this.appStore.getAppName; // Use the internal appStore
    if (sessionStorage.getItem(`${APP}_goapi_jwt_session_token`) == null) return false;
    if (sessionStorage.getItem(`${APP}_goapi_idgouser`) == null) return false;
    if (sessionStorage.getItem(`${APP}_goapi_isadmin`) == null) return false;
    if (sessionStorage.getItem(`${APP}_goapi_email`) == null) return false;
    if (sessionStorage.getItem(`${APP}_goapi_date_expiration`) !== null) {
      const goapi_token_expires = parseInt(sessionStorage.getItem(`${APP}_goapi_date_expiration`)!, 10);
      const dateExpire = new Date(goapi_token_expires * 1000);
      const now = new Date();
      const minutesUntilExpire = Math.floor((dateExpire.getTime() - now.getTime()) / 1000 / 60);
      if (now > dateExpire) {
        this.clearSessionStorage(); // Call clearSessionStorage from `this`
        log.w("# IN doesCurrentSessionExist() SESSION EXPIRED");
        return false;
      }
      log.l(`Yes session exists, valid for ${minutesUntilExpire} minutes...`);
      return true;
    }
    log.w("# IN doesCurrentSessionExist() goapi_date_expiration was null ");
    return false;
  }

  public getLocalJwtTokenAuth(): string {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      const goapi_jwt_session = sessionStorage.getItem(`${APP}_goapi_jwt_session_token`);
      if (goapi_jwt_session !== null) {
        return goapi_jwt_session;
      }
    }
    return "";
  }

  public getDateExpiration(): number {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      const val = sessionStorage.getItem(`${APP}_goapi_date_expiration`);
      if (val !== null) {
        return parseInt(val, 10);
      }
    }
    return 0;
  }

  public getUserEmail(): string {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      return `${sessionStorage.getItem(`${APP}_goapi_email`)}`;
    }
    return "";
  }

  public getUserId() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      return parseInt(`${sessionStorage.getItem(`${APP}_goapi_idgouser`)}`, 10);
    }
    return 0;
  }

  public getUserName() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      return `${sessionStorage.getItem(`${APP}_goapi_name`)}`;
    }
    return "";
  }

  public getUserLogin() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      return `${sessionStorage.getItem(`${APP}_goapi_username`)}`;
    }
    return "";
  }

  public getUserIsAdmin() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      return sessionStorage.getItem(`${APP}_goapi_isadmin`) === "true";
    }
    return false;
  }

  public getUserFirstGroups() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      if (sessionStorage.getItem(`${APP}_goapi_groups`) == null) return null;
      if (sessionStorage.getItem(`${APP}_goapi_groups`) === "null") return null;
      const tmpArr = sessionStorage.getItem(`${APP}_goapi_groups`);
      if (tmpArr != null) {
        if (tmpArr.indexOf(",") > 0) {
          const firstFiltered = tmpArr.split(",").map((e) => +e);
          return firstFiltered[0];
        }
        return parseInt(tmpArr, 10);
      }
    }
    return null;
  }

  public getUserGroupsArray() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      if (sessionStorage.getItem(`${APP}_goapi_groups`) == null) return null;
      if (sessionStorage.getItem(`${APP}_goapi_groups`) === "null") return null;
      const tmpArr = sessionStorage.getItem(`${APP}_goapi_groups`);
      if (tmpArr != null) {
        if (tmpArr.indexOf(",") > 0) {
          return tmpArr.split(",").map((i) => parseInt(i, 10));
        }
        return [parseInt(tmpArr, 10)];
      }
    }
    return null;
  }

  public isUserHavingGroups() {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      if (sessionStorage.getItem(`${APP}_goapi_groups`) == null) return false;
      if (sessionStorage.getItem(`${APP}_goapi_groups`) === "null") return false;
      const tmp = sessionStorage.getItem(`${APP}_goapi_groups`);
      if (tmp != null) {
        if (tmp.indexOf(",") > 0) {
          return true;
        }
        if (parseInt(tmp, 10) > 0) {
          return true;
        }
      }
      return false;
    }
    return false;
  }

  public getSessionId(): string {
    if (this.doesCurrentSessionExist()) { // Call doesCurrentSessionExist from `this`
      const APP = this.appStore.getAppName; // Use the internal appStore
      return `${sessionStorage.getItem(`${APP}_goapi_session_uuid`)}`;
    }
    return "";
  }
}

// Helper function (can be private or public depending on external usage)
const parseJwt =(token: string) => {
  const base64Url = token.split(".")[1];
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const jsonPayload = decodeURIComponent(
      atob(base64)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
  );
  return JSON.parse(jsonPayload);
}

export async function getToken(appName: string, baseServerUrl: string, jwt_auth_url: string, username: string, passwordHash: string) {
  const data = {
    username,
    password_hash: `${passwordHash}`,
  };
  const login_url = `${baseServerUrl}${jwt_auth_url}`;
  log.t(`# entering getToken... ${login_url}  data :`, data);
  let response = null;
  try {
    response = await axios.post(`${login_url}`, data);
    log.l("getToken() axios.post Success ! response :", response.data);
    if (response.data.session !== undefined) {
      const sessionId = response.data.session;
      sessionStorage.setItem(`${appName}_goapi_session_uuid`, sessionId);
    }
    const jwtValues = parseJwt(response.data.token); // Call parseJwt from `this`
    log.l("getToken() token values : ", jwtValues);
    const dExpires = new Date(0);
    dExpires.setUTCSeconds(jwtValues.exp);
    log.l(`getToken() JWT token expiration : ${dExpires}`);
    if (typeof Storage !== "undefined") {
      sessionStorage.setItem(`${appName}_goapi_jwt_session_token`, response.data.token);
      sessionStorage.setItem(`${appName}_goapi_idgouser`, jwtValues.User.user_id);
      sessionStorage.setItem(`${appName}_goapi_user_external_id`, jwtValues.User.external_id);
      sessionStorage.setItem(`${appName}_goapi_name`, jwtValues.name);
      sessionStorage.setItem(`${appName}_goapi_username`, jwtValues.User.login);
      sessionStorage.setItem(`${appName}_goapi_email`, jwtValues.User.email);
      sessionStorage.setItem(`${appName}_goapi_isadmin`, jwtValues.User.is_admin);
      sessionStorage.setItem(`${appName}_goapi_date_expiration`, jwtValues.exp);
    }
    return {
      msg: "getToken() axios.post Success.",
      err: null,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      log.w(`Try Catch Axios ERROR message:${error.message}, error:`, error);
      log.l("Axios error.response:", error.response);
      return {
        msg: `getToken() Try Catch Axios ERROR: ${error.message} !`,
        err: error,
        status: error.status,
        data: null,
      };
    } else {
      log.e("unexpected error: ", error);
      return {
        msg: `getToken() Try Catch unexpected ERROR: ${error} !`,
        err: error,
        status: null,
        data: null,
      };
    }
  }
}

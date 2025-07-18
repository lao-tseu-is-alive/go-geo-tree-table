// Utilities
import { defineStore } from "pinia";
import {
  fetchAppInfo,
  AppInfo,
  fetchJwtStatus,
  fetchAuthUrl,
} from "@/tools/appInfo";
import { API_URL, BACKEND_URL, DEV, getLog, GO_DEV_URL } from "@/config";
import { JwtCustomClaims } from "@/tools/jwt";

const log = getLog("appStore", 4, 4);
type LevelAlert = "error" | "success" | "warning" | "info";
const feedbackDefaultTimeout = 3000;

export const useAppStore = defineStore("app", {
  state: () => {
    return {
      isUserAuthenticated: false,
      isHttpOnlyCookieJwt: false,
      isNetworkOk: true,
      feedbackTimeout: feedbackDefaultTimeout, // default display time 5sec
      feedbackMsg: ` `,
      feedbackType: "success" as LevelAlert,
      feedbackVisible: false,
      appData: <AppInfo>{},
      jwtStatus: <JwtCustomClaims>{},
    };
  },
  getters: {
    getFeedbackType: (state): string => `${state.feedbackType}`,
    getFeedbackVisible: (state): boolean => state.feedbackVisible,
    getAppName: (state): string => `${state.appData.app}`,
    getAppVersion: (state): string => `${state.appData.version}`,
    getAppRepository: (state): string => `${state.appData.repository}`,
    getAppAuthUrl: (state): string => `${state.appData.authUrl}`,
    getIsUserAuthenticated: (state): boolean => state.isUserAuthenticated,
    getIsNetworkOk: (state): boolean => state.isNetworkOk,
    getUserIsAdmin: (state): boolean => {
      if (state.isUserAuthenticated) {
        const APP = state.appData.app; // Use the internal appStore
        const val = sessionStorage.getItem(`${APP}_goapi_isadmin`);
        if (val !== null) {
          return val === "true";
        }
        return false;
      } else {
        return false;
      }
    },
    getUserId: (state): number => {
      if (state.isUserAuthenticated) {
        if (state.isHttpOnlyCookieJwt) {
          return state.jwtStatus.User?.user_id || 0;
        }
        const APP = state.appData.app; // Use the internal appStore
        const val = sessionStorage.getItem(`${APP}_goapi_idgouser`);
        if (val !== null) {
          return parseInt(val, 10);
        }
        return 0;
      } else {
        return 0;
      }
    },
    getUserJwtToken: (state): string => {
      log.t(`# entering...isUserAuthenticated:${state.isUserAuthenticated}`);
      if (state.isUserAuthenticated) {
        if (state.isHttpOnlyCookieJwt) {
          // no need to set auth bearer header
          return ""
        }
        const APP = state.appData.app;
        const val = sessionStorage.getItem(`${APP}_goapi_jwt_session_token`);
        if (val !== null) {
          return val;
        }
        log.w(
          `getUserJwtToken  sessionStorage.getItem(${APP}_goapi_jwt_session_token is null)`,
        );
        return "";
      } else {
        log.w("getUserJwtToken isUserAuthenticated is false");
        return "";
      }
    },
  },
  actions: {
    setUserAuthenticated() {
      this.isUserAuthenticated = true;
    },
    setUserNotAuthenticated() {
      this.isUserAuthenticated = false;
    },
    networkOffLine() {
      this.isNetworkOk = false;
    },
    networkOnLine() {
      this.isNetworkOk = true;
    },
    displayFeedBack(
      text: string,
      type: LevelAlert = "info",
      timeout: number = feedbackDefaultTimeout,
    ) {
      this.feedbackType = type;
      this.feedbackMsg = text;
      this.feedbackTimeout = timeout;
      this.feedbackVisible = true;
    },
    hideFeedBack() {
      this.feedbackVisible = false;
      this.feedbackMsg = "";
      this.feedbackType = "success";
    },
    async fetchAppInfo() {
      try {
        this.appData = await fetchAppInfo(`${BACKEND_URL}/goAppInfo`);
      } catch (error) {
        this.appData = <AppInfo>{
          app: "Impossible d'atteindre le serveur : problème réseau ?",
          version:
            "ous pouvez essayer de rafraîchir cette page avec la touche F5",
        };
        log.e(`Error fetching app info from ${BACKEND_URL}/goAppInfo} :`, error);
      }
    },
    async checkStatusRoute(authRouteChecked = false): Promise<boolean> {
      try {
        let statusUrl = this.appData.statusUrl

        if (DEV || (GO_DEV_URL.includes(window.location.host))) {
          statusUrl = `${this.appData.statusUrl}`.includes("goapi")?`${this.appData.statusUrl}`:`${API_URL}${this.appData.statusUrl}`;
        }
        const jwtClaims = await fetchJwtStatus(`${BACKEND_URL}${statusUrl}`);
        log.l(
          `fetchJwtStatus returned ${JSON.stringify(jwtClaims)}`,
          jwtClaims,
        );
        this.jwtStatus = jwtClaims;
        this.setUserAuthenticated();
        this.isHttpOnlyCookieJwt = true;
        return true;
      } catch (error) {
        if (!authRouteChecked) {
          const authUrl = this.appData.authUrl;
          const res = await fetchAuthUrl(`${BACKEND_URL}${authUrl}`);
          if (`${res}`.toLowerCase().includes("success")) {
            log.l(`successfully checked auth url ${res} `);
            // let's retry just once after a successful auth url check, maybe we have got an jwt cookie
            return await this.checkStatusRoute(true);
          } else {
            log.w(`problem checking auth url ${authUrl} : ${res} `);
          }
        }
        log.e("Error fetching status info:", error);
        return false;
      }
    },
  },
});

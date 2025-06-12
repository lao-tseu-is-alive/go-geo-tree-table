// Utilities
import { defineStore } from "pinia"
import {fetchAppInfo, AppInfo} from "@/tools/appInfo"
import {BACKEND_URL, getLog} from "@/config";

const log = getLog("appStore", 4, 2);
type LevelAlert = "error" | "success" | "warning" | "info"

const feedbackDefaultTimeout = 3000
export const useAppStore = defineStore("app", {
  state: () => {
    return {
      isUserAuthenticated: false,
      isNetworkOk: true,
      feedbackTimeout: feedbackDefaultTimeout, // default display time 5sec
      feedbackMsg: ` `,
      feedbackType: "success" as LevelAlert,
      feedbackVisible: false,
      appData: <AppInfo>{},
    }
  },
  getters: {
    getFeedbackType: (state): string => `${state.feedbackType}`,
    getAppName: (state): string => `${state.appData.app}`,
    getAppVersion: (state): string => `${state.appData.version}`,
    getAppRepository: (state): string => `${state.appData.repository}`,
    getAppAuthUrl: (state): string => `${state.appData.authUrl}`,
  },
  actions: {
    networkOffLine() {
      this.isNetworkOk = false
    },
    networkOnLine() {
      this.isNetworkOk = true
    },
    displayFeedBack(text: string, type: LevelAlert = "info", timeout: number = feedbackDefaultTimeout) {
      this.feedbackType = type
      this.feedbackMsg = text
      this.feedbackTimeout = timeout
      this.feedbackVisible = true
    },
    hideFeedBack() {
      this.feedbackVisible = false
      this.feedbackMsg = ""
      this.feedbackType = "success"
    },
    async fetchAppInfo() {
      try {
        this.appData = await fetchAppInfo(`${BACKEND_URL}/goAppInfo`);
      } catch (error) {
        log.e("Error fetching app info:", error);
      }
    }
  },
})

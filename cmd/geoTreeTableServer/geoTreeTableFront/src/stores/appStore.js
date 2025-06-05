// Utilities
import { defineStore } from "pinia";
import { APP, VERSION } from "@/config";
const feedbackDefaultTimeout = 3000;
export const useAppStore = defineStore("app", {
    state: () => {
        return {
            isUserAuthenticated: false,
            isNetworkOk: true,
            feedbackTimeout: feedbackDefaultTimeout, // default display time 5sec
            feedbackMsg: `${APP}, v.${VERSION}`,
            feedbackType: "success",
            feedbackVisible: false,
        };
    },
    getters: {
        getFeedbackType: (state) => `${state.feedbackType}`,
    },
    actions: {
        networkOffLine() {
            this.isNetworkOk = false;
        },
        networkOnLine() {
            this.isNetworkOk = true;
        },
        displayFeedBack(text, type = "info", timeout = feedbackDefaultTimeout) {
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
    },
});

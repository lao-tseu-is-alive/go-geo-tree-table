// geoTreeStore.ts
import { defineStore } from "pinia";
import axios from "axios";
import type {
  GeoTree,
  GeoTreeList,
  GeoTreeGoelandThingId,
  ErrorResponse,
  ListGeoTreesParams,
} from "@/stores/geoTree";
import { getLog, BACKEND_URL } from "@/config";
// Logger setup
const log = getLog("geoTreeStore", 4, 1);

// const axiosRequestConfig = {  timeout: defaultAxiosTimeout,};
const API_BASE_URL = `${BACKEND_URL}/goapi/v1`;

export const useGeoTreeStore = defineStore("geoTree", {
  state: () => ({
    geoTrees: [] as GeoTreeList[],
    selectedGeoTree: null as GeoTree | null,
    count: 0,
    error: null as ErrorResponse | null,
    loading: false,
  }),
  getters: {
    numRecords: (state): number => {
      if (state.geoTrees === null) {
        return 0;
      }
      return state.geoTrees.length;
    },
  },
  actions: {
    // Set JWT token for all requests
    setAuthToken(token: string) {
      log.t(`# entering setAuthToken... ${token}`);
      if (token === null || token === undefined || token === ""){
        log.w("cannot set Authorization Header with null or undefined token")
      }
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },

    // List geoTrees
    async listGeoTrees(params: ListGeoTreesParams = {}) {
      log.t("# entering listGeoTrees...");
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get<GeoTreeList[]>(
          `${API_BASE_URL}/geoTree`,
          { params },
        );
        this.geoTrees = response.data;
        log.l(
          `success retrieving ${this.geoTrees.length} geoTrees`,
          this.geoTrees,
        );
        return response.data;
      } catch (error: any) {
        log.e("error retrieving geoTrees", error);
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Get geoJson
    async getGeoJson(params: ListGeoTreesParams = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get<string>(
          `${API_BASE_URL}/geoTree/geojson`,
          { params },
        );
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Get count
    async getGeoTreeCount(
      params: Pick<ListGeoTreesParams, "cada_date" | "created_by"> = {},
    ) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get<number>(
          `${API_BASE_URL}/geoTree/count`,
          { params },
        );
        this.count = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Get single geoTree
    async getGeoTree(geoTreeId: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get<GeoTree>(
          `${API_BASE_URL}/geoTree/${geoTreeId}`,
        );
        this.selectedGeoTree = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Create geoTree
    async createGeoTree(geoTree: Omit<GeoTree, "id" | "created_at">) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post<GeoTree>(
          `${API_BASE_URL}/geoTree`,
          geoTree,
        );
        this.selectedGeoTree = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update geoTree
    async updateGeoTree(geoTreeId: string, geoTree: Partial<GeoTree>) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put<GeoTree>(
          `${API_BASE_URL}/geoTree/${geoTreeId}`,
          geoTree,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );
        this.selectedGeoTree = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Update goeland_thing_id
    async updateGoelandThingId(geoTreeId: string, data: GeoTreeGoelandThingId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put<GeoTreeGoelandThingId>(
          `${API_BASE_URL}/geoTree/setGoelandThingId/${geoTreeId}`,
          data,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          },
        );
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },

    // Delete geoTree
    async deleteGeoTree(geoTreeId: string) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API_BASE_URL}/geoTree/${geoTreeId}`);
        this.geoTrees = this.geoTrees.filter((tree) => tree.id !== geoTreeId);
        if (this.selectedGeoTree?.id === geoTreeId) {
          this.selectedGeoTree = null;
        }
      } catch (error: any) {
        this.error = error.response?.data || {
          code: 500,
          message: "An error occurred",
        };
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});

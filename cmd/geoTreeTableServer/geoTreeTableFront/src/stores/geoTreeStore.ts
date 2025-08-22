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
import { getLog, BACKEND_URL, API_URL } from "@/config";
import { ITableHeader } from "@/tools/TableTypes";
import {
  getDateIsoFromTimeStamp,
  isNullOrUndefined,
  isTimestamp,
  parseJsonWithDetailedError,
} from "@/tools/utils";
// Logger setup
const log = getLog("geoTreeStore", 4, 1);

// const axiosRequestConfig = {  timeout: defaultAxiosTimeout,};
const API_BASE_URL = `${BACKEND_URL}${API_URL}`;

const minDistanceTolerance = 0.1; //no tree can be closer then this distance (should be shorter than the check in database)
export const useGeoTreeStore = defineStore("geoTree", {
  state: () => ({
    geoTrees: [] as GeoTreeList[],
    selectedGeoTree: null as GeoTree | null,
    count: 0,
    error: null as ErrorResponse | null,
    loading: false,
  }),
  getters: {
    getData: (state) => {
      log.t(`> Entering getData.. records.length : ${state.geoTrees.length}`);
      const filteredArray = state.geoTrees.map((row: Record<string, any>) => {
        const newRow: Record<string, any> = {}; // Use a type assertion if you have a defined type for your data
        for (const key in row) {
          if (key.includes("date") && isTimestamp(row[key])) {
            // Modify the date field here (e.g., convert to a Date object, format differently)
            log.t(`key : '${key}' row[key] : ${row[key]}`);
            newRow[key] = getDateIsoFromTimeStamp(row[key]);
            log.t(`key : '${key}' newRow[key] : ${newRow[key]}`);
          } else {
            newRow[key] = row[key];
          }
        }
        log.t(`newRow `, newRow);
        return newRow;
      });
      log.w("filteredArray", filteredArray);
      return filteredArray;
    },
    getHeaders: (state) => {
      const headers = [] as ITableHeader[];
      const tableHeaders: string[] = [
        "id",
        "goeland_thing_id",
        "cada_id",
        "tree_circumference_cm",
        "tree_crown_m",
        "cada_tree_type",
        "cada_comment",
        "cada_date",
        "created_by",
        "pos_east",
        "pos_north",
      ];

      tableHeaders.forEach((header, index: number) => {
        const currentHeader: ITableHeader = {
          title: header,
          align: "start",
          key: header,
          isVisible: true,
          frozenField: false,
        };
        log.l(`header ${index}:`, currentHeader);
        switch (header) {
          case "id":
            currentHeader.isVisible = false;
            break;
          case "tree_circumference_cm":
            currentHeader.title = "circonférence";
            break;
          case "tree_crown_m":
            currentHeader.title = "couronne";
            break;
          case "goeland_thing_id":
            currentHeader.title = "goeland_id";
            break;
          case "cada_id":
            currentHeader.title = "id";
            break;
          case "cada_tree_type":
            currentHeader.title = "essence";
            break;
          case "cada_comment":
            currentHeader.title = "commentaire";
            break;
          case "cada_date":
            currentHeader.title = "date";
            break;
        }

        headers.push(currentHeader);
      });
      return headers;
    },
    getDBGeoJson: (state) => {
      log.t(
        `> Entering getDBGeoJson.. records.length : ${state.geoTrees.length}`,
      );
      // const startTime = performance.now()
      if (state.geoTrees.length > 0) {
        log.t(
          `> IN getDBGeoJson.. geoTrees.length : ${state.geoTrees.length} ready to do ForEach`,
        );
        let myGeoJson = null;
        let result = '{"type": "FeatureCollection", "features": [';
        for (let i = 0; i < state.geoTrees.length; i++) {
          const r = state.geoTrees[i];
          const myIconPath = "img/gomarker_tree_ok.png";
          const myGoelandID = isNullOrUndefined(r.goeland_thing_id)
            ? "inconnu"
            : `${r.goeland_thing_id}`;
          const myName = `id:${r.cada_id},go_id:${myGoelandID}`;

          //log.w(`> IN getGeoJson.. i : ${i} record before setting feature:`, r)
          const feature = `
           {
            "type": "Feature",
            "geometry": {
              "type": "Point",
              "crs": {
                "type": "name",
                "properties": {
                  "name": "EPSG:2056"
                }
              },
              "coordinates": [${r.pos_east}, ${r.pos_north}]
              },
              "properties": {
                "id": "${r.cada_id}",
                "goeland_id": "${myGoelandID}",
                "name": "${myName}",
                "icon_path": "${myIconPath}"
              }},`;
          log.l(feature);
          result += feature;
        } //) end of for loop
        //log.l(`> IN getGeoJson.. result after ForEach: ${result}`)
        if (result.endsWith(",")) {
          result = result.slice(0, -1);
        }
        result += "]}";
        try {
          myGeoJson = parseJsonWithDetailedError(result);
        } catch (e) {
          log.w(`> Error in getGeoJson.. JSON.parse(result) : ${e}`, result);
        }
        return myGeoJson;
      }
      return { type: "FeatureCollection", features: [] };
    },
    numDBRecords: (state): number => {
      if (state.geoTrees === null) {
        return 0;
      }
      return state.geoTrees.length;
    },
    treeByPosition:
      (state) =>
      (east: number, north: number): GeoTreeList[] | null => {
        log.t(
          `# entering treeByPosition getter with east: ${east}, north: ${north}`,
        );
        const nearbyTrees = state.geoTrees.filter((tree) => {
          const treeEast = tree.pos_east || 0;
          const treeNorth = tree.pos_north || 0;
          const distance = Math.sqrt(
            Math.pow(east - treeEast, 2) + Math.pow(north - treeNorth, 2),
          );
          return distance < minDistanceTolerance; //  threshold
        });
        log.l(
          `Found ${nearbyTrees.length} trees within 0.1m of (${east}, ${north})`,
          nearbyTrees,
        );
        return nearbyTrees.length > 0 ? nearbyTrees : null;
      },
  },
  actions: {
    // Set JWT token for all requests
    setAuthToken(token: string) {
      log.t(`# entering setAuthToken... ${token}`);

      if (token === null || token === undefined || token === "") {
        log.w("cannot set Authorization Header with null or undefined token");
      }
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    },
    setAxiosWithCredentials(val: boolean) {
      log.t(`# entering setAxiosWithCredentials(${val})`);
      axios.defaults.withCredentials = val;
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
          {
            withCredentials: true,
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

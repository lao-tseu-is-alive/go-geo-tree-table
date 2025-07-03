<style>
.full-width {
  width: 100%;
  max-width: unset !important;
}

.info {
  color: #1976d2;
}

.trace {
  color: #3d873f;
}

.warn {
  color: #ff9800;
}

.error {
  color: #f44336;
}
</style>
<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click.stop="toggleDrawer" />
      <v-toolbar-title
        >{{ appStore.getAppName }} v{{
          appStore.getAppVersion
        }}</v-toolbar-title
      >
      <template v-if="appStore.getIsUserAuthenticated">
        <v-btn v-if="DEV" @click="showDebug = !showDebug"
          >{{ showDebug ? "Hide Debug" : "Show Debug" }}
        </v-btn>
        <v-spacer />
        <template v-if="dataLoaded">
          <v-btn
            icon
            title="sauvegarder les données dans la base de donées"
            @click="saveDataToBackend"
          >
            <v-icon>mdi-database</v-icon>
          </v-btn>
          <v-btn
            icon
            title="Effacer les données à l'écran et importer un nouveau fichier"
            @click="clearData"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        <v-btn
          variant="text"
          icon="mdi-logout"
          title="Logout"
          @click="logout"
        ></v-btn>
      </template>
    </v-app-bar>


    <template v-if="appStore.getIsUserAuthenticated">
      <template v-if="dataLoaded">
        <VResizeDrawer v-model="drawer" v-bind="drawerOptions">
          <MyTable @row-clicked="handleRowClicked" />
        </VResizeDrawer>
      </template>
      <v-main>
        <v-snackbar
          v-model="appStore.feedbackVisible"
          :timeout="appStore.feedbackTimeout"
          rounded="pill"
          :color="appStore.feedbackType"
          location="top"
        >
          <v-alert
            class="ma-4"
            :type="appStore.feedbackType"
            :text="appStore.feedbackMsg"
            :color="appStore.feedbackType"
          ></v-alert>
        </v-snackbar>
        <v-container class="w-100 full-width full-height">
          <template v-if="!dataLoaded">
            <MyDataLoader
              v-if="!dataLoaded"
              @data-loaded="handleDataLoaded"
              @fields-settings-ready="handleFieldsSettingsReady"
            />
          </template>
          <template v-else>
            <v-row v-if="showDebug">
              <v-col cols="12">
                <v-code outlined rows="5" readonly disabled
                  >{{ getGeoJsonString() }}
                </v-code>
              </v-col>
            </v-row>
            <v-row>
              <!-- map-lausanne should be ready to display the geojson data -->
              <map-lausanne
                v-if="dataLoaded"
                ref="myMap"
                :zoom="mapZoom"
                :center="mapCenter"
                :geodata="getGeoJson"
                @map-click="handleMapClickEvent"
              />
            </v-row>
          </template>
        </v-container>
      </v-main>
    </template>
    <template v-else>
      <Login
        :app="appStore.getAppName"
        :base_server_url="BACKEND_URL"
        :jwt_auth_url="appStore.getAppAuthUrl"
        @login-ok="handleLoginSuccess"
        @login-error="handleLoginFailure"
      />
    </template>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getTimeStampFromFrDate, isNullOrUndefined } from "@/tools/utils";
import MyTable from "./components/Table.vue";
import MyDataLoader from "./components/DataLoader.vue";
import VResizeDrawer from "@wdns/vuetify-resize-drawer";
import { BACKEND_URL, DEV, getLog, HOME } from "@/config";
import Login from "@/components/Login.vue";
import MapLausanne from "@/components/Map.vue";
import { mapClickInfo } from "@/components/Map";
import { useDataStore } from "@/stores/DataStore";
import { useAppStore } from "@/stores/appStore";
import { useGeoTreeStore } from "@/stores/geoTreeStore";
import { storeToRefs } from "pinia";
import { doesCurrentSessionExist, getTokenStatus, logoutAndResetToken } from "@/components/AuthService";
import { GeoTree } from "@/stores/geoTree";


let log = getLog("APP", 4, 2);
const dataLoaded = ref(false);
const mapZoom = ref(14);
const placeStFrancoisLausanne = [2538202, 1152364];
const mapCenter = ref(placeStFrancoisLausanne);
const appStore = useAppStore();
const dataStore = useDataStore();
const geoTreeStore = useGeoTreeStore();
const { getGeoJson } = storeToRefs(dataStore);
const showDebug = ref(false);
const drawer = ref(false);
const drawerOptions = ref({
  absolute: true,
  color: "",
  disableResizeWatcher: true,
  drawerImage: undefined,
  elevation: 0,
  expandOnHover: true,
  fixed: true,
  floating: false,
  handleBorderWidth: 8,
  handleColor: "primary",
  handleIcon: "mdi:mdi-arrow-left-right-bold-outline",
  handleIconSize: "small",
  handlePosition: "top" as const,
  height: undefined,
  image: undefined,
  location: "left" as const,
  maxHeight: "50%",
  maxWidth: "75%",
  minHeight: "256px",
  minWidth: "256px",
  persistent: true,
  rail: false,
  railWidth: 56,
  resizable: true,
  saveHeight: true,
  saveWidth: false,
  scrim: false,
  snapBack: true,
  sticky: false,
  storageName: "vuetify-resize-drawer-amount",
  storageType: "local" as const,
  tag: "nav",
  temporary: false,
  theme: "light",
  width: "350px",
});
const defaultFeedbackErrorTimeout = 5000; // default display time 5sec
let autoLogoutTimer: number;

const logout = () => {
  log.t("# IN logout()");
  logoutAndResetToken(appStore.getAppName, BACKEND_URL);
  appStore.setUserNotAuthenticated();
  clearData();
  appStore.displayFeedBack(
    "Vous vous êtes déconnecté de l'application avec succès !",
    "success",
  );
  if (isNullOrUndefined(autoLogoutTimer)) {
    clearInterval(autoLogoutTimer);
  }
  setTimeout(() => {
    window.location.href = HOME;
  }, 2000); // after 2 sec redirect to home page just in case
};

const checkIsSessionTokenValid = () => {
  log.t(`# entering...  ${appStore.getAppName}`);
  if (doesCurrentSessionExist(appStore.getAppName)) {
      getTokenStatus(appStore.getAppName, BACKEND_URL)
      .then((val) => {
        if (val.data == null) {
          log.e(`# getTokenStatus() ${val.msg}, ERROR is: `, val.err);
          appStore.displayFeedBack(
            `Problème réseau :${val.msg}`,
            "error",
            defaultFeedbackErrorTimeout,
          );
          logout();
        } else {
          log.l(`# getTokenStatus() SUCCESS ${val.msg} data: `, val.data);
          if (isNullOrUndefined(val.err) && val.status === 200) {
            // everything is okay, session is still valid
            appStore.setUserAuthenticated();
            return;
          }
          if (val.status === 401) {
            // jwt token is no more valid
            appStore.setUserNotAuthenticated();
            appStore.displayFeedBack(
              "Votre session a expiré !",
              "warning",
              defaultFeedbackErrorTimeout,
            );
            logout();
          }
          appStore.displayFeedBack(
            `Un problème est survenu avec votre session erreur: ${val.err}`,
            "error",
            defaultFeedbackErrorTimeout,
          );
        }
      })
      .catch((err) => {
        log.e("# getJwtToken() in catch ERROR err: ", err);
        appStore.displayFeedBack(
          `Il semble qu'il y a eu un problème réseau ! erreur: ${err}`,
          "error",
          defaultFeedbackErrorTimeout,
        );
      });
  } else {
    log.w("SESSION DOES NOT EXIST OR HAS EXPIRED !");
    logout();
  }
};

const handleDataLoaded = () => {
  log.t(`## handleDataLoaded entering...`);
  //dataLoaded.value = true;
};

const handleFieldsSettingsReady = () => {
  log.t(`## handleFieldsSettingsReady entering...`);
  dataLoaded.value = true;
  drawer.value = true;
};
const handleMapClickEvent = (clickInfo: mapClickInfo) => {
  log.t(`## entering... pos:${clickInfo.x}, ${clickInfo.y}`);
  log.t(`##features length :${clickInfo.features.length}`, clickInfo.features);
};

const handleRowClicked = (item: Record<string, any>) => {
  if ("index" in item || item.hasOwnProperty("index")) {
    log.t(`## entering... row index:${item.index}`, item);
    if (!isNullOrUndefined(item.index)) {
      const selectedRow = dataStore.records[item.index];
      log.t(`## selectedRow:`, selectedRow);
      //TODO a more robust approach would be o retrieve the coordinate from store
      mapCenter.value = [+selectedRow.e, +selectedRow.n];
      mapZoom.value = 13;
    }
  } else {
    log.t(`## index was not found... item:}`, item);
  }
};


const saveDataToBackend = async () => {
  log.t(`## entering saveDataToBackend...`);
  const dataToSave = dataStore.getData; // Access the getter directly
  log.l(`dataToSave length : ${dataToSave.length}::`, dataToSave)
  if (!dataToSave || dataToSave.length === 0) {
    appStore.displayFeedBack("No data to save.", "warning");
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  geoTreeStore.setAuthToken(appStore.getUserJwtToken);
  for (let i=0; i < dataToSave.length; i++) {
    const record = dataToSave[i];
    try {
      // Map your DataStore record to the GeoTree interface
      log.l(`record number ${i}:`, record)
      const geoTree: Omit<GeoTree, "created_at"> = {
        id: crypto.randomUUID(),
        cada_id: record.id_cadastre || record["_table_row_index"], // Map id_cadastre to cada_id
        cada_code: record.type_point || 0, // Map type_point to cada_code
        cada_comment: record.comment || "", // Map comment to cada_comment
        cada_date: getTimeStampFromFrDate(record.date),
        created_by: appStore.getUserId || 0, // Assuming appStore has getUserId
        pos_east: +record.e || 0, // Map e to pos_east
        pos_north: +record.n || 0, // Map n to pos_north
        tree_circumference_cm:  +record["circ_tronc"] || 0,
        tree_crown_m: +record["diam_couronne"] || undefined, // Keep as is if present
        cada_tree_type: record["essence"] || undefined, // Map tree_type to cada_tree_type
        description: record.description || undefined, // Keep as is if present
        pos_altitude: +record.pos_altitude || undefined, // Keep as is if present
      };
       // Check for existing trees within 0.1 meters using the getter
      const nearbyTrees = geoTreeStore.treeByPosition(geoTree.pos_east, geoTree.pos_north);
      if (nearbyTrees) {
        log.w(`Tree at position (${geoTree.pos_east}, ${geoTree.pos_north}) is too close to existing tree(s).`, nearbyTrees);
        errorCount++;
        appStore.displayFeedBack(
          `Tree with id [${geoTree.cada_id}] at (${geoTree.pos_east}, ${geoTree.pos_north}) is too close to an existing tree.`,
          "error"
        );
        dataStore.setDbStatus(record._table_row_index , "Déja dans la BD")
        continue; // Skip saving this tree
      }

      log.l("About to call geoTreeStore.createGeoTree for record:", geoTree)
      await geoTreeStore.createGeoTree(geoTree);
      dataStore.setDbStatus(record._table_row_index , "Sauvegarde BD OK")
      successCount++;
    } catch (error) {
      log.e("Error saving record:", record, error);
      errorCount++;
      dataStore.setDbStatus(record._table_row_index , "Erreur de sauvegarde")
      appStore.displayFeedBack(`Error saving id [${record.cada_id}] : ${error} `, "error");
    }
  }

  if (successCount > 0) {
    appStore.displayFeedBack(`${successCount} records saved successfully!`, "success");
    // Optionally, refresh the list of geoTrees after saving
    await geoTreeStore.listGeoTrees({ limit: 1000, offset: 0 });
  }
  if (errorCount > 0) {
    appStore.displayFeedBack(`${errorCount} records failed to save. Check console for details.`, "error");
  }
};

const handleLoginSuccess = async (v: string) => {
  log.t(`# entering... val:${v} `);
  appStore.setUserAuthenticated();
  appStore.hideFeedBack();
  appStore.displayFeedBack(
    "Vous êtes authentifié sur l'application.",
    "success",
  );

  // retrieve existing points from server
  log.l(`appStore.getUserJwtToken :   ${appStore.getUserJwtToken}`)

  geoTreeStore.setAuthToken(appStore.getUserJwtToken);
  try {
        await geoTreeStore.listGeoTrees({ limit: 1000, offset: 0 });
        log.t(`retrieved ${geoTreeStore.geoTrees.length} records`,  geoTreeStore.geoTrees);
      } catch (error) {
        log.e("geoTreeStore.listGeoTrees got error : ",geoTreeStore.error);
      }
  if (isNullOrUndefined(autoLogoutTimer)) {
    // check every 60 seconds(60'000 milliseconds) if jwt is still valid
    autoLogoutTimer = window.setInterval(checkIsSessionTokenValid, 60000);
  }
};

const handleLoginFailure = (v: string) => {
  log.w(`# entering... val:${v} `);
  appStore.setUserNotAuthenticated();
  appStore.hideFeedBack();
};

const getGeoJsonString = () => {
  log.t(`## entering...`, getGeoJson.value);
  if (isNullOrUndefined(getGeoJson.value)) {
    return "NULL";
  }
  return JSON.stringify(getGeoJson.value);
};

const clearData = () => {
  log.t(`## entering...`);
  dataStore.clearData();
  dataLoaded.value = false;
  drawer.value = false;
  mapCenter.value = placeStFrancoisLausanne;
};

const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

onMounted(async () => {
  log.t(`onMounted Main App.vue ${BACKEND_URL}`);
  try {
    await appStore.fetchAppInfo();
    log.l(
      `App.vue ${appStore.getAppName} v${appStore.getAppVersion}, from ${appStore.getAppRepository}`,
    );
  } catch (error) {
    log.e("Error fetching app info:", error);
  }
});
</script>

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
      <v-toolbar-title>{{ AppName }} v{{ AppVersion }}</v-toolbar-title>
      <v-btn v-if="DEV" @click="showDebug = !showDebug">{{
          showDebug ? "Hide Debug" : "Show Debug"
        }}</v-btn>
      <v-spacer />
      <v-btn
          v-if="dataLoaded"
          icon
          title="clear data and import a new file"
          @click="clearData"
      >
        <v-icon>mdi-delete</v-icon>
      </v-btn>
    </v-app-bar>
    <VResizeDrawer v-model="drawer" v-bind="drawerOptions">
      <MyTable v-if="dataLoaded" @row-clicked="handleRowClicked" />
    </VResizeDrawer>
    <v-main>
      <v-container class="w-100 full-width">
        <v-row v-if="showDebug">
          <v-col cols="12">
            <v-code outlined rows="5" readonly disabled
            >{{ getGeoJsonString() }}
            </v-code>
          </v-col>
        </v-row>
        <v-row>
          <!--
          <MyDataLoader
              v-if="!dataLoaded"
              @data-loaded="handleDataLoaded"
              @fields-settings-ready="handleFieldsSettingsReady"
          />
          -->
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
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { isNullOrUndefined } from "@/tools/utils";
//import MyTable from "./components/Table.vue";
//import MyDataLoader from "./components/DataLoader.vue";
import VResizeDrawer from "@wdns/vuetify-resize-drawer";
import {BACKEND_URL, DEV, getLog} from "@/config";
import MapLausanne from "@/components/Map.vue";
import { mapClickInfo } from "@/components/Map";
import { useDataStore } from "@/stores/DataStore";
import { storeToRefs } from "pinia";
import {fetchAppInfo} from "@/tools/appInfo";

let log = getLog("APP", 4, 2);;
const AppName = ref("");
const AppVersion = ref("");
const AppRepository = ref("");
const AppAuthUrl = ref("");
const dataLoaded = ref(true);
const mapZoom = ref(14);
const placeStFrancoisLausanne = [2538202, 1152364];
const mapCenter = ref(placeStFrancoisLausanne);
const store = useDataStore();
const { getGeoJson } = storeToRefs(store);
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
/*
const handleDataLoaded = () => {
  log.t(`## handleDataLoaded entering...`);
  // dataLoaded.value = true;
};

const handleFieldsSettingsReady = () => {
  log.t(`## handleFieldsSettingsReady entering...`);
  dataLoaded.value = true;
};
*/
const handleMapClickEvent = (clickInfo: mapClickInfo) => {
  log.t(`## entering... pos:${clickInfo.x}, ${clickInfo.y}`);
  log.t(`##features length :${clickInfo.features.length}`, clickInfo.features);
};

const handleRowClicked = (item: Record<string, any>) => {
  if ("index" in item || item.hasOwnProperty("index")) {
    log.t(`## entering... row index:${item.index}`, item);
    if (!isNullOrUndefined(item.index)) {
      const selectedRow = store.records[item.index];
      log.t(`## selectedRow:`, selectedRow);
      mapCenter.value = [selectedRow.x, selectedRow.y];
      mapZoom.value = 10;
    }
  } else {
    log.t(`## index was not found... item:}`, item);
  }
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
  store.clearData();
  dataLoaded.value = false;
};

const toggleDrawer = () => {
  drawer.value = !drawer.value;
};

onMounted(async () => {
  log.t(`onMounted Main App.vue ${BACKEND_URL}`);
  try {
    const appData = await fetchAppInfo(`http://localhost:7979/goAppInfo`);
    AppName.value = appData.app;
    AppVersion.value = appData.version;
    AppRepository.value = appData.repository;
    AppAuthUrl.value = appData.authUrl;
    log = getLog(AppName.value, 4, 2)
    log.t(`Main App.vue ${AppName.value}-${AppVersion.value}, at ${AppRepository.value}`)
  } catch (error) {
    log.e("Error fetching app info:", error);
  }

});
</script>

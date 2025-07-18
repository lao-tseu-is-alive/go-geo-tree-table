<style></style>
<template>
  <v-responsive class="fill-height mx-auto" min-width="300">
    <v-row id="step-001-select-file" v-if="!fileSelected">
      <v-col cols="12">
        <v-card
          class="py-2"
          color="surface-variant"
          prepend-icon="mdi-rocket-launch-outline"
          rounded="lg"
          variant="outlined"
        >
          <template #image>
            <v-img
              position="top right"
              max-height="140px"
              src="@/assets/logo.svg"
            />
          </template>
          <template #title>
            <h3 class="text-h5 font-weight-bold">
              Veuillez sélectionner un fichier de données à importer (xlsx, csv)
            </h3>
          </template>
          <template #subtitle>
            <div class="text-subtitle-1">
              le format doit respecter le schéma suivant :<br>
              {{validHeaderRow.join(", ")}}
            </div>
            <v-alert
              v-if="isInvalidFile"
              :title=isInvalidFileTitle
              :text=isInvalidFileMsg
              type="error"
            ></v-alert>
          </template>
          <template #actions>
            <v-file-input
              label="Select a file"
              variant="solo"
              show-size
              class="mr-16 pr-16"
              @change="handleFileUpload"
            />
          </template>
          <v-overlay
            v-if="fileSelected"
            opacity=".12"
            scrim="primary"
            contained
            model-value
            persistent
          />
        </v-card>
      </v-col>
    </v-row>
    <!-- end of step-001-select-file -->
    <v-row
      v-if="fileSelected && displayFieldsList"
      id="step-002-display-fields"
    >
      <v-col cols="12">
        <v-card
          class="py-2"
          color="surface-variant"
          prepend-icon="mdi-text-box-outline"
          rel="noopener noreferrer"
          rounded="lg"
          title="List of fields"
          variant="text"
        >
          <v-card-text>
            <v-list density="compact" nav>
              <v-list-item
                v-for="(field, i) in getHeaders"
                :key="i"
                :value="field.title"
                :title="field.title"
                :disabled="field.frozenField"
                :visible="field.frozenField"
              >
                <template v-slot:append>
                  <template v-if="!field.frozenField">
                    <v-btn
                      color="secondary-lighten-1"
                      :icon="
                        getIsFieldXPosition(field)
                          ? 'mdi-alpha-x-circle'
                          : 'mdi-alpha-x-circle-outline'
                      "
                      title="Click to use this field as geometry coordinates X"
                      variant="text"
                      @click="useFieldAsPosX(field)"
                    ></v-btn>
                    <v-btn
                      color="secondary-lighten-1"
                      :icon="
                        getIsFieldYPosition(field)
                          ? 'mdi-alpha-y-circle'
                          : 'mdi-alpha-y-circle-outline'
                      "
                      title="Click to use this field as geometry coordinates Y"
                      variant="text"
                      @click="useFieldAsPosY(field)"
                    ></v-btn>
                  </template>
                  <v-btn
                    color="secondary"
                    :icon="getIsFieldVisible(field) ? 'mdi-eye' : 'mdi-eye-off'"
                    title="Click to toggle visibility of this field"
                    variant="text"
                    @click="toggleFieldVisibility(field)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              prepend-icon="mdi-content-save-settings"
              color="primary"
              text="Save field settings"
              variant="text"
              @click="saveFieldSettings"
            />
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    <!-- end of step-002-display-fields -->
  </v-responsive>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { read, utils } from "xlsx";
import { getLog } from "@/config";
import { IInvalidFieldHeader, useDataStore } from "@/stores/DataStore";
import type { ITableHeader } from "@/stores/DataStore";
import { validHeaderRow } from "@/stores/geoTree";
import { storeToRefs } from "pinia";
import { isNullOrUndefined } from "@/tools/utils";

const store = useDataStore();
const log = getLog("DataLoader", 4, 2);
const fileSelected = ref(false);
const displayFieldsList = ref(false);
const isInvalidFile = ref(false);
const isInvalidFileTitle = ref("");
const isInvalidFileMsg = ref("");
const { getHeaders } = storeToRefs(store);

//// EVENT SECTION

const emit = defineEmits([
  "data-loaded",
  "header-error",
  "data-error",
  "row-clicked",
  "fields-settings-ready",
]);

//// WATCH SECTION

//// COMPUTED SECTION

//// METHODS SECTION
const getIsFieldVisible = (field: ITableHeader): boolean => {
  let isVisible = true;
  if (!isNullOrUndefined(field.isVisible)) isVisible = field.isVisible;
  return isVisible;
};

const getIsFieldXPosition = (field: ITableHeader): boolean => {
  return field.key == store.posXName;
};

const getIsFieldYPosition = (field: ITableHeader): boolean => {
  return field.key == store.posYName;
};

const toggleFieldVisibility = (field: ITableHeader) => {
  log.t("toggleVisibility", field);
  store.toggleVisibility(field);
};

const useFieldAsPosX = (field: ITableHeader) => {
  log.t("useFieldAsPosX", field);
  store.setPosXName(field.title);
};

const useFieldAsPosY = (field: ITableHeader) => {
  log.t("useFieldAsPosY", field);
  store.setPosYName(field.title);
};

const saveFieldSettings = () => {
  log.t("saveFieldSettings");
  emit("fields-settings-ready", store.headers);
};

const setInvalidFile = (title: string, msg:string) =>{
  isInvalidFile.value = true;
  isInvalidFileTitle.value = title;
  isInvalidFileMsg.value = msg
}

const resetInvalidFile = ()=> {
  isInvalidFile.value = false;
  isInvalidFileTitle.value = "";
  isInvalidFileMsg.value = "";
}


const handleFileUpload = (e: Event) => {
  const inputFile = (e.target as HTMLInputElement).files?.[0];
  if (inputFile) {
    log.l("file selected :", inputFile);
    resetInvalidFile();


    const reader = new FileReader();
    reader.onload = (e) => {
      const FileContent = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(FileContent, { type: "array" });
      log.l("workbook", workbook);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = utils.sheet_to_json(sheet, { header: 1 });
      log.l("sheetData", sheetData);

      // Filter out empty rows
      const filteredSheetData = sheetData.filter(
        (row) =>
          Array.isArray(row) &&
          row.length > 0 &&
          row.some(
            (cell) => cell !== undefined && cell !== null && cell !== "",
          ),
      );

      log.l("filteredSheetData", filteredSheetData);
      // check if the first row is a valid header row

      const receivedHeaderRow = filteredSheetData.shift() as string[];
      log.l("receivedHeaderRow", receivedHeaderRow);
      const invalidHeaders = <IInvalidFieldHeader[]>[];
      let isHeaderRowValid = true;
      let invalidErrMSg = "";
      for (let index = 0; index < validHeaderRow.length; index++) {
        const cell = `${receivedHeaderRow[index]}`.trim().toLowerCase();
        const valid = `${validHeaderRow[index]}`.trim().toLowerCase()
        if (cell.includes(valid)) {
          log.l(
            `success in header num ${index}, expected: '${valid}', received: '${cell}'`,
          );
        } else {
          log.w(
            `error in header num ${index}, expected: ${validHeaderRow[index]}, received: ${cell}`,
          );
          invalidErrMSg += `col[${index+1}]: ${cell}, au lieu de :${validHeaderRow[index]} `
          invalidHeaders.push({
            key: index,
            expected: validHeaderRow[index],
            received: cell,
          });
          isHeaderRowValid = false;
        }
      }
      if (!isHeaderRowValid) {
        setInvalidFile("Entête du fichier invalide", invalidErrMSg)
        emit("header-error", invalidHeaders);
        return;
      }

      store.setHeaders(receivedHeaderRow);
      store.setData(filteredSheetData);
      log.l("getHeaders", getHeaders.value);
      fileSelected.value = true;
      if (!displayFieldsList.value) {
        emit("fields-settings-ready", store.headers);
      }
      emit("data-loaded", store.records);
    };
    reader.readAsArrayBuffer(inputFile);
  }
};

onMounted(() => {
  log.t(`DataLoader.vue mounted`);
});
</script>

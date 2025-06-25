<style>
.clicked-row {
  background-color: aliceblue;
}

.un-clicked-row {
  background-color: white;
}
</style>
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
            <v-img position="top right" max-height="140px" src="@/assets/logo.svg"/>
          </template>
          <template #title>
            <h3 class="text-h5 font-weight-bold">Get started with GeoTablo</h3>
          </template>
          <template #subtitle>
            <div class="text-subtitle-1">
              Upload your data file (xls,csv etc) above
            </div>
          </template>
          <template #actions>
            <v-file-input label="Select a file" variant="solo" show-size class="mr-16 pr-16"
                          @change="handleFileUpload"/>
          </template>
          <v-overlay v-if="fileSelected"
                     opacity=".12"
                     scrim="primary"
                     contained
                     model-value
                     persistent
          />
        </v-card>
      </v-col>
    </v-row> <!-- end of step-001-select-file -->
    <v-row v-if="fileSelected" id="step-002-display-table">
      <v-col cols="12">
        <v-card
          class="py-2"
          color="surface-variant"
          prepend-icon="mdi-text-box-outline"
          rel="noopener noreferrer"
          rounded="lg"
          title="Table data"
          variant="text"
        >
          <template v-slot:text>
            <v-text-field
              v-model="search"
              label="Search"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              single-line
            ></v-text-field>
          </template>
          <template #default>
            <v-data-table
              height="400" fixed-header
              :headers="getFilteredHeaders" :search="search" :items="records"
              :row-props="getRowClass"
              @click:row="handleRowClick"
            >
              <template v-slot:item.actions="{ item }">
                <v-icon
                  class="me-2"
                  size="small"
                  @click="editItem(item)"
                >
                  mdi-pencil
                </v-icon>
                <v-icon
                  size="small"
                  @click="deleteItem(item)"
                >
                  mdi-delete
                </v-icon>
              </template>
            </v-data-table>
          </template>
        </v-card>
      </v-col>
    </v-row>  <!-- end of step-002-display-table -->
  </v-responsive>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { read, utils } from "xlsx";
import { getLog } from "@/config";
import { useDataStore, ITableHeader } from "@/stores/DataStore";
import { storeToRefs } from "pinia";
import { isNullOrUndefined } from "@/tools/utils";

const store = useDataStore()
const log = getLog("Table", 4, 2)
const fileSelected = ref(false)
const search = ref<string>('')
const clickedRowIndex = ref(null)
const editedIndex = ref(-1)
const editedItem = ref({})
const showDialog = ref(false)

const {getHeaders, records} = storeToRefs(store)

//// EVENT SECTION

const emit = defineEmits(["data-loaded", "data-error", "row-clicked"])

//// WATCH SECTION

//// COMPUTED SECTION

const getFilteredHeaders = computed(() => {
  return  getHeaders.value.filter((header:ITableHeader) => header.isVisible)
})


const handleFileUpload = (e: Event) => {
  const inputFile = (e.target as HTMLInputElement).files?.[0];
  if (inputFile) {
    log.l("file selected :", inputFile);
    const reader = new FileReader();
    reader.onload = (e) => {
      const FileContent = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(FileContent, {type: 'array'});
      log.l("workbook", workbook)
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const sheetData = utils.sheet_to_json(sheet, {header: 1});
      log.l("sheetData", sheetData)
      store.setHeaders(sheetData.shift() as string[])
      store.setData(sheetData)
      emit("data-loaded", store.records)
    };
    reader.readAsArrayBuffer(inputFile);
    fileSelected.value = true
  }
};
const handleRowClick = (myEvent:Event, row: any) => {
  log.l("Row clicked:myEvent,row", myEvent, row);
  clickedRowIndex.value = row.index
  emit("row-clicked", row)
  // Add your custom logic here
};
const getRowClass = (row: any) => {
  // log.t("getRowClass", row, clickedRowIndex.value)
  if (isNullOrUndefined(clickedRowIndex.value)) {
    return {class: {'un-clicked-row':true}};
  }
  return clickedRowIndex.value === row.index ? { class: { 'clicked-row': true } } : { class: { 'un-clicked-row': true } }
};

const editItem = (item:Record<string, any>) => {
  log.t("editItem", item)
  editedIndex.value = store.records.indexOf(item)
  editedItem.value = Object.assign({}, item)
  showDialog.value = true
};

const deleteItem = (item:Record<string, any>) => {
  log.t("deleteItem", item)
  const index = store.records.indexOf(item)
  store.records.splice(index, 1)
};
</script>

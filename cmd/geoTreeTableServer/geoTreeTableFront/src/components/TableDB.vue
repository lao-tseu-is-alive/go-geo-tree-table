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
    <v-row>
      <v-col cols="12">
        <v-card
          class="py-2"
          color="surface-variant"
          prepend-icon="mdi-text-box-outline"
          rel="noopener noreferrer"
          rounded="lg"
          title="Données Points arbres déjà dans la Base de données"
          variant="text"
        >
          <template v-slot:text>

          </template>

          <template #default>
            <v-data-table
              height="650"
              fixed-header
              :headers="getFilteredHeaders"
              :items="getData"
              :row-props="getRowClass"
              @click:row="handleRowClick"
            >

            </v-data-table>
          </template>
        </v-card>
      </v-col>
    </v-row>
  </v-responsive>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { getLog } from "@/config";
import { useGeoTreeStore,  } from "@/stores/geoTreeStore";
import { ITableHeader } from "@/tools/TableTypes";
import { storeToRefs } from "pinia";
import { isNullOrUndefined } from "@/tools/utils";

const store = useGeoTreeStore();
const log = getLog("Table", 4, 2);
const clickedRowIndex = ref(null);

const { getHeaders, getData } = storeToRefs(store);

//// EVENT SECTION

const emit = defineEmits(["row-clicked"]);

//// WATCH SECTION

//// COMPUTED SECTION

const getFilteredHeaders = computed(() => {
  return getHeaders.value.filter((header: ITableHeader) => header.isVisible);
});

const handleRowClick = (myEvent: Event, row: any) => {
  log.l("Row clicked:myEvent,row", myEvent, row);
  clickedRowIndex.value = row.index;
  emit("row-clicked", row);
};
const getRowClass = (row: any) => {
  // log.t("getRowClass", row, clickedRowIndex.value)
  if (isNullOrUndefined(clickedRowIndex.value)) {
    return { class: { "un-clicked-row": true } };
  }
  return clickedRowIndex.value === row.index
    ? { class: { "clicked-row": true } }
    : { class: { "un-clicked-row": true } };
};
</script>

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
          title="Table data"
          variant="text"
        >
          <!--
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
          -->

          <template #default>
            <v-data-table
              height="400"
              fixed-header
              :headers="getFilteredHeaders"
              :search="search"
              :items="getData"
              :row-props="getRowClass"
              @click:row="handleRowClick"
            >
              <!--
              <template v-slot:item.actions="{ item }">
                <v-icon class="me-2" size="small" @click="editItem(item)">
                  mdi-pencil
                </v-icon>
                <v-icon size="small" @click="deleteItem(item)">
                  mdi-delete
                </v-icon>
              </template>
              -->
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
import { useDataStore, ITableHeader } from "@/stores/DataStore";
import { storeToRefs } from "pinia";
import { isNullOrUndefined } from "@/tools/utils";

const store = useDataStore();
const log = getLog("Table", 4, 2);
const search = ref<string>("");
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

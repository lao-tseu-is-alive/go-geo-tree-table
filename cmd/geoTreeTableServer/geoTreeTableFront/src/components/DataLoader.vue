<style scoped>
.data-loader-error-message {
  overflow-wrap: anywhere;
  white-space: pre-line;
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
              le format doit respecter le schéma suivant :<br />
              {{ validHeaderRow.join(", ") }}
            </div>
            <v-alert
              v-if="isInvalidFile"
              :title="isInvalidFileTitle"
              type="error"
            >
              <div class="data-loader-error-message">
                {{ isInvalidFileMsg }}
              </div>
            </v-alert>
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
import type { ITableHeader } from "@/tools/TableTypes";
import {
  MAX_ALTITUDE,
  MAX_POS_EAST,
  MAX_POS_NORTH,
  MIN_ALTITUDE,
  MIN_POS_EAST,
  MIN_POS_NORTH,
  validHeaderRow,
} from "@/stores/geoTree";
import { storeToRefs } from "pinia";
import { isNullOrUndefined, isValidFrDate } from "@/tools/utils";

const store = useDataStore();
const log = getLog("DataLoader", 4, 2);
const fileSelected = ref(false);
const displayFieldsList = ref(false);
const isInvalidFile = ref(false);
const isInvalidFileTitle = ref("");
const isInvalidFileMsg = ref("");
const fileHasNoHeader = ref(true);
const { getHeaders } = storeToRefs(store);
const expectedColumnCount = validHeaderRow.length;
const expectedDateFormat = "JJ.MM.AAAA";
const expectedSchema = validHeaderRow.join(";");
const dateColumnIndex = expectedColumnCount - 2;
const dateColumnName = validHeaderRow[dateColumnIndex];
const altitudeColumnIndex = validHeaderRow.findIndex(
  (header) => `${header}`.trim().toLowerCase() === "z",
);
const altitudeColumnName =
  altitudeColumnIndex >= 0 ? validHeaderRow[altitudeColumnIndex] : "z";
const eastColumnIndex = validHeaderRow.findIndex(
  (header) => `${header}`.trim().toLowerCase() === "e",
);
const northColumnIndex = validHeaderRow.findIndex(
  (header) => `${header}`.trim().toLowerCase() === "n",
);

interface IInvalidDataRowShape {
  rowNumber: number;
  receivedColumnCount: number;
}

interface IInvalidDataRowDate {
  rowNumber: number;
  receivedValue: string;
}

interface IInvalidDataRowAltitude {
  rowNumber: number;
  receivedValue: string;
}

interface IInvalidDataRowCoordinate {
  rowNumber: number;
  receivedValue: string;
}

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

const setInvalidFile = (title: string, msg: string) => {
  isInvalidFile.value = true;
  isInvalidFileTitle.value = title;
  isInvalidFileMsg.value = msg;
};

const resetInvalidFile = () => {
  isInvalidFile.value = false;
  isInvalidFileTitle.value = "";
  isInvalidFileMsg.value = "";
};

const getReceivedColumnsLabel = (row: unknown[]) => {
  return row.map((cell) => `${cell ?? ""}`.trim()).join(";");
};

const isEmptyCell = (cell: unknown) => `${cell ?? ""}`.trim() === "";

// Le parseur de feuille (xlsx) ne restitue pas les cellules vides situées en
// fin de ligne : "7001;31;...;19.08.2026;;" est rendu avec 9 colonnes au lieu
// de 10. À l'inverse, un point-virgule final ajoute une colonne vide en trop.
// On enlève donc les colonnes vides de fin avant toute vérification.
const trimTrailingEmptyCells = (row: unknown[]): unknown[] => {
  const cells = [...row];
  while (cells.length > 0 && isEmptyCell(cells[cells.length - 1])) {
    cells.pop();
  }
  return cells;
};

// Normalise une ligne de données : colonnes vides de fin supprimées, puis
// complétées par des chaînes vides jusqu'au nombre de colonnes attendu.
// Une ligne qui contient des valeurs au-delà des colonnes attendues garde sa
// longueur réelle afin d'être signalée comme invalide.
const normalizeDataRow = (row: unknown[]): unknown[] => {
  const cells = trimTrailingEmptyCells(row);
  while (cells.length < expectedColumnCount) {
    cells.push("");
  }
  return cells;
};

const getInvalidDataRowShapes = (
  rows: unknown[][],
  firstDataRowNumber: number,
): IInvalidDataRowShape[] => {
  log.t(`in getInvalidDataRowShapes rows.length :${rows.length}  `);
  return rows
    .map((row, index) => ({
      rowNumber: firstDataRowNumber + index,
      receivedColumnCount: row.length,
    }))
    .filter((row) => row.receivedColumnCount !== expectedColumnCount);
};

const buildInvalidDataShapeMessage = (
  invalidRows: IInvalidDataRowShape[],
  firstInvalidRow: unknown[],
) => {
  const displayedRows = invalidRows
    .slice(0, 5)
    .map((row) => `ligne ${row.rowNumber}: ${row.receivedColumnCount} colonnes`)
    .join("; ");
  const moreRows =
    invalidRows.length > 5
      ? `; ${invalidRows.length - 5} autre(s) ligne(s) invalide(s)`
      : "";
  const missingColumnHint = invalidRows.some(
    (row) => row.receivedColumnCount > expectedColumnCount,
  )
    ? ` Une colonne en trop a ete detectee: verifiez les separateurs ";" surnumeraires ou une valeur (par exemple un commentaire) contenant un ";".`
    : ` Une colonne semble absente: verifiez notamment la colonne "${altitudeColumnName}" (altitude Z, ajoutee apres E et N) et la colonne "essence".`;

  return [
    `Le fichier doit contenir exactement ${expectedColumnCount} colonnes.`,
    `Colonnes attendues: ${expectedSchema}.`,
    `Probleme detecte: ${displayedRows}${moreRows}.`,
    `Premiere ligne invalide recue: ${getReceivedColumnsLabel(firstInvalidRow)}.`,
    missingColumnHint,
  ]
    .filter((part) => part !== "")
    .join("\n");
};

const buildInvalidHeaderShapeMessage = (receivedHeaderRow: unknown[]) => {
  return [
    `L'entete du fichier doit contenir exactement ${expectedColumnCount} colonnes.`,
    `Colonnes attendues: ${expectedSchema}.`,
    `Colonnes recues: ${getReceivedColumnsLabel(receivedHeaderRow)}.`,
  ].join("\n");
};

const getInvalidDataRowDates = (
  rows: unknown[][],
  firstDataRowNumber: number,
): IInvalidDataRowDate[] => {
  return rows
    .map((row, index) => ({
      rowNumber: firstDataRowNumber + index,
      receivedValue: `${row[dateColumnIndex] ?? ""}`.trim(),
    }))
    .filter((row) => !isValidFrDate(row.receivedValue));
};

const buildInvalidDataDateMessage = (invalidRows: IInvalidDataRowDate[]) => {
  const displayedRows = invalidRows
    .slice(0, 5)
    .map((row) => `ligne ${row.rowNumber}: "${row.receivedValue}"`)
    .join("; ");
  const moreRows =
    invalidRows.length > 5
      ? `; ${invalidRows.length - 5} autre(s) date(s) invalide(s)`
      : "";

  return [
    `La colonne "${dateColumnName}" doit contenir une date valide.`,
    `Format attendu: ${expectedDateFormat}, par exemple 25.08.2025.`,
    `Date(s) invalide(s): ${displayedRows}${moreRows}.`,
    "Corrigez les valeurs impossibles comme un mois superieur a 12 ou un jour inexistant.",
  ].join("\n");
};

// Une altitude Z est valide si elle est vide, égale à 0 (considérée comme
// nulle), ou un nombre compris entre MIN_ALTITUDE et MAX_ALTITUDE.
const isValidAltitudeValue = (rawValue: string): boolean => {
  const value = rawValue.trim();
  if (value === "") {
    return true;
  }
  const numericValue = Number(value.replace(",", "."));
  if (Number.isNaN(numericValue)) {
    return false;
  }
  if (numericValue === 0) {
    return true;
  }
  return numericValue >= MIN_ALTITUDE && numericValue <= MAX_ALTITUDE;
};

const getInvalidDataRowAltitudes = (
  rows: unknown[][],
  firstDataRowNumber: number,
): IInvalidDataRowAltitude[] => {
  return rows
    .map((row, index) => ({
      rowNumber: firstDataRowNumber + index,
      receivedValue: `${row[altitudeColumnIndex] ?? ""}`.trim(),
    }))
    .filter((row) => !isValidAltitudeValue(row.receivedValue));
};

const buildInvalidDataAltitudeMessage = (
  invalidRows: IInvalidDataRowAltitude[],
) => {
  const displayedRows = invalidRows
    .slice(0, 5)
    .map((row) => `ligne ${row.rowNumber}: "${row.receivedValue}"`)
    .join("; ");
  const moreRows =
    invalidRows.length > 5
      ? `; ${invalidRows.length - 5} autre(s) altitude(s) invalide(s)`
      : "";

  return [
    `La colonne "${altitudeColumnName}" (altitude Z) doit etre vide, 0, ou un nombre entre ${MIN_ALTITUDE} et ${MAX_ALTITUDE}.`,
    `Altitude(s) invalide(s): ${displayedRows}${moreRows}.`,
  ].join("\n");
};

// Une coordonnée E ou N est obligatoire : elle doit être un nombre compris
// entre min et max (bornes MN95 / EPSG:2056).
const isValidCoordinateValue = (
  rawValue: string,
  min: number,
  max: number,
): boolean => {
  const value = rawValue.trim();
  if (value === "") {
    return false;
  }
  const numericValue = Number(value.replace(",", "."));
  if (Number.isNaN(numericValue)) {
    return false;
  }
  return numericValue >= min && numericValue <= max;
};

const getInvalidDataRowCoordinates = (
  rows: unknown[][],
  firstDataRowNumber: number,
  columnIndex: number,
  min: number,
  max: number,
): IInvalidDataRowCoordinate[] => {
  return rows
    .map((row, index) => ({
      rowNumber: firstDataRowNumber + index,
      receivedValue: `${row[columnIndex] ?? ""}`.trim(),
    }))
    .filter((row) => !isValidCoordinateValue(row.receivedValue, min, max));
};

const buildInvalidDataCoordinateMessage = (
  columnName: string,
  invalidRows: IInvalidDataRowCoordinate[],
  min: number,
  max: number,
) => {
  const displayedRows = invalidRows
    .slice(0, 5)
    .map((row) => `ligne ${row.rowNumber}: "${row.receivedValue}"`)
    .join("; ");
  const moreRows =
    invalidRows.length > 5
      ? `; ${invalidRows.length - 5} autre(s) valeur(s) invalide(s)`
      : "";

  return [
    `La colonne "${columnName}" doit contenir un nombre entre ${min} et ${max}.`,
    `Valeur(s) invalide(s): ${displayedRows}${moreRows}.`,
  ].join("\n");
};

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
      // defval: "" évite les "trous" dans les lignes pour les cellules vides
      // (colonnes z ou commentaire non renseignées).
      const sheetData = utils.sheet_to_json(sheet, { header: 1, defval: "" });
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
      if (filteredSheetData.length === 0) {
        const msg = "Le fichier ne contient aucune donnée.";
        setInvalidFile("Fichier vide", msg);
        emit("data-error", msg);
        return;
      }

      let receivedHeaderRow: string[];
      // Asserting the type to be an array of arrays of unknown values
      const data = filteredSheetData as unknown[][];
      let firstDataRowNumber = 1;

      //let's detect content based on first row content
      fileHasNoHeader.value =
        typeof data[0][0] == "number" && typeof data[0][1] == "number";

      if (fileHasNoHeader.value) {
        // File has no header, use validHeaderRow and all rows are data
        receivedHeaderRow = validHeaderRow;
        log.l("File has no header. Using predefined headers.");
      } else {
        // File has a header, validate it
        receivedHeaderRow = trimTrailingEmptyCells(
          data.shift() as unknown[],
        ) as string[];
        firstDataRowNumber = 2;
        log.l("receivedHeaderRow", receivedHeaderRow);
        if (receivedHeaderRow.length !== expectedColumnCount) {
          const msg = buildInvalidHeaderShapeMessage(receivedHeaderRow);
          setInvalidFile("Entête du fichier invalide", msg);
          emit("data-error", msg);
          return;
        }

        const invalidHeaders = <IInvalidFieldHeader[]>[];
        let isHeaderRowValid = true;
        let invalidErrMSg = "";
        for (let index = 0; index < validHeaderRow.length; index++) {
          const cell = `${receivedHeaderRow[index]}`.trim().toLowerCase();
          const valid = `${validHeaderRow[index]}`.trim().toLowerCase();
          if (cell.includes(valid)) {
            log.l(
              `success in header num ${index}, expected: '${valid}', received: '${cell}'`,
            );
          } else {
            log.w(
              `error in header num ${index}, expected: ${validHeaderRow[index]}, received: ${cell}`,
            );
            invalidErrMSg += `col[${index + 1}]: ${cell}, au lieu de :${validHeaderRow[index]} `;
            invalidHeaders.push({
              key: index,
              expected: validHeaderRow[index],
              received: cell,
            });
            isHeaderRowValid = false;
          }
        }
        if (!isHeaderRowValid) {
          setInvalidFile("Entête du fichier invalide", invalidErrMSg);
          emit("header-error", invalidHeaders);
          return;
        }
      }

      const dataRows = data.map(normalizeDataRow);
      const invalidDataRowShapes = getInvalidDataRowShapes(
        dataRows,
        firstDataRowNumber,
      );
      if (invalidDataRowShapes.length > 0) {
        const firstInvalidRow =
          dataRows[invalidDataRowShapes[0].rowNumber - firstDataRowNumber];
        const msg = buildInvalidDataShapeMessage(
          invalidDataRowShapes,
          firstInvalidRow,
        );
        setInvalidFile("Structure du fichier invalide", msg);
        emit("data-error", msg);
        return;
      }

      const invalidDataRowDates = getInvalidDataRowDates(
        dataRows,
        firstDataRowNumber,
      );
      if (invalidDataRowDates.length > 0) {
        const msg = buildInvalidDataDateMessage(invalidDataRowDates);
        setInvalidFile("Date invalide dans le fichier", msg);
        emit("data-error", msg);
        return;
      }

      const coordinateChecks = [
        {
          columnIndex: eastColumnIndex,
          columnName: "E",
          min: MIN_POS_EAST,
          max: MAX_POS_EAST,
        },
        {
          columnIndex: northColumnIndex,
          columnName: "N",
          min: MIN_POS_NORTH,
          max: MAX_POS_NORTH,
        },
      ];
      for (const check of coordinateChecks) {
        const invalidCoordinates = getInvalidDataRowCoordinates(
          dataRows,
          firstDataRowNumber,
          check.columnIndex,
          check.min,
          check.max,
        );
        if (invalidCoordinates.length > 0) {
          const msg = buildInvalidDataCoordinateMessage(
            check.columnName,
            invalidCoordinates,
            check.min,
            check.max,
          );
          setInvalidFile(`Coordonnée ${check.columnName} invalide`, msg);
          emit("data-error", msg);
          return;
        }
      }

      const invalidDataRowAltitudes = getInvalidDataRowAltitudes(
        dataRows,
        firstDataRowNumber,
      );
      if (invalidDataRowAltitudes.length > 0) {
        const msg = buildInvalidDataAltitudeMessage(invalidDataRowAltitudes);
        setInvalidFile("Altitude invalide dans le fichier", msg);
        emit("data-error", msg);
        return;
      }

      store.setHeaders(receivedHeaderRow);
      store.setData(dataRows);
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

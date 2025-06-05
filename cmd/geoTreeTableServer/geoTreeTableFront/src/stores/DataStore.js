import { defineStore } from "pinia";
import { getLog } from "@/config";
import { escapeJsonString, extractFirstMatch, getDateIsoFromTimeStamp, isNullOrUndefined, isTimestamp, parseJsonWithDetailedError, } from "@/tools/utils";
const log = getLog("DataStore", 3, 2);
function getValueFromTemplate(r, templateKey, defaultValue) {
    let myIconPath = defaultValue;
    if (templateKey in r || r.hasOwnProperty(templateKey)) {
        myIconPath = r.icon_path !== null ? r.icon_path : defaultValue;
        //log.l(`> IN getGeoJson.. i : ${i} record myIconPath : ${myIconPath}`, r)
        const myKeywordRe = /\{([^\}]+)\}/gm;
        const keyword = extractFirstMatch(myIconPath, myKeywordRe);
        //log.l(`> IN getGeoJson.. i : ${i} record keyword : ${keyword}`)
        if (keyword !== "") {
            if (keyword in r || r.hasOwnProperty(keyword)) {
                myIconPath = myIconPath.replace(`{${keyword}}`, r[keyword]);
            }
        }
        //log.l(`> IN getGeoJson.. i : ${i} record myIconPath : ${myIconPath}`)
    }
    return myIconPath;
}
export const useDataStore = defineStore("data", {
    state: () => ({
        records: [],
        headers: [],
        columns: [],
        xIndex: -1,
        yIndex: -1,
        nameIndex: -1,
        nameField: "name",
        keyIndex: -1,
        posXName: "x",
        posYName: "y",
        doNotDisplayFieldsNames: [
            "x",
            "y",
            "pos_x",
            "pos_y",
            "lon",
            "lat",
            "longitude",
            "latitude",
            "icon_path",
        ],
        doNotDisplayFieldsIndexes: [],
        searchParameters: "",
    }),
    getters: {
        getData: (state) => {
            log.t(`> Entering getData.. records.length : ${state.records.length}`);
            const filteredArray = state.records.map((row) => {
                const newRow = {}; // Use a type assertion if you have a defined type for your data
                for (const key in row) {
                    if ((key.includes("date")) && isTimestamp(row[key])) {
                        // Modify the date field here (e.g., convert to a Date object, format differently)
                        log.t(`key : '${key}' row[key] : ${row[key]}`);
                        newRow[key] = getDateIsoFromTimeStamp(row[key]);
                        log.t(`key : '${key}' newRow[key] : ${newRow[key]}`);
                    }
                    else {
                        newRow[key] = row[key];
                    }
                }
                log.t(`newRow `, newRow);
                return newRow;
            });
            log.w("filteredArray", filteredArray);
            return filteredArray;
        },
        getHeaders: (state) => state.headers,
        numRecords: (state) => {
            if (state.records === null) {
                return 0;
            }
            return state.records.length;
        },
        getGeoJson: (state) => {
            log.t(`> Entering getGeoJson.. records.length : ${state.records.length}`);
            // const startTime = performance.now()
            if (state.records.length > 0 && state.xIndex >= 0 && state.yIndex >= 0) {
                log.t(`> IN getGeoJson.. records.length : ${state.records.length} ready to do ForEach`);
                let myGeoJson = null;
                let result = '{"type": "FeatureCollection", "features": [';
                //state.records.forEach((r: Record<string, any>) => {
                for (let i = 0; i < state.records.length; i++) {
                    const r = state.records[i];
                    let myTypeId = 0;
                    if ("type_id" in r || r.hasOwnProperty("type_id")) {
                        myTypeId = r.type_id !== null ? r.type_id : 0;
                    }
                    let myIconPath = getValueFromTemplate(r, "icon_path", "/img/gomarker_star_blue.png");
                    let myName = "";
                    if (state.nameIndex >= 0) {
                        myName = !isNullOrUndefined(r[state.nameField])
                            ? escapeJsonString(r[state.nameField])
                            : `record[${r.id}]`;
                    }
                    let myX = 0;
                    if (state.xIndex >= 0) {
                        //myX = r[`f${state.xIndex}`] !== null ? r[`f${state.xIndex}`] : 0
                        myX = r[`${state.posXName}`] !== null ? r[`${state.posXName}`] : 0;
                    }
                    let myY = 0;
                    if (state.yIndex >= 0) {
                        myY = r[`${state.posYName}`] !== null ? r[`${state.posYName}`] : 0;
                    }
                    const myId = "id" in r && r.id !== null ? r.id : 0;
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
              "coordinates": [${myX}, ${myY}]
              },
              "properties": {
                "id": "${myId}",
                "type_id": ${myTypeId},
                "name": "${myName}",
                "icon_path": "${myIconPath}"
              }},`;
                    //log.l(feature)
                    result += feature;
                } //) end of for loop
                //log.l(`> IN getGeoJson.. result after ForEach: ${result}`)
                if (result.endsWith(",")) {
                    result = result.slice(0, -1);
                }
                result += "]}";
                try {
                    myGeoJson = parseJsonWithDetailedError(result);
                }
                catch (e) {
                    log.w(`> Error in getGeoJson.. JSON.parse(result) : ${e}`, result);
                }
                return myGeoJson;
            }
            return { type: "FeatureCollection", features: [] };
        },
    },
    actions: {
        clearData() {
            log.t("#> clearData");
            this.records = [];
            this.headers = [];
            this.columns = [];
            this.xIndex = -1;
            this.yIndex = -1;
            this.nameIndex = -1;
            this.nameField = "name";
            this.keyIndex = -1;
            this.posXName = "x";
            this.posYName = "y";
            this.doNotDisplayFieldsIndexes = [];
        },
        setData(tableData) {
            log.t("#> entering setData ");
            this.records = [];
            tableData.forEach((row, index) => {
                let currentRow = {};
                currentRow._table_row_index = index;
                row.forEach((cell, cellIndex) => {
                    //const ;
                    let doNotDisplay = false;
                    const currentField = this.headers[cellIndex].title.toLowerCase();
                    doNotDisplay = this.doNotDisplayFieldsNames.includes(currentField);
                    if (doNotDisplay) {
                        //log.l(`setData:doNotDisplay : ${index} : ${cellIndex} : ${cell}`);
                        currentRow[currentField] = cell;
                    }
                    else {
                        currentRow[currentField] = cell;
                    }
                });
                if (this.keyIndex >= 0) {
                    currentRow.id = row[this.keyIndex];
                }
                else {
                    currentRow.id = index;
                }
                // log.l(`setData:currentRow : ${index}`, currentRow);
                this.records.push(currentRow);
            });
            log.l("#> setData after loop :", this.records);
        },
        setHeaders(tableHeaders) {
            log.t("#> setHeaders", tableHeaders);
            this.headers = [];
            this.columns = tableHeaders;
            tableHeaders.forEach((header, index) => {
                const currentHeader = {
                    title: "field",
                    align: "start",
                    key: `f${index}`,
                    isVisible: true,
                    frozenField: false,
                };
                const doNotDisplay = this.doNotDisplayFieldsNames.includes(header.toLowerCase());
                if (header === "") {
                    log.w(`Empty header at index ${index}`);
                    currentHeader.title = `field ${index}`;
                }
                else {
                    if (header.toLowerCase() == "pos_x" || header.toLowerCase() == "x") {
                        log.l(`pos_x or x found at index ${index}`);
                        currentHeader.align = "end";
                        this.xIndex = index;
                    }
                    if (header.toLowerCase() == "pos_y" || header.toLowerCase() == "y") {
                        log.l(`pos_y or y found at index ${index}`);
                        currentHeader.align = "end";
                        this.yIndex = index;
                    }
                    if (header.toLowerCase() == "name" ||
                        header.toLowerCase() == "title") {
                        log.l(`name or title found at index ${index}`);
                        currentHeader.align = "center";
                        this.nameIndex = index;
                        this.nameField = header.toLowerCase();
                    }
                    if (header.toLowerCase() == "id" || header.toLowerCase() == "key") {
                        log.l(`id or key found at index ${index}`);
                        currentHeader.align = "center";
                        this.keyIndex = index;
                    }
                    currentHeader.isVisible = true;
                    if (doNotDisplay) {
                        log.l(`doNotDisplay : ${index} : ${header}`);
                        currentHeader.isVisible = false;
                        this.doNotDisplayFieldsIndexes.push(index);
                    }
                    currentHeader.title = header;
                    currentHeader.key = `${header}`.toLowerCase();
                    this.headers.push(currentHeader);
                }
            });
            this.headers.push({
                title: "Actions",
                key: "actions",
                sortable: false,
                isVisible: true,
                frozenField: true,
            });
            log.l("#> setHeaders after loop :", this.headers);
        },
        toggleVisibility(field) {
            log.t("#> toggleVisibility", field);
            const index = this.headers.indexOf(field);
            this.headers[index].isVisible = !this.headers[index].isVisible;
        },
        setPosXName(name) {
            log.t("#> setPosXName", name);
            if (this.columns.includes(name)) {
                this.posXName = name;
            }
            else {
                log.w(`setPosXName: ${name} not found in columns`);
            }
        },
        setPosYName(name) {
            log.t("#> setPosYName", name);
            if (this.columns.includes(name)) {
                this.posYName = name;
            }
            else {
                log.w(`setPosYName: ${name} not found in columns`);
            }
        },
        count(filter) {
            log.t("#> count", filter);
            return this.records.filter((item) => `${item}`.includes(filter)).length;
        },
    },
});

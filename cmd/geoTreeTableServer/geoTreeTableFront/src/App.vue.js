/// <reference types="../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onMounted, ref } from "vue";
import { isNullOrUndefined } from "@/tools/utils";
//import MyTable from "./components/Table.vue";
//import MyDataLoader from "./components/DataLoader.vue";
import VResizeDrawer from "@wdns/vuetify-resize-drawer";
import { APP, getLog, DEV, BUILD_DATE, VERSION } from "@/config";
import MapLausanne from "@/components/Map.vue";
import { useDataStore } from "@/stores/DataStore";
import { storeToRefs } from "pinia";
const log = getLog(APP, 4, 2);
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
    handlePosition: "top",
    height: undefined,
    image: undefined,
    location: "left",
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
    storageType: "local",
    tag: "nav",
    temporary: false,
    theme: "light",
    width: "350px",
});
const handleDataLoaded = () => {
    log.t(`## handleDataLoaded entering...`);
    // dataLoaded.value = true;
};
const handleFieldsSettingsReady = () => {
    log.t(`## handleFieldsSettingsReady entering...`);
    dataLoaded.value = true;
};
const handleMapClickEvent = (clickInfo) => {
    log.t(`## entering... pos:${clickInfo.x}, ${clickInfo.y}`);
    log.t(`##features length :${clickInfo.features.length}`, clickInfo.features);
};
const handleRowClicked = (item) => {
    if ("index" in item || item.hasOwnProperty("index")) {
        log.t(`## entering... row index:${item.index}`, item);
        if (!isNullOrUndefined(item.index)) {
            const selectedRow = store.records[item.index];
            log.t(`## selectedRow:`, selectedRow);
            mapCenter.value = [selectedRow.x, selectedRow.y];
            mapZoom.value = 10;
        }
    }
    else {
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
onMounted(() => {
    log.t(`Main App.vue ${APP}-${VERSION}, du ${BUILD_DATE}`);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.VApp;
/** @type {[typeof __VLS_components.VApp, typeof __VLS_components.vApp, typeof __VLS_components.VApp, typeof __VLS_components.vApp, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({}));
const __VLS_2 = __VLS_1({}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.VAppBar;
/** @type {[typeof __VLS_components.VAppBar, typeof __VLS_components.vAppBar, typeof __VLS_components.VAppBar, typeof __VLS_components.vAppBar, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    app: true,
    color: "primary",
    dark: true,
}));
const __VLS_7 = __VLS_6({
    app: true,
    color: "primary",
    dark: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
const __VLS_9 = {}.VAppBarNavIcon;
/** @type {[typeof __VLS_components.VAppBarNavIcon, typeof __VLS_components.vAppBarNavIcon, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    ...{ 'onClick': {} },
}));
const __VLS_11 = __VLS_10({
    ...{ 'onClick': {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
let __VLS_13;
let __VLS_14;
let __VLS_15;
const __VLS_16 = {
    onClick: (__VLS_ctx.toggleDrawer)
};
var __VLS_12;
const __VLS_17 = {}.VToolbarTitle;
/** @type {[typeof __VLS_components.VToolbarTitle, typeof __VLS_components.vToolbarTitle, typeof __VLS_components.VToolbarTitle, typeof __VLS_components.vToolbarTitle, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({}));
const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
(__VLS_ctx.APP);
(__VLS_ctx.VERSION);
var __VLS_20;
if (__VLS_ctx.DEV) {
    const __VLS_21 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({
        ...{ 'onClick': {} },
    }));
    const __VLS_23 = __VLS_22({
        ...{ 'onClick': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_22));
    let __VLS_25;
    let __VLS_26;
    let __VLS_27;
    const __VLS_28 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.DEV))
                return;
            __VLS_ctx.showDebug = !__VLS_ctx.showDebug;
        }
    };
    __VLS_24.slots.default;
    (__VLS_ctx.showDebug ? "Hide Debug" : "Show Debug");
    var __VLS_24;
}
const __VLS_29 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({}));
const __VLS_31 = __VLS_30({}, ...__VLS_functionalComponentArgsRest(__VLS_30));
if (__VLS_ctx.dataLoaded) {
    const __VLS_33 = {}.VBtn;
    /** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
    // @ts-ignore
    const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
        ...{ 'onClick': {} },
        icon: true,
        title: "clear data and import a new file",
    }));
    const __VLS_35 = __VLS_34({
        ...{ 'onClick': {} },
        icon: true,
        title: "clear data and import a new file",
    }, ...__VLS_functionalComponentArgsRest(__VLS_34));
    let __VLS_37;
    let __VLS_38;
    let __VLS_39;
    const __VLS_40 = {
        onClick: (__VLS_ctx.clearData)
    };
    __VLS_36.slots.default;
    const __VLS_41 = {}.VIcon;
    /** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
    // @ts-ignore
    const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({}));
    const __VLS_43 = __VLS_42({}, ...__VLS_functionalComponentArgsRest(__VLS_42));
    __VLS_44.slots.default;
    var __VLS_44;
    var __VLS_36;
}
var __VLS_8;
const __VLS_45 = {}.VResizeDrawer;
/** @type {[typeof __VLS_components.VResizeDrawer, typeof __VLS_components.VResizeDrawer, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
    modelValue: (__VLS_ctx.drawer),
    ...(__VLS_ctx.drawerOptions),
}));
const __VLS_47 = __VLS_46({
    modelValue: (__VLS_ctx.drawer),
    ...(__VLS_ctx.drawerOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_46));
__VLS_48.slots.default;
if (__VLS_ctx.dataLoaded) {
    const __VLS_49 = {}.MyTable;
    /** @type {[typeof __VLS_components.MyTable, ]} */ ;
    // @ts-ignore
    const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
        ...{ 'onRowClicked': {} },
    }));
    const __VLS_51 = __VLS_50({
        ...{ 'onRowClicked': {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_50));
    let __VLS_53;
    let __VLS_54;
    let __VLS_55;
    const __VLS_56 = {
        onRowClicked: (__VLS_ctx.handleRowClicked)
    };
    var __VLS_52;
}
var __VLS_48;
const __VLS_57 = {}.VMain;
/** @type {[typeof __VLS_components.VMain, typeof __VLS_components.vMain, typeof __VLS_components.VMain, typeof __VLS_components.vMain, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({}));
const __VLS_59 = __VLS_58({}, ...__VLS_functionalComponentArgsRest(__VLS_58));
__VLS_60.slots.default;
const __VLS_61 = {}.VContainer;
/** @type {[typeof __VLS_components.VContainer, typeof __VLS_components.vContainer, typeof __VLS_components.VContainer, typeof __VLS_components.vContainer, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    ...{ class: "w-100 full-width" },
}));
const __VLS_63 = __VLS_62({
    ...{ class: "w-100 full-width" },
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
__VLS_64.slots.default;
if (__VLS_ctx.showDebug) {
    const __VLS_65 = {}.VRow;
    /** @type {[typeof __VLS_components.VRow, typeof __VLS_components.vRow, typeof __VLS_components.VRow, typeof __VLS_components.vRow, ]} */ ;
    // @ts-ignore
    const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({}));
    const __VLS_67 = __VLS_66({}, ...__VLS_functionalComponentArgsRest(__VLS_66));
    __VLS_68.slots.default;
    const __VLS_69 = {}.VCol;
    /** @type {[typeof __VLS_components.VCol, typeof __VLS_components.vCol, typeof __VLS_components.VCol, typeof __VLS_components.vCol, ]} */ ;
    // @ts-ignore
    const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
        cols: "12",
    }));
    const __VLS_71 = __VLS_70({
        cols: "12",
    }, ...__VLS_functionalComponentArgsRest(__VLS_70));
    __VLS_72.slots.default;
    const __VLS_73 = {}.VCode;
    /** @type {[typeof __VLS_components.VCode, typeof __VLS_components.vCode, typeof __VLS_components.VCode, typeof __VLS_components.vCode, ]} */ ;
    // @ts-ignore
    const __VLS_74 = __VLS_asFunctionalComponent(__VLS_73, new __VLS_73({
        outlined: true,
        rows: "5",
        readonly: true,
        disabled: true,
    }));
    const __VLS_75 = __VLS_74({
        outlined: true,
        rows: "5",
        readonly: true,
        disabled: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_74));
    __VLS_76.slots.default;
    (__VLS_ctx.getGeoJsonString());
    var __VLS_76;
    var __VLS_72;
    var __VLS_68;
}
const __VLS_77 = {}.VRow;
/** @type {[typeof __VLS_components.VRow, typeof __VLS_components.vRow, typeof __VLS_components.VRow, typeof __VLS_components.vRow, ]} */ ;
// @ts-ignore
const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({}));
const __VLS_79 = __VLS_78({}, ...__VLS_functionalComponentArgsRest(__VLS_78));
__VLS_80.slots.default;
if (__VLS_ctx.dataLoaded) {
    /** @type {[typeof MapLausanne, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(MapLausanne, new MapLausanne({
        ...{ 'onMapClick': {} },
        ref: "myMap",
        zoom: (__VLS_ctx.mapZoom),
        center: (__VLS_ctx.mapCenter),
        geodata: (__VLS_ctx.getGeoJson),
    }));
    const __VLS_82 = __VLS_81({
        ...{ 'onMapClick': {} },
        ref: "myMap",
        zoom: (__VLS_ctx.mapZoom),
        center: (__VLS_ctx.mapCenter),
        geodata: (__VLS_ctx.getGeoJson),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    let __VLS_84;
    let __VLS_85;
    let __VLS_86;
    const __VLS_87 = {
        onMapClick: (__VLS_ctx.handleMapClickEvent)
    };
    /** @type {typeof __VLS_ctx.myMap} */ ;
    var __VLS_88 = {};
    var __VLS_83;
}
var __VLS_80;
var __VLS_64;
var __VLS_60;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['w-100']} */ ;
/** @type {__VLS_StyleScopedClasses['full-width']} */ ;
// @ts-ignore
var __VLS_89 = __VLS_88;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            VResizeDrawer: VResizeDrawer,
            APP: APP,
            DEV: DEV,
            VERSION: VERSION,
            MapLausanne: MapLausanne,
            dataLoaded: dataLoaded,
            mapZoom: mapZoom,
            mapCenter: mapCenter,
            getGeoJson: getGeoJson,
            showDebug: showDebug,
            drawer: drawer,
            drawerOptions: drawerOptions,
            handleMapClickEvent: handleMapClickEvent,
            handleRowClicked: handleRowClicked,
            getGeoJsonString: getGeoJsonString,
            clearData: clearData,
            toggleDrawer: toggleDrawer,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */

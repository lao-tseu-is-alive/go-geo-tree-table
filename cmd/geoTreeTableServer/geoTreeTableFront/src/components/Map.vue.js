/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { onMounted, ref, watch } from "vue";
import { getLog } from "@/config";
import { addGeoJsonLayer, createSwissMap } from "@/components/Map";
import OlMap from "ol/Map";
import OlOverlay from "ol/Overlay";
import LayerSwitcher from "ol-layerswitcher";
import { isNullOrUndefined } from "@/tools/utils";
import { useDataStore } from "@/stores/DataStore";
import { storeToRefs } from "pinia";
const store = useDataStore();
const { numRecords, searchParameters, getGeoJson } = storeToRefs(store);
const log = getLog("MapLausanneVue", 4, 2);
const myLayerName = "GoelandThingLayer";
const posMouseX = ref(0);
const posMouseY = ref(0);
const searchStreet = ref("");
const layerSwitcherVisible = ref(false);
const myOlMap = ref(null);
let myMapOverlay;
const mapTooltip = ref(null);
const myProps = defineProps();
//// EVENT SECTION
const emit = defineEmits(["map-click", "map-error"]);
//// WATCH SECTION
watch(() => myProps.zoom, (val, oldValue) => {
    log.t(` watch myProps.zoom old: ${oldValue}, new val: ${val}`);
    if (val !== undefined) {
        if (val !== oldValue) {
            // set new zoom
            if (myOlMap.value !== null) {
                myOlMap.value.getView().setZoom(val);
            }
        }
    }
}
//  { immediate: true }
);
watch(() => myProps.center, (val, oldValue) => {
    log.t(` watch myProps.center old: ${oldValue}, new val: ${val}`);
    if (val !== undefined) {
        if (val !== oldValue) {
            // do something
            if (myOlMap.value !== null) {
                // recenter map
                myOlMap.value.getView().setCenter(val);
            }
        }
    }
}
//  { immediate: true }
);
watch(() => myProps.geodata, (val, oldValue) => {
    log.t(` watch myProps.geodata old: ${oldValue}, new val: ${val}`);
    if (!isNullOrUndefined(val)) {
        if (val !== oldValue) {
            // do something
            if (myOlMap.value !== null) {
                addGeoJsonLayer(myOlMap.value, myLayerName, val);
            }
        }
        else {
            log.l(`in watch myProps.geodata 😴 😴 NOTHING TO DO old is same as new val: ${val}`);
        }
    }
}
//  { immediate: true }
);
//// COMPUTED SECTION
const getNumRecords = () => {
    if (isNullOrUndefined(numRecords.value)) {
        return 0;
    }
    return numRecords.value;
};
//// FUNCTIONS SECTION
const toggleLayerSwitcher = () => {
    log.t(`# toggleLayerSwitcher layerSwitcherVisible : ${layerSwitcherVisible.value}`);
    layerSwitcherVisible.value = !layerSwitcherVisible.value;
};
const initialize = async (center) => {
    log.t(" #> entering initialize...");
    myOlMap.value = await createSwissMap("map", center, 4, "ch.swisstopo.landeskarte-farbe-10");
    if (myOlMap.value !== null) {
        log.l("initialize() myOlMap is not null : ", myOlMap.value);
        myOlMap.value.on("pointermove", (evt) => {
            posMouseX.value = +Number(evt.coordinate[0]).toFixed(0);
            posMouseY.value = +Number(evt.coordinate[1]).toFixed(0);
            const features = [];
            if (myOlMap.value instanceof OlMap) {
                myOlMap.value.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                    let layerName = "";
                    if (!isNullOrUndefined(layer)) {
                        layerName = layer.get("name");
                    }
                    // on veut les tooltip seulement pour la couche myLayerName
                    if (!isNullOrUndefined(layerName)) {
                        if (layerName.indexOf(myLayerName) > -1) {
                            log.l(`## Feature belongs to ${myLayerName} ! Feature :`, feature);
                            let featureProps = null;
                            if (feature.getProperties().hasOwnProperty("is_cluster_used")) {
                                featureProps = feature.get('cluster_getProperties').features[0].getProperties();
                                log.l(`Feature isCluster : featureProps :`, featureProps);
                            }
                            else {
                                featureProps = feature.getProperties();
                                log.l(`Feature not cluster : featureProps :`, featureProps);
                            }
                            if (!isNullOrUndefined(featureProps)) {
                                const featureInfo = {
                                    id: featureProps.id,
                                    feature,
                                    layer: layerName,
                                    data: featureProps,
                                };
                                //log.l(`Feature id : ${featureProps.id}, feature:`, feature);
                                features.push(featureInfo);
                            }
                            else {
                                features.push({
                                    id: 0,
                                    feature,
                                    layer: layerName,
                                });
                            }
                        }
                    }
                    // return feature
                });
            } // end of forEachFeatureAtPixel
            if (features.length > 0) {
                //log.w("##MapLausanne pointermove EVENT ->Array of features found :", features, mapTooltip.value)
                let strToolTip = "";
                let layerName = "";
                features.forEach((featInfo) => {
                    const currentTitle = featInfo.data.name;
                    layerName += `${featInfo.layer} `;
                    if (!isNullOrUndefined(currentTitle)) {
                        strToolTip += `${currentTitle.replace(/(<([^>]+)>)/gi, "")}<br>`;
                    }
                });
                if (strToolTip.length > 0 && layerName.indexOf(myLayerName) > -1) {
                    // log.w(`Before tooltip layer : ${layerName}`)
                    if (myMapOverlay instanceof OlOverlay) {
                        myMapOverlay.setPosition(evt.coordinate);
                    }
                    if (mapTooltip.value instanceof HTMLDivElement) {
                        mapTooltip.value.style.display = "block";
                        mapTooltip.value.innerHTML = strToolTip;
                    }
                }
                else {
                    if (mapTooltip.value instanceof HTMLDivElement) {
                        mapTooltip.value.style.display = "none";
                        mapTooltip.value.innerHTML = "";
                    }
                }
            }
            else {
                if (mapTooltip.value instanceof HTMLDivElement) {
                    mapTooltip.value.style.display = "none";
                    mapTooltip.value.innerHTML = "";
                }
            }
        });
        myOlMap.value.on("click", (evt) => {
            const x = +Number(evt.coordinate[0]).toFixed(2);
            const y = +Number(evt.coordinate[1]).toFixed(2);
            const features = [];
            if (myOlMap.value instanceof OlMap) {
                myOlMap.value.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
                    let layerName = "";
                    if (!isNullOrUndefined(layer)) {
                        layerName = layer.get("name");
                    }
                    // on veut les tooltip seulement pour la couche myLayerName
                    if (!isNullOrUndefined(layerName)) {
                        if (layerName.indexOf(myLayerName) > -1) {
                            const featureProps = feature.getProperties();
                            if (!isNullOrUndefined(featureProps)) {
                                const featureInfo = {
                                    id: featureProps.id,
                                    // @ts-expect-error it's ok
                                    feature,
                                    layer: layerName,
                                    data: featureProps,
                                };
                                // log.l(`Feature id : ${feature_props.id}, info:`, info);
                                features.push(featureInfo);
                            }
                            else {
                                // @ts-expect-error it's ok
                                features.push({ id: 0, feature, layer: layerName, data: null });
                            }
                        }
                    }
                    // return feature
                });
            } // end of forEachFeatureAtPixel
            if (features.length > 0) {
                features.forEach((featInfo) => {
                    log.l("Feature found : ", featInfo);
                });
            }
            emit("map-click", { x, y, features });
        });
        const divToc = document.getElementById("divLayerSwitcher");
        LayerSwitcher.renderPanel(myOlMap.value, divToc, {});
        if (mapTooltip.value !== null) {
            myMapOverlay = new OlOverlay({
                element: mapTooltip.value,
                offset: [0, -40],
                positioning: "top-center",
            });
            myOlMap.value.addOverlay(myMapOverlay);
        }
        if (getNumRecords() > 0) {
            log.l("initialize() numRecords > 0");
            addGeoJsonLayer(myOlMap.value, myLayerName, getGeoJson.value, 35);
        }
    }
};
onMounted(() => {
    log.t("mounted()");
    const placeStFrancoisM95 = [2538202, 1152364];
    initialize(placeStFrancoisM95);
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.VResponsive;
/** @type {[typeof __VLS_components.VResponsive, typeof __VLS_components.vResponsive, typeof __VLS_components.VResponsive, typeof __VLS_components.vResponsive, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "d-flex fill-height" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "d-flex fill-height" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "text-xs-center" },
});
const __VLS_5 = {}.VDialog;
/** @type {[typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, typeof __VLS_components.VDialog, typeof __VLS_components.vDialog, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
    modelValue: (__VLS_ctx.layerSwitcherVisible),
    eager: true,
    width: "290",
}));
const __VLS_7 = __VLS_6({
    modelValue: (__VLS_ctx.layerSwitcherVisible),
    eager: true,
    width: "290",
}, ...__VLS_functionalComponentArgsRest(__VLS_6));
__VLS_8.slots.default;
const __VLS_9 = {}.VCard;
/** @type {[typeof __VLS_components.VCard, typeof __VLS_components.vCard, typeof __VLS_components.VCard, typeof __VLS_components.vCard, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({}));
const __VLS_11 = __VLS_10({}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.VCardTitle;
/** @type {[typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, typeof __VLS_components.VCardTitle, typeof __VLS_components.vCardTitle, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    ...{ class: "subtitle-1 grey lighten-2 pl-6 pt-2 pb-1" },
    primaryTitle: true,
}));
const __VLS_15 = __VLS_14({
    ...{ class: "subtitle-1 grey lighten-2 pl-6 pt-2 pb-1" },
    primaryTitle: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
var __VLS_16;
const __VLS_17 = {}.VCardText;
/** @type {[typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, typeof __VLS_components.VCardText, typeof __VLS_components.vCardText, ]} */ ;
// @ts-ignore
const __VLS_18 = __VLS_asFunctionalComponent(__VLS_17, new __VLS_17({}));
const __VLS_19 = __VLS_18({}, ...__VLS_functionalComponentArgsRest(__VLS_18));
__VLS_20.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    id: "divLayerSwitcher",
    ...{ class: "layer-switcher-dialog" },
});
var __VLS_20;
const __VLS_21 = {}.VDivider;
/** @type {[typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, typeof __VLS_components.VDivider, typeof __VLS_components.vDivider, ]} */ ;
// @ts-ignore
const __VLS_22 = __VLS_asFunctionalComponent(__VLS_21, new __VLS_21({}));
const __VLS_23 = __VLS_22({}, ...__VLS_functionalComponentArgsRest(__VLS_22));
const __VLS_25 = {}.VCardActions;
/** @type {[typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, typeof __VLS_components.VCardActions, typeof __VLS_components.vCardActions, ]} */ ;
// @ts-ignore
const __VLS_26 = __VLS_asFunctionalComponent(__VLS_25, new __VLS_25({
    ...{ class: "pa-1" },
}));
const __VLS_27 = __VLS_26({
    ...{ class: "pa-1" },
}, ...__VLS_functionalComponentArgsRest(__VLS_26));
__VLS_28.slots.default;
const __VLS_29 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
const __VLS_30 = __VLS_asFunctionalComponent(__VLS_29, new __VLS_29({}));
const __VLS_31 = __VLS_30({}, ...__VLS_functionalComponentArgsRest(__VLS_30));
const __VLS_33 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
const __VLS_34 = __VLS_asFunctionalComponent(__VLS_33, new __VLS_33({
    ...{ 'onClick': {} },
    ...{ class: "caption white--text" },
    color: "indigo lighten-1",
    height: "25",
}));
const __VLS_35 = __VLS_34({
    ...{ 'onClick': {} },
    ...{ class: "caption white--text" },
    color: "indigo lighten-1",
    height: "25",
}, ...__VLS_functionalComponentArgsRest(__VLS_34));
let __VLS_37;
let __VLS_38;
let __VLS_39;
const __VLS_40 = {
    onClick: (...[$event]) => {
        __VLS_ctx.layerSwitcherVisible = false;
    }
};
__VLS_36.slots.default;
var __VLS_36;
var __VLS_28;
var __VLS_12;
var __VLS_8;
const __VLS_41 = {}.VToolbar;
/** @type {[typeof __VLS_components.VToolbar, typeof __VLS_components.vToolbar, typeof __VLS_components.VToolbar, typeof __VLS_components.vToolbar, ]} */ ;
// @ts-ignore
const __VLS_42 = __VLS_asFunctionalComponent(__VLS_41, new __VLS_41({
    density: "compact",
    ...{ class: "" },
    color: "secondary",
}));
const __VLS_43 = __VLS_42({
    density: "compact",
    ...{ class: "" },
    color: "secondary",
}, ...__VLS_functionalComponentArgsRest(__VLS_42));
__VLS_44.slots.default;
(__VLS_ctx.posMouseX);
(__VLS_ctx.posMouseY);
const __VLS_45 = {}.VSpacer;
/** @type {[typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, typeof __VLS_components.VSpacer, typeof __VLS_components.vSpacer, ]} */ ;
// @ts-ignore
const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({}));
const __VLS_47 = __VLS_46({}, ...__VLS_functionalComponentArgsRest(__VLS_46));
const __VLS_49 = {}.VTextField;
/** @type {[typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, typeof __VLS_components.VTextField, typeof __VLS_components.vTextField, ]} */ ;
// @ts-ignore
const __VLS_50 = __VLS_asFunctionalComponent(__VLS_49, new __VLS_49({
    prependIcon: "mdi-magnify",
    hideDetails: true,
    singleLine: true,
    modelValue: (__VLS_ctx.searchStreet),
    placeholder: "Search street",
}));
const __VLS_51 = __VLS_50({
    prependIcon: "mdi-magnify",
    hideDetails: true,
    singleLine: true,
    modelValue: (__VLS_ctx.searchStreet),
    placeholder: "Search street",
}, ...__VLS_functionalComponentArgsRest(__VLS_50));
const __VLS_53 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
    icon: true,
}));
const __VLS_55 = __VLS_54({
    icon: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_54));
__VLS_56.slots.default;
const __VLS_57 = {}.VIcon;
/** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
// @ts-ignore
const __VLS_58 = __VLS_asFunctionalComponent(__VLS_57, new __VLS_57({}));
const __VLS_59 = __VLS_58({}, ...__VLS_functionalComponentArgsRest(__VLS_58));
__VLS_60.slots.default;
var __VLS_60;
var __VLS_56;
const __VLS_61 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
    icon: true,
}));
const __VLS_63 = __VLS_62({
    icon: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_62));
__VLS_64.slots.default;
const __VLS_65 = {}.VIcon;
/** @type {[typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, typeof __VLS_components.VIcon, typeof __VLS_components.vIcon, ]} */ ;
// @ts-ignore
const __VLS_66 = __VLS_asFunctionalComponent(__VLS_65, new __VLS_65({}));
const __VLS_67 = __VLS_66({}, ...__VLS_functionalComponentArgsRest(__VLS_66));
__VLS_68.slots.default;
var __VLS_68;
var __VLS_64;
if (__VLS_ctx.numRecords > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "right-0" },
    });
    (__VLS_ctx.numRecords);
    (__VLS_ctx.searchParameters);
}
var __VLS_44;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "map" },
    id: "map",
    ref: "myMap",
});
/** @type {typeof __VLS_ctx.myMap} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.noscript, __VLS_intrinsicElements.noscript)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ref: "mapTooltip",
    ...{ class: "tooltip" },
});
/** @type {typeof __VLS_ctx.mapTooltip} */ ;
const __VLS_69 = {}.VBtn;
/** @type {[typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, typeof __VLS_components.VBtn, typeof __VLS_components.vBtn, ]} */ ;
// @ts-ignore
const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
    ...{ 'onClick': {} },
    icon: "mdi-layers-outline",
    'aria-label': "selection couches",
    color: "white",
    ...{ class: "layers_button right-12" },
    height: "45",
    minWidth: "45",
    width: "45",
}));
const __VLS_71 = __VLS_70({
    ...{ 'onClick': {} },
    icon: "mdi-layers-outline",
    'aria-label': "selection couches",
    color: "white",
    ...{ class: "layers_button right-12" },
    height: "45",
    minWidth: "45",
    width: "45",
}, ...__VLS_functionalComponentArgsRest(__VLS_70));
let __VLS_73;
let __VLS_74;
let __VLS_75;
const __VLS_76 = {
    onClick: (__VLS_ctx.toggleLayerSwitcher)
};
var __VLS_72;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['']} */ ;
/** @type {__VLS_StyleScopedClasses['d-flex']} */ ;
/** @type {__VLS_StyleScopedClasses['fill-height']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs-center']} */ ;
/** @type {__VLS_StyleScopedClasses['subtitle-1']} */ ;
/** @type {__VLS_StyleScopedClasses['grey']} */ ;
/** @type {__VLS_StyleScopedClasses['lighten-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pl-6']} */ ;
/** @type {__VLS_StyleScopedClasses['pt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['layer-switcher-dialog']} */ ;
/** @type {__VLS_StyleScopedClasses['pa-1']} */ ;
/** @type {__VLS_StyleScopedClasses['caption']} */ ;
/** @type {__VLS_StyleScopedClasses['white--text']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['map']} */ ;
/** @type {__VLS_StyleScopedClasses['tooltip']} */ ;
/** @type {__VLS_StyleScopedClasses['layers_button']} */ ;
/** @type {__VLS_StyleScopedClasses['right-12']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            numRecords: numRecords,
            searchParameters: searchParameters,
            posMouseX: posMouseX,
            posMouseY: posMouseY,
            searchStreet: searchStreet,
            layerSwitcherVisible: layerSwitcherVisible,
            mapTooltip: mapTooltip,
            toggleLayerSwitcher: toggleLayerSwitcher,
        };
    },
    emits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    emits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */

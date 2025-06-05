/**
 * Map.ts
 * Created by CGil on 2023-10-23.
 * allow to display an OpenLayers Map in Lausanne Switzerland
 * and handle various interactions
 */
import proj4 from "proj4";
import OlMap from "ol/Map";
import OlView from "ol/View";
import OlFeature from "ol/Feature";
import OlPoint from "ol/geom/Point";
import OlProjection from "ol/proj/Projection";
import OlLayer from "ol/layer/Layer";
import OlLayerTile from "ol/layer/Tile";
import OlLayerVector from "ol/layer/Vector";
import OlSourceVector from "ol/source/Vector";
import OlSourceCluster from "ol/source/Cluster";
import OlSourceWMTS, { Options, optionsFromCapabilities } from "ol/source/WMTS";
import OlFormatGeoJSON from "ol/format/GeoJSON";
import OlFormatWMTSCapabilities from "ol/format/WMTSCapabilities";
import { Icon, Style } from "ol/style";
import OlStyle from "ol/style/Style";
import OlStroke from "ol/style/Stroke";
import OlCircle from "ol/style/Circle";
import OlFill from "ol/style/Fill";
import OlText from "ol/style/Text";
import { register } from "ol/proj/proj4";
import { Coordinate } from "ol/coordinate";
import { createEmpty, extend, getHeight, getWidth } from "ol/extent";
//import { Select, defaults as defaultInteractions } from "ol/interaction";
import { getLog } from "@/config";
import { isNullOrUndefined } from "@/tools/utils";

const log = getLog("Map", 2, 2);
const urlLausanneMN95 = "https://tilesmn95.lausanne.ch/tiles/1.0.0/LausanneWMTS.xml";
const urlSwissTopoMN95 = "/WMTSCapabilities_SwissTopo_en_small.xml";
const MaxExtent = [2532500, 1149000, 2545625, 1161000];
const lausanneGare: coordinate2dArray = [2537968.5, 1152088.0];
const defaultBaseLayer = "ch.swisstopo.landeskarte-farbe-10";
const defaultMinClusterRadius = 10;
const defaultClusterDistance = 50;
const defaultClusterMinDistance = 2;
const defaultClusterFontStyle = "15px sans-serif";
let maxFeatureCount = 0;
export type coordinate2dArray = [number, number]

export interface mapFeatureInfo {
  id: string;
  feature: OlFeature;
  layer: string;
  data: object;
}

export interface mapClickInfo {
  x: number;
  y: number;
  features: mapFeatureInfo[];
  msg: string;
}

proj4.defs(
  "EPSG:2056",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs",
);
proj4.defs(
  "EPSG:21781",
  "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs",
);

register(proj4);
const swissProjection = new OlProjection({
  code: "EPSG:2056",
  extent: MaxExtent,
  units: "m",
});
const parser = new OlFormatWMTSCapabilities();

export interface IMarkerFeature {
  position: Coordinate;
  iconPath: string; // "/img/gomarker_star_red.png"
  itemTitle: string;
  itemId: string;
}

const textFill = new OlFill({
  color: "#fff",
});
const textStroke = new OlStroke({
  color: "rgba(0, 0, 0, 0.6)",
  width: 3,
});

async function getWMTSCapabilitiesFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    const message = `###!### ERROR in getWMTSCapabilitiesFromUrl when doing fetch(${url}: http status: ${response.status}`;
    throw new Error(message);
  }
  return await response.text();
}

function getWmtsSource(WMTSCapabilitiesParsed: object, layerName: string) {
  const localDebug = false;
  if (localDebug) log.t(`layerName: ${layerName}`);
  const WMTSOptions = optionsFromCapabilities(WMTSCapabilitiesParsed, {
    layer: layerName,
    matrixSet: "EPSG2056",
    format: "image/png",
    style: "default",
    crossOrigin: "anonymous",
  });
  return new OlSourceWMTS(<Options>WMTSOptions);
}

function createBaseOlLayerTile(parsedWmtsCapabilities: object, title: string, layerName: string, visible = false) {
  const tempTileLayer = new OlLayerTile({
    visible,
    source: getWmtsSource(parsedWmtsCapabilities, layerName),
  });
  tempTileLayer.setProperties({ title: title, type: "base" });
  return tempTileLayer;
}

export async function getWmtsLausanneBaseLayers(url: string = urlLausanneMN95, initialBaseLayer: string = "fonds_geo_osm_bdcad_couleur") {
  const arrWmtsLayers = [];
  try {
    const WMTSCapabilities = await getWMTSCapabilitiesFromUrl(url);

    const WMTSCapabilitiesParsed = parser.read(WMTSCapabilities);
    arrWmtsLayers.push(
      createBaseOlLayerTile(
        WMTSCapabilitiesParsed,
        "Orthophoto 2016 (Lausanne)",
        "orthophotos_ortho_lidar_2016",
        initialBaseLayer === "orthophotos_ortho_lidar_2016",
      ),
    );
    arrWmtsLayers.push(
      createBaseOlLayerTile(
        WMTSCapabilitiesParsed,
        "Fond cadastral (Lausanne)",
        "fonds_geo_osm_bdcad_gris",
        initialBaseLayer === "fonds_geo_osm_bdcad_gris",
      ),
    );
    arrWmtsLayers.push(
      createBaseOlLayerTile(
        WMTSCapabilitiesParsed,
        "Plan ville (Lausanne)",
        "fonds_geo_osm_bdcad_couleur",
        initialBaseLayer === "fonds_geo_osm_bdcad_couleur",
      ),
    );
    return arrWmtsLayers;
  } catch (err) {
    const message = `###!### ERROR in getWmtsLausanneBaseLayers occurred with url:${url}: error is: ${err}`;
    console.warn(message);
    return [];
  }
}

async function getWmtsSwissTopoBaseLayers(url: string, initialBaseLayer: string) {
  const arrWmtsLayers = [];
  try {
    const WMTSCapabilities = await getWMTSCapabilitiesFromUrl(url);

    const WMTSCapabilitiesParsed = parser.read(WMTSCapabilities);
    arrWmtsLayers.push(
      createBaseOlLayerTile(
        WMTSCapabilitiesParsed,
        "Orthophoto SWISSIMAGE",
        "ch.swisstopo.swissimage",
        initialBaseLayer === "ch.swisstopo.swissimage",
      ),
    );
    arrWmtsLayers.push(
      createBaseOlLayerTile(
        WMTSCapabilitiesParsed,
        "National Map 1:10&#39;000 (color)",
        "ch.swisstopo.landeskarte-farbe-10",
        initialBaseLayer === "ch.swisstopo.landeskarte-farbe-10",
      ),
    );
    arrWmtsLayers.push(
      createBaseOlLayerTile(
        WMTSCapabilitiesParsed,
        "National Map 1:10&#39;000 (grey)",
        "ch.swisstopo.landeskarte-grau-10",
        initialBaseLayer === "ch.swisstopo.landeskarte-grau-10",
      ),
    );
    return arrWmtsLayers;
  } catch (err) {
    const message = `###!### ERROR in getWmtsSwissTopoBaseLayers occurred with url:${url}: error is: ${err}`;
    console.warn(message);
    return [];
  }
}

/**
 * getLayerByName retrieves the Ol layer having the given layerName or null if it does not exist
 * @param olMap to search for the layerName
 * @param layerName the name of the OlLayer to find
 */
export const getLayerByName = (olMap: OlMap, layerName: string): null | OlLayer => {
  log.t(`## in getLayerByName layerName: ${layerName} `);
  const localDebug = false;
  if (isNullOrUndefined(olMap)) {
    log.w("NO WAY : olMap is NULL");
    return null;
  }

  const allLayers = olMap.getAllLayers();
  for (const layer of allLayers) {
    if (localDebug) log.l(`## in getLayerByName : layer) : [${typeof layer}] ${layer}`, layer, layer.getProperties());
    if (layer.get("name") !== undefined && layer.get("name") === layerName) {
      return layer; // This now returns from getLayerByName
    }
  }
  log.l(`## in getLayerByName : the layer [${layerName}] was not found returning NULL `);
  return null;
};

export const addMarker2Layer = (olMap: OlMap, layerName: string, clearLayer = false, marker: IMarkerFeature) => {
  log.t("In addNewMarker markerPos:", marker.position);
  const iconFeature = new OlFeature({
    geometry: new OlPoint(marker.position),
    title: marker.itemTitle,
    id: marker.itemId,
  });
  const iconStyle = new Style({
    image: new Icon({
      anchor: [0.5, 46],
      anchorXUnits: "fraction",
      anchorYUnits: "pixels",
      src: marker.iconPath,
    }),
  });
  iconFeature.setStyle(iconStyle);
  const olLayer = getLayerByName(olMap, layerName);
  if (olLayer == null) {
    // layer was not yet created so let's create it with the brand new marker icon feature
    log.t(`In addNewMarker creating ${layerName}`);
    const vectorSource = new OlSourceVector({ features: [iconFeature] });
    const vectorLayer = new OlLayerVector({
      source: vectorSource,
    });
    vectorLayer.setProperties({ title: layerName, name: layerName });
    olMap.addLayer(vectorLayer);
  } else {
    log.t(`In addNewMarker adding feature to existing ${layerName}`);
    const vectorSource = olLayer.getSource() as OlSourceVector;
    if (vectorSource !== null) {
      if (clearLayer) {
        vectorSource.clear();
      }
      vectorSource.addFeature(iconFeature);
    }
  }
  return iconFeature;
};

export const getPointStyle = (feature: OlFeature, resolution: number) => {
  const localDebug = false;
  if (localDebug) log.t(`## Entering getPointStyle resolution : ${resolution}`, feature);
  const defaultIconPath = "/img/gomarker_star_blue.png";
  if (!isNullOrUndefined(feature) && !isNullOrUndefined(feature.getProperties())) {
    const props = feature.getProperties();
    // const geomType = props.geometry.getType()
    // const type_id = isNullOrUndefined(props.type_id) ? 0 : props.type_id
    const iconPath = isNullOrUndefined(props.icon_path) ? defaultIconPath : props.icon_path;
    return new Style({
      image: new Icon({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        src: iconPath,
      }),
    });
  } else {
    return new Style({
      image: new Icon({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        src: defaultIconPath,
      }),
    });
  }
};

export const getPolygonStyle = (feature: OlFeature, resolution: number) => {
  const options = {
    fill_color: "rgba(255, 0, 0, 0.8)",
    stroke_color: "#191aff",
    stroke_width: 5,
  };
  const localDebug = false;
  if (localDebug) log.t("## Entering getPolygonStyle with feature :", feature);
  if (localDebug) log.l(`resolution : ${resolution}`);

  let props = null;
  let theStyle = null;
  if (!isNullOrUndefined(feature) && !isNullOrUndefined(feature.getProperties())) {
    props = feature.getProperties();
    // const geomType = props.geometry.getType()
    const id = isNullOrUndefined(props.id) ? "#INCONNU#" : props.id;
    if (localDebug) log.l(`id : ${id}`);
    theStyle = new OlStyle({
      fill: new OlFill({
        color: isNullOrUndefined(props.fill_color) ? options.fill_color : props.fill_color,
      }),
      stroke: new OlStroke({
        color: isNullOrUndefined(props.stroke_color) ? options.stroke_color : props.stroke_color,
        width: isNullOrUndefined(props.stroke_width) ? options.stroke_width : props.stroke_width,
      }),
      image: new OlCircle({
        radius: isNullOrUndefined(props.stroke_width) ? options.stroke_width : props.stroke_width,
        fill: new OlFill({
          color: isNullOrUndefined(props.fill_color) ? options.fill_color : props.fill_color,
        }),
      }),
    });
  } else {
    theStyle = new OlStyle({
      fill: new OlFill({
        color: options.fill_color, // 'rgba(255, 0, 0, 0.8)',
      }),
      stroke: new OlStroke({
        color: options.stroke_color, // '#191aff',
        width: options.stroke_width,
      }),
      image: new OlCircle({
        radius: 9,
        fill: new OlFill({
          color: "#ffcc33",
        }),
      }),
    });
  }
  return theStyle;
};

const getVectorSourceGeoJson = (geoJsonData: object) => {
  log.t("## in getVectorSourceGeoJson ");
  return new OlSourceVector({
    format: new OlFormatGeoJSON({
      dataProjection: "EPSG:2056",
      featureProjection: "EPSG:2056",
    }),
    features: new OlFormatGeoJSON().readFeatures(geoJsonData),
  });
};
/**
 * addGeoJsonLayer function
 * @param olMap the existing OpenLayers Map object (already created)
 * @param layerName seems obvious no (allows to check if it's already existing
 * @param geoJsonData the data to
 * @param clusterDistance the distance in pixels within which features will be clustered together.
 * @param clusterMinDistance Minimum distance in pixels between clusters. Will be capped at the configured distance. By default no minimum distance is guaranteed. This config can be used to avoid overlapping icons. As a tradoff, the cluster feature's position will no longer be the center of all its features.
 */
export const addGeoJsonLayer = (olMap: OlMap, layerName: string, geoJsonData: object, clusterDistance: number = defaultClusterDistance, clusterMinDistance: number = defaultClusterMinDistance) => {
  log.t(`> will try creating/updating features in layer : ${layerName}...`);
  if (!isNullOrUndefined(olMap)) {
    if (!isNullOrUndefined(geoJsonData)) {
      const olLayer = getLayerByName(olMap, layerName);
      if (olLayer == null) {
        log.l(`In addGeoJsonLayer layer was not yet created so let's create it : ${layerName}`);
        //const vectorSource = getVectorSourceGeoJson(geoJsonData);
        // let's add Cluster
        let vectorLayer: OlLayerVector;
        const calculateClusterInfo = function(resolution:number) {
          maxFeatureCount = 0;
          const features = vectorLayer.getSource()?.getFeatures();
          if (isNullOrUndefined(features)) {
            log.w("calculateClusterInfo will do nothing because features isNullOrUndefined");
            return;
          }
          let feature, radius;
          const featureCount = (features || []).length -1;
          for (let i = featureCount; i >= 0; --i) {
            feature = features?.[i];
            const originalFeatures = feature.get("features");
            const extent = createEmpty();
            let j, jj;
            for (j = 0, jj = originalFeatures.length; j < jj; ++j) {
              extend(extent, originalFeatures[j].getGeometry().getExtent());
            }
            maxFeatureCount = Math.max(maxFeatureCount, jj);
            radius = Math.max(defaultMinClusterRadius, (0.2 * (getWidth(extent) + getHeight(extent))) / resolution);
            feature.set("radius", radius);
            feature.set("is_cluster_used", true);
            //feature.set("cluster_features", originalFeatures);
            feature.set("cluster_getProperties", feature.getProperties());
          }
        };

        let currentResolution:number;

        function styleFunction(feature:OlFeature, resolution:number) {
          log.t(`In styleFunction resolution : ${resolution} feature :`, feature);
          if (resolution != currentResolution) {
            calculateClusterInfo(resolution);
            currentResolution = resolution;
          }
          let style, size;
          if (isNullOrUndefined(feature.get("features"))) {
            size=0;
          } else {
            size = feature.get("features").length;
          }
          if (size > 1) {
            style = new OlStyle({
              image: new OlCircle({
                radius: feature.get("radius"),
                fill: new OlFill({
                  // color: [255, 141, 161, Math.min(0.8, 0.4 + size / maxFeatureCount)], //pink
                  color: [255, 237, 41, Math.min(0.8, 0.4 + size / maxFeatureCount)], //yellow
                }),
              }),
              text: new OlText({
                text: size.toString(),
                font: defaultClusterFontStyle,
                fill: textFill,
                stroke: textStroke,
              }),
            });
          } else {
            if (isNullOrUndefined(feature.get("features"))) {
              style = getPointStyle(feature, resolution);
            } else {
              const originalFeature = feature.get("features")[0];
              style = getPointStyle(originalFeature, resolution);
            }

          }
          return style;
        }


        const vectorSource = new OlSourceCluster({
            distance: clusterDistance, //Distance in pixels within which features will be clustered together.
            minDistance: clusterMinDistance,
            source: getVectorSourceGeoJson(geoJsonData),
          },
        );
        vectorLayer = new OlLayerVector({
          source: vectorSource,
          // @ts-expect-error it's what is in ol doc
          style: styleFunction,
        });
        vectorLayer.setProperties({ title: layerName, name: layerName });
        log.l(`In addGeoJsonLayer adding layer ${layerName} to olMap`, vectorLayer);
        olMap.addLayer(vectorLayer);
      } else {
        log.l(`In addGeoJsonLayer setting geoJson source to existing ${layerName}`);
        const oldVectorSource = olLayer.getSource() as OlSourceVector;
        if (oldVectorSource !== null) {
          oldVectorSource.clear();
        }
        olLayer.setSource(getVectorSourceGeoJson(geoJsonData));
      }
    } else {
      log.w("addGeoJsonLayer will do nothing because geoJsonData isNullOrUndefined");
    }
  } else {
    log.w("addGeoJsonLayer will do nothing because olMap isNullOrUndefined");
  }
};

/**
 * createSwissMap will create a map in the given div
 * @param divOfMap the id of the div you want to draw a map
 * @param centerOfMap the position where you want to center map in MN95 Coordinates [x,y] array
 * @param zoomLevel
 * @param baseLayer one of ch.swisstopo.landeskarte-grau-10 ch.swisstopo.landeskarte-farbe-10 ch.swisstopo.swissimage
 * @returns an instance of an OpenLayer Map
 */
export async function createSwissMap(
  divOfMap: string,
  centerOfMap = lausanneGare,
  zoomLevel = 16,
  baseLayer = defaultBaseLayer,
) {
  log.t(`createLausanneMap(x,y: [${centerOfMap[0]},${centerOfMap[1]}]  zoom:${zoomLevel})`);
  const arrBaseLayers = await getWmtsSwissTopoBaseLayers(urlSwissTopoMN95, baseLayer);
  if (arrBaseLayers === null || arrBaseLayers.length < 1) {
    log.w("arrBaseLayers cannot be null or empty to be able to see a nice map !");
    return null;
  }
  return new OlMap({
    target: divOfMap,
    layers: arrBaseLayers,
    // added for the Cluster of points but be aware that it's blocking tooltip on mouse over icon
    /*
    interactions: defaultInteractions().extend([
      new Select({
        condition: function(evt) {
          return evt.type == "pointermove" || evt.type == "singleclick";
        },
        style: selectStyleFunction,
      }),
    ]),
     */
    view: new OlView({
      projection: swissProjection,
      center: centerOfMap,
      zoom: zoomLevel,
    }),
  });
}

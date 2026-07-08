// geoTree.ts for https://raw.githubusercontent.com/lao-tseu-is-alive/go-geo-tree-table/refs/heads/main/api/geoTree.json

export interface GeoTree {
  id: string;
  goeland_thing_id?: number;
  cada_id: number;
  cada_code: number;
  tree_circumference_cm?: number;
  tree_crown_m?: number;
  cada_tree_type?: string;
  cada_comment: string;
  cada_date: string;
  description?: string;
  created_at?: string;
  created_by: number;
  goeland_thing_saved_at?: string;
  goeland_thing_saved_by?: number;
  deleted?: boolean;
  deleted_at?: string;
  deleted_by?: number;
  pos_east: number;
  pos_north: number;
  pos_altitude?: number;
}

export interface GeoTreeList {
  id: string;
  goeland_thing_id?: number;
  cada_id: number;
  tree_circumference_cm?: number;
  tree_crown_m?: number;
  cada_tree_type?: string;
  cada_comment: string;
  cada_date: string;
  created_by: number;
  pos_east: number;
  pos_north: number;
}

export interface GeoTreeGoelandThingId {
  id: string;
  goeland_thing_id: number;
  goeland_thing_saved_by: number;
}

export interface ErrorResponse {
  code: number;
  message: string;
}

export interface ListGeoTreesParams {
  cada_date?: string;
  created_by?: number;
  limit?: number;
  offset?: number;
}

export const validHeaderRow = [
  "id",
  "code",
  "e",
  "n",
  "z",
  "circ_tronc_[cm]",
  "couronne_[m]",
  "essence ",
  "date",
  "commentaire",
];

// Bornes géographiques et d'altitude acceptées lors de l'import CSV
// (coordonnées MN95 / EPSG:2056). Doivent rester cohérentes avec la
// validation backend (voir pkg/geoTree/validation.go).
// E / N sont obligatoires ; Z (altitude) peut être vide ou 0 (considéré nul).
export const MIN_POS_EAST = 2531000;
export const MAX_POS_EAST = 2547000;
export const MIN_POS_NORTH = 1149000;
export const MAX_POS_NORTH = 1161000;
export const MIN_ALTITUDE = 370;
export const MAX_ALTITUDE = 950;

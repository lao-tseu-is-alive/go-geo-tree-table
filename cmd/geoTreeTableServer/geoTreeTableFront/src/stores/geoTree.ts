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

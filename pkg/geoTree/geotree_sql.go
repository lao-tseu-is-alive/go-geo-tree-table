package geoTree

const (
	countGeoTree  = "SELECT COUNT(*) FROM cada_tree_position WHERE deleted = false AND goeland_thing_id IS NULL"
	createGeoTree = `
insert into cada_tree_position
(id, cada_id, cada_code, pos_east, pos_north, pos_altitude,
 tree_circumference_cm, tree_crown_m, cada_tree_type, cada_date, cada_comment,
 description, created_at, created_by, geom)
values ($1,$2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, CURRENT_TIMESTAMP, $13,
        ST_SetSRID(ST_MakePoint($4,$5), 2056)
       );
`
	existGeoTree = "SELECT COUNT(*) FROM cada_tree_position WHERE id = $1 AND deleted = false "
	getGeoTree   = `
SELECT id,
       goeland_thing_id,
       cada_id,
       cada_code,
       st_x(geom) as pos_east,
       st_y(geom) as pos_north,
       pos_altitude,
       tree_circumference_cm,
       tree_crown_m,
       cada_tree_type,
       cada_date,
       cada_comment,
       description,
       created_at,
       created_by,
       goeland_thing_saved_at,
       goeland_thing_saved_by,
       deleted,
       deleted_at,
       deleted_by
FROM cada_tree_position
WHERE id = $1
  AND deleted = false
`
	baseGeoTreeListQuery = `
SELECT 
       id,goeland_thing_id,cada_id,
       tree_circumference_cm,tree_crown_m,
       cada_tree_type,cada_date,cada_comment,
       created_by as created_by,
       created_at as created_at,
	   st_x(geom) as pos_east,
       st_y(geom) as pos_north
FROM cada_tree_position
WHERE deleted = false AND geom IS NOT NULL AND goeland_thing_id IS NULL 
`
	geoTreeListOrderBy    = " ORDER BY created_at DESC LIMIT $1 OFFSET $2;"
	listGeoTreeConditions = `
 AND cada_date = coalesce($3, cada_date)
 AND created_by = coalesce($4, created_by)
`
	listByPositionGeoTreeConditions = `	AND ST_DWithin(
      geom,
      ST_SetSRID(ST_MakePoint($1, $2), 2056),
      $3
  )
`
	deleteGeoTree = `
UPDATE cada_tree_position 
SET deleted = true, deleted_at = CURRENT_TIMESTAMP, deleted_by = $1 
WHERE id = $2
`
	baseGeoJsonThingSearch = `
SELECT row_to_json(fc)
FROM (SELECT 'FeatureCollection'                         AS type,
             coalesce(array_to_json(array_agg(f)), '[]') AS features
      FROM (SELECT 'Feature'                                                 AS TYPE,
                   ST_AsGeoJSON(t.geom, 6)::JSON                         AS GEOMETRY,
                   row_to_json((SELECT l
                                FROM (SELECT id,
                                             goeland_thing_id,
                                             cada_id,
                                             tree_circumference_cm,
                                             tree_crown_m,
                                             cada_tree_type,
                                             cada_date,
                                             cada_comment,
                                             created_by as created_by,
                                             created_at as created_at,
                                             st_x(geom) as pos_east,
                                             st_y(geom) as pos_north) AS l)) AS properties
            FROM cada_tree_position t
            WHERE deleted = false
              AND geom IS NOT NULL AND goeland_thing_id IS NULL
              AND cada_date = coalesce($1, cada_date)
              AND created_by = coalesce($2, created_by)
            ORDER BY created_at DESC) AS f) AS fc
               
`

	updateGeoTree = `
UPDATE cada_tree_position
SET cada_id               = $2,
    cada_code             = $3,
    pos_east              = $4,
    pos_north             = $5,
    pos_altitude          = $6,
    tree_circumference_cm = $7,
    tree_crown_m          = $8,
    cada_tree_type        = $9,
    cada_date             = $10,
    cada_comment          = $11,
    description           = $12,
    geom                  = ST_SetSRID(ST_MakePoint($4, $5), 2056)
WHERE id = $1;
`

	updateGeoTreeGoelandThingId = `
UPDATE cada_tree_position SET
	goeland_thing_id = $2,
	goeland_thing_saved_by = $3,
	goeland_thing_saved_at = CURRENT_TIMESTAMP
WHERE id = $1`
)

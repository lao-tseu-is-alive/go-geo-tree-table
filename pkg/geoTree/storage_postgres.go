package geoTree

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
)

const emptyGeoJson = `{"type":"FeatureCollection","features":[]}`

type PGX struct {
	Conn *pgxpool.Pool
	dbi  database.DB
	log  *slog.Logger
}

// NewPgxDB will instantiate a new storage of type postgres and ensure schema exist
func NewPgxDB(ctx context.Context, db database.DB, log *slog.Logger) (Storage, error) {
	var psql PGX
	pgConn, err := db.GetPGConn()
	if err != nil {
		return nil, err
	}
	psql.Conn = pgConn
	psql.dbi = db
	psql.log = log
	var numberOfGeoTrees int
	errTypeThingTable := pgConn.QueryRow(ctx, countGeoTree).Scan(&numberOfGeoTrees)
	if errTypeThingTable != nil {
		log.Error("Unable to retrieve the number of geoTrees", "error", errTypeThingTable)
		return nil, errTypeThingTable
	}

	if numberOfGeoTrees > 0 {
		log.Info("database contains records in «public.cada_tree_position»", "count", numberOfGeoTrees)
	} else {
		log.Info("«public.cada_tree_position» is empty for now")
	}

	return &psql, nil
}

func (db *PGX) GeoJson(ctx context.Context, params GeoJsonParams) (string, error) {
	db.log.Debug("trace : entering GeoJson", "params", params)
	var (
		mayBeResultIsNull []*string
		err               error
	)

	err = pgxscan.Select(ctx, db.Conn, &mayBeResultIsNull, baseGeoJsonThingSearch,
		&params.CadaDate, &params.CreatedBy)

	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "method", "GeoJson", "error", err)
		return "nil", err
	}
	if mayBeResultIsNull == nil {
		db.log.Info(FunctionNReturnedNoResults, "method", "GeoJson")
		return emptyGeoJson, pgx.ErrNoRows
	}
	if len(mayBeResultIsNull) > 0 {
		if mayBeResultIsNull[0] == nil {
			// the sql function may return a NULL row when no geoTree matches the filters
			return emptyGeoJson, nil
		}
		return *mayBeResultIsNull[0], nil
	}
	return emptyGeoJson, nil
}

// ListByPosition returns the list of existing geoTrees around given position with a radius search.
func (db *PGX) ListByPosition(ctx context.Context, params ListByPositionParams) ([]*GeoTreeList, error) {
	methodName := "ListByPosition"
	db.log.Debug("trace : entering ListByPosition", "params", params)
	var (
		res []*GeoTreeList
		err error
	)

	listGeoTreesByPosition := baseGeoTreeListQuery + listByPositionGeoTreeConditions + " ORDER BY created_at;"
	db.log.Debug("About to run sql listGeoTreesByPosition query", "sql", listGeoTreesByPosition)
	err = pgxscan.Select(ctx, db.Conn, &res, listGeoTreesByPosition,
		&params.PosEast, &params.PosNorth, &params.Radius)

	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "method", methodName, "error", err)
		return nil, err
	}
	if res == nil {
		db.log.Info(FunctionNReturnedNoResults, "method", methodName)
		return nil, pgx.ErrNoRows
	}
	return res, nil
}

// List returns the list of existing geoTrees with the given offset and limit.
func (db *PGX) List(ctx context.Context, offset, limit int, params ListParams) ([]*GeoTreeList, error) {
	db.log.Debug("trace : entering List", "offset", offset, "limit", limit, "params", params)
	var (
		res []*GeoTreeList
		err error
	)

	listGeoTrees := baseGeoTreeListQuery + listGeoTreeConditions + geoTreeListOrderBy
	err = pgxscan.Select(ctx, db.Conn, &res, listGeoTrees,
		limit, offset, &params.CadaDate, &params.CreatedBy)

	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "method", "List", "error", err)
		return nil, err
	}
	if res == nil {
		db.log.Info(FunctionNReturnedNoResults, "method", "List")
		return nil, pgx.ErrNoRows
	}
	return res, nil
}

// Get will retrieve the geoTree with given id
func (db *PGX) Get(ctx context.Context, id uuid.UUID) (*GeoTree, error) {
	db.log.Debug("trace : entering Get", "id", id)
	res := &GeoTree{}
	err := pgxscan.Get(ctx, db.Conn, res, getGeoTree, id)
	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "method", "Get", "id", id, "error", err)
		return nil, err
	}
	return res, nil
}

// Exist returns true only if a geoTree with the specified id exists in store.
func (db *PGX) Exist(ctx context.Context, id uuid.UUID) bool {
	db.log.Debug("trace : entering Exist", "id", id)
	count, err := db.dbi.GetQueryInt(ctx, existGeoTree, id)
	if err != nil {
		db.log.Error("Exist could not be retrieved from DB, failed db.Query", "id", id, "error", err)
		return false
	}
	if count > 0 {
		db.log.Debug("Exist: id does exist", "id", id, "count", count)
		return true
	}
	db.log.Debug("Exist: id does not exist", "id", id, "count", count)
	return false
}

// Count returns the number of geoTree stored in DB
func (db *PGX) Count(ctx context.Context, params CountParams) (int32, error) {
	db.log.Debug("trace : entering Count", "params", params)
	var (
		count int
		err   error
	)
	queryCount := countGeoTree + " AND cada_date = coalesce($1, cada_date)  AND created_by = coalesce($2, created_by)"

	count, err = db.dbi.GetQueryInt(ctx, queryCount, &params.CadaDate, &params.CreatedBy)

	if err != nil {
		db.log.Error("Count could not be retrieved from DB, failed db.Query", "error", err)
		return 0, err
	}
	return int32(count), nil
}

// Create will store the new GeoTree in the database
func (db *PGX) Create(ctx context.Context, geoTree GeoTree) (*GeoTree, error) {
	db.log.Debug("trace : entering Create", "cadaId", geoTree.CadaId, "id", geoTree.Id)

	rowsAffected, err := db.dbi.ExecActionQuery(ctx, createGeoTree,
		/*	insert into cada_tree_position
			(id, cada_id, cada_code, pos_east, pos_north, pos_altitude,
			 tree_circumference_cm, tree_crown_m, cada_tree_type, cada_date, cada_comment,
			 description, created_at, created_by, geom)
			values ($1,$2, $3, $4, $5, $6,
			        $7, $8, $9, $10, $11,
			        $12, CURRENT_TIMESTAMP, $13,
			        ST_SetSRID(ST_MakePoint($4,$5), 2056)
			       );
		*/
		geoTree.Id, geoTree.CadaId, geoTree.CadaCode, geoTree.PosEast, geoTree.PosNorth, &geoTree.PosAltitude, //$6
		&geoTree.TreeCircumferenceCm, &geoTree.TreeCrownM, &geoTree.CadaTreeType, &geoTree.CadaDate, geoTree.CadaComment, //$11
		&geoTree.Description, geoTree.CreatedBy)
	if err != nil {
		db.log.Error("Create unexpectedly failed", "cadaId", geoTree.CadaId, "error", err)
		return nil, err
	}
	if rowsAffected < 1 {
		db.log.Error("Create no row was created so create has failed", "cadaId", geoTree.CadaId)
		return nil, errors.New(ErrNoRowsAffectedByQuery)
	}
	db.log.Info("Create success", "cadaId", geoTree.CadaId, "id", geoTree.Id)

	// if we get to here all is good, so let's retrieve a fresh copy to send it back
	createdGeoTree, err := db.Get(ctx, geoTree.Id)
	if err != nil {
		return nil, fmt.Errorf("error %w: thing was created, but can not be retrieved", err)
	}
	return createdGeoTree, nil
}

// Update the thing stored in DB with given id and other information in struct
func (db *PGX) Update(ctx context.Context, id uuid.UUID, geoTree GeoTree) (*GeoTree, error) {
	db.log.Debug("trace : entering Update", "id", id, "data", geoTree)
	if id == uuid.Nil {
		return nil, errors.New(ErrInvalidUUID)
	}
	if geoTree.Id != id {
		db.log.Warn("Update called with mismatching ids", "id", id, "geoTree.Id", geoTree.Id)
		// Decide if this is an error or if geoTree.Id should be ignored/overwritten.
		// For now, assume 'id' parameter is authoritative. geoTree.Id will be ignored by the query.
	}

	// Arguments for updateGeoTree:
	// $1: id (for WHERE)
	// UPDATE cada_tree_position
	//SET cada_id               = $2,
	//    cada_code             = $3,
	//    pos_east              = $4,
	//    pos_north             = $5,
	//    pos_altitude          = $6,
	//    tree_circumference_cm = $7,
	//    tree_crown_m          = $8,
	//    cada_tree_type        = $9,
	//    cada_date             = $10,
	//    cada_comment          = $11,
	//    description           = $12,
	//    geom                  = ST_SetSRID(ST_MakePoint($4, $5), 2056)
	//WHERE id = $1;
	rowsAffected, err := db.dbi.ExecActionQuery(ctx, updateGeoTree,
		id,                          // $1
		geoTree.CadaId,              // $2
		geoTree.CadaCode,            // $3
		geoTree.PosEast,             // $4
		geoTree.PosNorth,            // $5
		geoTree.PosAltitude,         // $6
		geoTree.TreeCircumferenceCm, // $7
		geoTree.TreeCrownM,          // $8
		geoTree.CadaTreeType,        // $9
		geoTree.CadaDate,            // $10
		geoTree.CadaComment,         // $11
		geoTree.Description,         // $12
	)

	if err != nil {
		db.log.Error("Update unexpectedly failed", "id", id, "error", err)
		// Consider checking for specific pgx errors, like constraint violations or data type issues.
		return nil, err
	}

	if rowsAffected < 1 {
		db.log.Warn("Update no row was updated. This might be due to incorrect id", "id", id)
		return nil, errors.New(ErrNoRowsAffectedByQuery)
	}

	db.log.Info("Update successfully updated row(s)", "id", id, "rowsAffected", rowsAffected)

	// Retrieve and return the updated geoTree object
	updatedGeoTree, getErr := db.Get(ctx, id)
	if getErr != nil {
		db.log.Error("Update was successful, but failed to retrieve the updated record", "id", id, "error", getErr)
		return nil, fmt.Errorf("error %w: thing was updated, but can not be retrieved", getErr)
	}
	return updatedGeoTree, nil
}

// UpdateGoelandThingId updates the goeland_thing_id value for the geoTree with given ID in the storage.
func (db *PGX) UpdateGoelandThingId(ctx context.Context, id uuid.UUID, geoTreeGoelandThingId GeoTreeGoelandThingId) (*GeoTreeGoelandThingId, error) {
	db.log.Debug("trace : entering UpdateGoelandThingId", "id", id,
		"goelandId", geoTreeGoelandThingId.GoelandThingId, "savedBy", geoTreeGoelandThingId.GoelandThingSavedBy)
	if id == uuid.Nil {
		return nil, errors.New(ErrInvalidUUID)
	}
	if geoTreeGoelandThingId.GoelandThingSavedBy < 1 {
		db.log.Warn("UpdateGoelandThingId invalid GoelandThingSavedBy", "id", id)
		return nil, fmt.Errorf(ErrInvalidSavedBy, id)
	}

	// Arguments for updateGeoTreeGoelandThingId:
	// $1: id (for WHERE)
	// UPDATE cada_tree_position SET
	//	goeland_thing_id = $2,
	//	goeland_thing_saved_by = $3,
	//	goeland_thing_saved_at = CURRENT_TIMESTAMP
	//WHERE id = $1
	rowsAffected, err := db.dbi.ExecActionQuery(ctx, updateGeoTreeGoelandThingId,
		id,
		geoTreeGoelandThingId.GoelandThingId,
		geoTreeGoelandThingId.GoelandThingSavedBy,
	)

	if err != nil {
		db.log.Error("UpdateGoelandThingId unexpectedly failed", "id", id, "error", err)
		return nil, err
	}

	if rowsAffected < 1 {
		db.log.Warn("UpdateGoelandThingId no row was updated. This might be due to incorrect id", "id", id)
		return nil, errors.New(ErrNoRowsAffectedByQuery)
	}

	db.log.Info("UpdateGoelandThingId successfully updated goeland_thing_id", "id", id, "rowsAffected", rowsAffected)

	return &GeoTreeGoelandThingId{
		Id:                  id,
		GoelandThingId:      geoTreeGoelandThingId.GoelandThingId,
		GoelandThingSavedBy: geoTreeGoelandThingId.GoelandThingSavedBy,
	}, nil
}

// Delete the thing stored in DB with given id
func (db *PGX) Delete(ctx context.Context, id uuid.UUID, userId int32) error {
	db.log.Debug("trace : entering Delete", "id", id, "userId", userId)
	rowsAffected, err := db.dbi.ExecActionQuery(ctx, deleteGeoTree, userId, id)
	if err != nil {
		msg := fmt.Sprintf("geoTree could not be deleted, err: %v", err)
		db.log.Error(msg, "id", id)
		return errors.New(msg)
	}
	if rowsAffected < 1 {
		msg := fmt.Sprintf("geoTree was not deleted, id: %v", id)
		db.log.Error(msg, "id", id)
		return errors.New(msg)
	}
	// if we get to here all is good
	return nil
}

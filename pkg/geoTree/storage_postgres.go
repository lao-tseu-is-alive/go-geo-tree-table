package geoTree

import (
	"context"
	"errors"
	"fmt"
	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/golog"
)

type PGX struct {
	Conn *pgxpool.Pool
	dbi  database.DB
	log  golog.MyLogger
}

// NewPgxDB will instantiate a new storage of type postgres and ensure schema exist
func NewPgxDB(db database.DB, log golog.MyLogger) (Storage, error) {
	var psql PGX
	pgConn, err := db.GetPGConn()
	if err != nil {
		return nil, err
	}
	psql.Conn = pgConn
	psql.dbi = db
	psql.log = log
	var numberOfGeoTrees int
	errTypeThingTable := pgConn.QueryRow(context.Background(), countGeoTree).Scan(&numberOfGeoTrees)
	if errTypeThingTable != nil {
		log.Error("Unable to retrieve the number of users error: %v", err)
		return nil, err
	}

	if numberOfGeoTrees > 0 {
		log.Info("'database contains %d records in «public.cada_tree_position»'", numberOfGeoTrees)
	} else {
		log.Info("«public.cada_tree_position» is empty for now")
	}

	return &psql, err
}

func (db *PGX) GeoJson(params GeoJsonParams) (string, error) {
	db.log.Debug("trace : entering GeoJson(params : %+v)", params)
	if params.CadaDate != nil {
		db.log.Info("param CadaDate : %v", *params.CadaDate)
	}
	if params.CreatedBy != nil {
		db.log.Info("params.CreatedBy : %v", *params.CreatedBy)
	}
	var (
		mayBeResultIsNull *string
		err               error
	)

	listThings := baseGeoJsonThingSearch
	err = pgxscan.Select(context.Background(), db.Conn, &mayBeResultIsNull, listThings,
		&params.CadaDate, &params.CreatedBy)

	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "List", err)
		return "nil", err
	}
	if mayBeResultIsNull == nil {
		db.log.Info(FunctionNReturnedNoResults, "List")
		return "nil", pgx.ErrNoRows
	}
	return *mayBeResultIsNull, nil
}

// List returns the list of existing geoTrees with the given offset and limit.
func (db *PGX) List(offset, limit int, params ListParams) ([]*GeoTreeList, error) {
	db.log.Debug("trace : entering List(params : %+v)", params)
	if params.CadaDate != nil {
		db.log.Info("param CadaDate : %v", *params.CadaDate)
	}
	if params.CreatedBy != nil {
		db.log.Info("params.CreatedBy : %v", *params.CreatedBy)
	}
	var (
		res []*GeoTreeList
		err error
	)

	listGeoTrees := baseGeoTreeListQuery + listGeoTreeConditions
	listGeoTrees += geoTreeListOrderBy
	err = pgxscan.Select(context.Background(), db.Conn, &res, listGeoTrees,
		limit, offset, &params.CadaDate, &params.CreatedBy)

	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "List", err)
		return nil, err
	}
	if res == nil {
		db.log.Info(FunctionNReturnedNoResults, "List")
		return nil, pgx.ErrNoRows
	}
	return res, nil
}

// Get will retrieve the geoTree with given id
func (db *PGX) Get(id uuid.UUID) (*GeoTree, error) {
	db.log.Debug("trace : entering Get(%v)", id)
	res := &GeoTree{}
	err := pgxscan.Get(context.Background(), db.Conn, res, getGeoTree, id)
	if err != nil {
		db.log.Error(SelectFailedInNWithErrorE, "Get", err)
		return nil, err
	}
	if res == nil {
		db.log.Info(FunctionNReturnedNoResults, "Get")
		return nil, pgx.ErrNoRows
	}
	return res, nil
}

// Exist returns true only if a geoTree with the specified id exists in store.
func (db *PGX) Exist(id uuid.UUID) bool {
	db.log.Debug("trace : entering Exist(%v)", id)
	count, err := db.dbi.GetQueryInt(existGeoTree, id)
	if err != nil {
		db.log.Error("Exist(%v) could not be retrieved from DB. failed db.Query err: %v", id, err)
		return false
	}
	if count > 0 {
		db.log.Info(" Exist(%v) id does exist  count:%v", id, count)
		return true
	} else {
		db.log.Info(" Exist(%v) id does not exist count:%v", id, count)
		return false
	}
}

// Count returns the number of geoTree stored in DB
func (db *PGX) Count(params CountParams) (int32, error) {
	db.log.Debug("trace : entering Count()")
	var (
		count int
		err   error
	)
	queryCount := countGeoTree + listGeoTreeConditions

	count, err = db.dbi.GetQueryInt(queryCount, &params.CadaDate, &params.CreatedBy)

	if err != nil {
		db.log.Error("Count() could not be retrieved from DB. failed db.Query err: %v", err)
		return 0, err
	}
	return int32(count), nil
}

// Create will store the new GeoTree in the database
func (db *PGX) Create(geoTree GeoTree) (*GeoTree, error) {
	db.log.Debug("trace : entering Create(%q,%q)", geoTree.CadaId, geoTree.Id)

	rowsAffected, err := db.dbi.ExecActionQuery(createGeoTree,
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
		&geoTree.Description, geoTree.CreatedBy, geoTree.PosEast, geoTree.PosNorth)
	if err != nil {
		db.log.Error("Create(%q) unexpectedly failed. error : %v", geoTree.CadaId, err)
		return nil, err
	}
	if rowsAffected < 1 {
		db.log.Error("Create(%q) no row was created so create as failed. error : %v", geoTree.CadaId, err)
		return nil, err
	}
	db.log.Info(" Create(%q) created with id : %v", geoTree.CadaId, geoTree.Id)

	// if we get to here all is good, so let's retrieve a fresh copy to send it back
	createdGeoTree, err := db.Get(geoTree.Id)
	if err != nil {
		return nil, errors.New(fmt.Sprintf("error %v: thing was created, but can not be retrieved", err))
	}
	return createdGeoTree, nil
}

// Update the thing stored in DB with given id and other information in struct
func (db *PGX) Update(id uuid.UUID, t GeoTree) (*GeoTree, error) {
	db.log.Debug("trace : entering Update(id:%q, %q)", id, t.Id)
	panic("implement me")
	/*
		rowsAffected, err := db.dbi.ExecActionQuery(updateGeoTree,
			t.Id, t.TypeId, t.Name, &t.Description, &t.Comment, &t.ExternalId, &t.ExternalRef, //$7
			&t.BuildAt, &t.Status, &t.ContainedBy, &t.ContainedByOld, t.Inactivated, &t.InactivatedTime, &t.InactivatedBy, &t.InactivatedReason, //$15
			t.Validated, &t.ValidatedTime, &t.ValidatedBy, //$18
			&t.ManagedBy, &t.LastModifiedBy, &t.MoreData, t.PosX, t.PosY) //$23
		if err != nil {

			db.log.Error("Update(%q) unexpectedly failed. error : %v", t.Id, err)
			return nil, err
		}
		if rowsAffected < 1 {
			db.log.Error("Update(%q) no row was created so create as failed. error : %v", t.Id, err)
			return nil, err
		}

		// if we get to here all is good, so let's retrieve a fresh copy to send it back
		updatedGeoTree, err := db.Get(t.Id)
		if err != nil {
			return nil, errors.New(fmt.Sprintf("error %v: thing was updated, but can not be retrieved.", err))
		}
		return updatedGeoTree, nil

	*/
}

// UpdateGoelandThingId updates the goeland_thing_id value for the geoTree with given ID in the storage.
func (db *PGX) UpdateGoelandThingId(id uuid.UUID, geoTreeGoelandThingId GeoTreeGoelandThingId) (*GeoTreeGoelandThingId, error) {
	db.log.Debug("trace : entering UpdateGoelandThingId(id:%q, %q)", id, geoTreeGoelandThingId.GoelandThingId)
	panic("implement me")
}

// Delete the thing stored in DB with given id
func (db *PGX) Delete(id uuid.UUID, userId int32) error {
	db.log.Debug("trace : entering Delete(%d)", id)
	rowsAffected, err := db.dbi.ExecActionQuery(deleteGeoTree, userId, id)
	if err != nil {
		msg := fmt.Sprintf("geoTree could not be deleted, err: %v", err)
		db.log.Error(msg)
		return errors.New(msg)
	}
	if rowsAffected < 1 {
		msg := fmt.Sprintf("geoTree was not deleted, err: %v", err)
		db.log.Error(msg)
		return errors.New(msg)
	}
	// if we get to here all is good
	return nil
}

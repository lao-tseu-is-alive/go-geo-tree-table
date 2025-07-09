package geoTree

import (
	"github.com/google/uuid"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/golog"
)

// Storage is an interface to different implementation of persistence for GeoTrees
type Storage interface {
	// GeoJson returns a geoJson of existing geoTrees with the given offset and limit.
	GeoJson(params GeoJsonParams) (string, error)
	// ListByPosition returns the list of existing geoTrees at given position around radius
	ListByPosition(params ListByPositionParams) ([]*GeoTreeList, error)
	// List returns the list of existing geoTrees with the given offset and limit.
	List(offset, limit int, params ListParams) ([]*GeoTreeList, error)
	// Get returns the geoTree with the specified geoTrees ID.
	Get(id uuid.UUID) (*GeoTree, error)
	// Exist returns true only if a geoTrees with the specified id exists in store.
	Exist(id uuid.UUID) bool
	// Count returns the total number of geoTrees.
	Count(params CountParams) (int32, error)
	// Create saves a new geoTree in the storage.
	Create(geoTree GeoTree) (*GeoTree, error)
	// Update updates the geoTree with given ID in the storage.
	Update(id uuid.UUID, geoTree GeoTree) (*GeoTree, error)
	// UpdateGoelandThingId updates the goeland_thing_id value for the geoTree with given ID in the storage.
	UpdateGoelandThingId(id uuid.UUID, geoTreeGoelandThingId GeoTreeGoelandThingId) (*GeoTreeGoelandThingId, error)
	// Delete removes the geoTrees with given ID from the storage.
	Delete(id uuid.UUID, userId int32) error
}

func GetStorageInstanceOrPanic(dbDriver string, db database.DB, l golog.MyLogger) Storage {
	var store Storage
	var err error
	switch dbDriver {
	case "pgx":
		store, err = NewPgxDB(db, l)
		if err != nil {
			l.Fatal("error doing NewPgxDB(pgConn : %w", err)
		}

	default:
		panic("unsupported DB driver type")
	}
	return store
}

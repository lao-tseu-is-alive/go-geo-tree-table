package geoTree

import (
	"context"
	"log/slog"

	"github.com/google/uuid"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
)

// Storage is an interface to different implementation of persistence for GeoTrees
// Every method takes a context.Context as first argument so the caller can
// propagate the http request lifecycle (cancellation, deadline) down to the DB.
type Storage interface {
	// GeoJson returns a geoJson of existing geoTrees with the given offset and limit.
	GeoJson(ctx context.Context, params GeoJsonParams) (string, error)
	// ListByPosition returns the list of existing geoTrees at given position around radius
	ListByPosition(ctx context.Context, params ListByPositionParams) ([]*GeoTreeList, error)
	// List returns the list of existing geoTrees with the given offset and limit.
	List(ctx context.Context, offset, limit int, params ListParams) ([]*GeoTreeList, error)
	// Get returns the geoTree with the specified geoTrees ID.
	Get(ctx context.Context, id uuid.UUID) (*GeoTree, error)
	// Exist returns true only if a geoTrees with the specified id exists in store.
	Exist(ctx context.Context, id uuid.UUID) bool
	// Count returns the total number of geoTrees.
	Count(ctx context.Context, params CountParams) (int32, error)
	// Create saves a new geoTree in the storage.
	Create(ctx context.Context, geoTree GeoTree) (*GeoTree, error)
	// Update updates the geoTree with given ID in the storage.
	Update(ctx context.Context, id uuid.UUID, geoTree GeoTree) (*GeoTree, error)
	// UpdateGoelandThingId updates the goeland_thing_id value for the geoTree with given ID in the storage.
	UpdateGoelandThingId(ctx context.Context, id uuid.UUID, geoTreeGoelandThingId GeoTreeGoelandThingId) (*GeoTreeGoelandThingId, error)
	// Delete removes the geoTrees with given ID from the storage.
	Delete(ctx context.Context, id uuid.UUID, userId int32) error
}

// GetStorageInstanceOrPanic returns a Storage implementation for the given driver,
// and panics if the storage cannot be initialized.
func GetStorageInstanceOrPanic(ctx context.Context, dbDriver string, db database.DB, l *slog.Logger) Storage {
	var store Storage
	var err error
	switch dbDriver {
	case "pgx":
		store, err = NewPgxDB(ctx, db, l)
		if err != nil {
			l.Error("error doing NewPgxDB(db,l)", "error", err)
			panic("error doing NewPgxDB(db,l)")
		}

	default:
		panic("unsupported DB driver type")
	}
	return store
}

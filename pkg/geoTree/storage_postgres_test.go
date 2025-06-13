package geoTree

import (
	"context"
	"errors"
	"strings"
	"testing"
	"regexp" // Added for MockPgxPool.QueryRow, though it's not perfectly used yet

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/georgysavva/scany/pgxscan"
	"github.com/gofrs/uuid"
	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/sylr/go-lib/database"
	"github.com/sylr/go-lib/golog"
)

// MockDB is a mock implementation of database.DB
type MockDB struct {
	mock.Mock
	Pool *pgxpool.Pool
}

func (m *MockDB) GetPGConn() *pgxpool.Pool {
	args := m.Called()
	if args.Get(0) == nil {
		return nil
	}
	return args.Get(0).(*pgxpool.Pool)
}

func (m *MockDB) GetQueryInt(ctx context.Context, query string, params ...interface{}) (int64, error) {
	args := m.Called(ctx, query, params)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockDB) ExecActionQuery(ctx context.Context, query string, params ...interface{}) (int64, error) {
	args := m.Called(ctx, query, params)
	return args.Get(0).(int64), args.Error(1)
}

// MockPgxPool is a mock for pgxpool.Pool
type MockPgxPool struct {
	mock.Mock
}

func (m *MockPgxPool) Exec(ctx context.Context, sql string, arguments ...interface{}) (pgconn.CommandTag, error) {
	args := m.Called(ctx, sql, arguments)
	// Return a valid pgconn.CommandTag; an empty one is often fine for mocks.
	if args.Get(0) == nil && args.Error(1) == nil { // if nothing set, return empty tag
		return pgconn.CommandTag{}, nil
	}
	if args.Get(0) == nil { // if error is set, but not tag
		return pgconn.CommandTag{}, args.Error(1)
	}
	return args.Get(0).(pgconn.CommandTag), args.Error(1)
}

func (m *MockPgxPool) Query(ctx context.Context, sql string, options ...interface{}) (pgx.Rows, error) {
	args := m.Called(ctx, sql, options)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(pgx.Rows), args.Error(1)
}

// mockRow is a helper struct that implements pgx.Row
type mockRow struct {
	value interface{} // For single value simple scans (int64, string, etc.)
	err   error
	// For struct scans (like in Get where pgxscan.Get calls row.Scan(structPtr)):
	// We expect `value` to be the struct itself or a pointer to it.
	// The Scan method will then try to assign this to the destination.
}

// Implement the Scan method for mockRow to satisfy the pgx.Row interface.
func (mr *mockRow) Scan(dest ...interface{}) error {
	if mr.err != nil {
		return mr.err
	}
	if len(dest) == 1 {
		switch d := dest[0].(type) {
		case *int:
			if val, ok := mr.value.(int); ok { *d = val; return nil }
			if val, ok := mr.value.(int64); ok { *d = int(val); return nil } // Allow int64 for int scan
			return errors.New("mockRow Scan: value type mismatch for *int")
		case *int64:
			if val, ok := mr.value.(int64); ok { *d = val; return nil }
			if val, ok := mr.value.(int); ok { *d = int64(val); return nil} // Allow int for int64 scan
			return errors.New("mockRow Scan: value type mismatch for *int64")
		case *string:
			if val, ok := mr.value.(string); ok { *d = val; return nil }
			return errors.New("mockRow Scan: value type mismatch for *string")
		case *[]byte: // For GeoJson
			if val, ok := mr.value.([]byte); ok { *d = val; return nil}
			return errors.New("mockRow Scan: value type mismatch for *[]byte")
		case **GeoTree: // For pgxscan.Get into a *GeoTree
			if treePtr, ok := mr.value.(**GeoTree); ok { *d = *treePtr; return nil}
			if tree, ok := mr.value.(*GeoTree); ok { *d = tree; return nil }
			if treeVal, ok := mr.value.(GeoTree); ok {*d = &treeVal; return nil}
			return errors.New("mockRow Scan: value is not *GeoTree or GeoTree for **GeoTree dest")
		default:
			return errors.New("mockRow Scan: unsupported destination type for single argument scan")
		}
	}
	// This part is simplified and won't handle multi-arg scans like pgxscan.Select does internally.
	// For pgxscan.Select, the pgx.Rows mock (like sqlmock.Rows) is more appropriate.
	return errors.New("mockRow Scan: multi-argument scan not supported by this simple mock")
}


func (m *MockPgxPool) QueryRow(ctx context.Context, sql string, argsSlice ...interface{}) pgx.Row {
	args := m.Called(ctx, sql, argsSlice) // Use argsSlice as variadic
	scanVal := args.Get(0) // This is the value our mockRow.Scan will use or the struct for Get.
	scanErr := args.Error(1) // This is the error our mockRow.Scan will return.

	// For QueryRow, we expect 'options' (argsSlice here) to be the actual query parameters.
	// The 'sql' string is the query itself.
	// The returned pgx.Row (our mockRow) will then have its Scan method called.
	return &mockRow{value: scanVal, err: scanErr}
}


func (m *MockPgxPool) Close() {
	m.Called()
}

func newTestPgxDB(t *testing.T, db *MockDB, pool *MockPgxPool, initialCount int64, initialCountErr error) (*PGX, error) {
	logger := golog.NewLogger("test", golog.LOG_LEVEL_DEBUG, false, false, false, false, "")
	db.On("GetPGConn").Return(pool).Maybe()
	pool.On("QueryRow", mock.Anything, countGeoTree, mock.AnythingOfType("[]interface {}")).Return(initialCount, initialCountErr).Once()
	return NewPgxDB(context.Background(), db, logger)
}

func TestNewPgxDB(t *testing.T) {
	t.Run("successful initialization", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		mockDb.On("GetPGConn").Return(mockPool).Once()
		mockPool.On("QueryRow", mock.Anything, countGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(10), nil).Once()
		logger := golog.NewLogger("test", golog.LOG_LEVEL_DEBUG, false, false, false, false, "")
		pgx, err := NewPgxDB(context.Background(), mockDb, logger)
		assert.NoError(t, err)
		assert.NotNil(t, pgx)
		assert.Equal(t, int64(10), pgx.count)
		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t)
	})

	t.Run("initialization failure if GetPGConn returns nil", func(t *testing.T) {
		mockDb := new(MockDB)
		mockDb.On("GetPGConn").Return(nil).Once()
		logger := golog.NewLogger("test", golog.LOG_LEVEL_DEBUG, false, false, false, false, "")
		pgx, err := NewPgxDB(context.Background(), mockDb, logger)
		assert.Error(t, err)
		assert.Nil(t, pgx)
		assert.Contains(t, err.Error(), "database connection not initialized")
		mockDb.AssertExpectations(t)
	})

	t.Run("initialization failure if initial count query fails", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		expectedErr := errors.New("db error on count")
		mockDb.On("GetPGConn").Return(mockPool).Once()
		mockPool.On("QueryRow", mock.Anything, countGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(0), expectedErr).Once()
		logger := golog.NewLogger("test", golog.LOG_LEVEL_DEBUG, false, false, false, false, "")
		pgx, err := NewPgxDB(context.Background(), mockDb, logger)
		assert.Error(t, err)
		assert.Nil(t, pgx)
		assert.True(t, errors.Is(err, expectedErr))
		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t)
	})
}

func TestPgx_GeoJson(t *testing.T) {
	ctx := context.Background()
	t.Run("successful retrieval", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedJSON := []byte(`{"type": "FeatureCollection", "features": []}`)
		filter := Filter{}
		mockPool.On("QueryRow", ctx, baseGeoJsonThingSearch, []interface{}{filter.getCreatedBy(), filter.getCadaDate(), filter.getStatus(), filter.getGoelandId(), filter.getGoelandThingId()}).Return(expectedJSON, nil).Once()
		result, err := pgxDB.GeoJson(ctx, filter)
		assert.NoError(t, err)
		assert.Equal(t, expectedJSON, result)
		mockPool.AssertExpectations(t)
	})

	t.Run("handles pgx.ErrNoRows", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		filter := Filter{}
		mockPool.On("QueryRow", ctx, baseGeoJsonThingSearch, []interface{}{filter.getCreatedBy(), filter.getCadaDate(), filter.getStatus(), filter.getGoelandId(), filter.getGoelandThingId()}).Return(nil, pgx.ErrNoRows).Once()
		result, err := pgxDB.GeoJson(ctx, filter)
		assert.ErrorIs(t, err, pgx.ErrNoRows)
		assert.Nil(t, result)
		mockPool.AssertExpectations(t)
	})

	t.Run("handles other database errors", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedErr := errors.New("some other db error")
		filter := Filter{}
		mockPool.On("QueryRow", ctx, baseGeoJsonThingSearch, []interface{}{filter.getCreatedBy(), filter.getCadaDate(), filter.getStatus(), filter.getGoelandId(), filter.getGoelandThingId()}).Return(nil, expectedErr).Once()
		result, err := pgxDB.GeoJson(ctx, filter)
		assert.ErrorIs(t, err, expectedErr)
		assert.Nil(t, result)
		mockPool.AssertExpectations(t)
	})
}

func TestPgx_List(t *testing.T) {
	ctx := context.Background()
	t.Run("successful retrieval - no filters", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedTrees := []GeoTree{{ID: "1", Name: "Tree1"}, {ID: "2", Name: "Tree2"}}
		filter := Filter{Limit: 10, Offset: 0}
		mockRows := sqlmock.NewRows([]string{"id", "name", "description", "status", "cada_date", "cada_comment", "created_at", "updated_at", "created_by", "updated_by", "goeland_id", "goeland_thing_id", "version", "lock_version", "geom"})
		for _, tree := range expectedTrees {
			mockRows.AddRow(tree.ID, tree.Name, tree.Description, tree.Status, tree.CadaDate, tree.CadaComment, tree.CreatedAt, tree.UpdatedAt, tree.CreatedBy, tree.UpdatedBy, tree.GoelandId, tree.GoelandThingId, tree.Version, tree.LockVersion, tree.Geom)
		}
		mockPool.On("Query", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, baseGeoTreeListQuery) && strings.Contains(sql, geoTreeListOrderBy) && !strings.Contains(sql, "WHERE")
		}), []interface{}{int64(filter.Limit), int64(filter.Offset)}).Return(mockRows, nil).Once()
		result, err := pgxDB.List(ctx, filter)
		assert.NoError(t, err)
		assert.Len(t, result, len(expectedTrees))
		for i := range expectedTrees {
			assert.Equal(t, expectedTrees[i].ID, result[i].ID)
			assert.Equal(t, expectedTrees[i].Name, result[i].Name)
		}
		mockPool.AssertExpectations(t)
	})

	t.Run("successful retrieval - with filters", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedTrees := []GeoTree{{ID: "3", Name: "FilteredTree", CreatedBy: "user1", CadaDate: "2023-10-26"}}
		filter := Filter{Limit: 5, Offset: 0, CreatedBy: "user1", CadaDate: "2023-10-26"}
		mockRows := sqlmock.NewRows([]string{"id", "name", "created_by", "cada_date"})
		mockRows.AddRow(expectedTrees[0].ID, expectedTrees[0].Name, expectedTrees[0].CreatedBy, expectedTrees[0].CadaDate)
		mockPool.On("Query", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, baseGeoTreeListQuery) &&
				strings.Contains(sql, "created_by = $") &&
				strings.Contains(sql, "cada_date = $") &&
				strings.Contains(sql, geoTreeListOrderBy)
		}), []interface{}{filter.CreatedBy, filter.CadaDate, int64(filter.Limit), int64(filter.Offset)}).Return(mockRows, nil).Once()
		result, err := pgxDB.List(ctx, filter)
		assert.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, expectedTrees[0].ID, result[0].ID)
		mockPool.AssertExpectations(t)
	})

	t.Run("handles pgx.ErrNoRows (empty result set)", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		filter := Filter{Limit: 10, Offset: 0}
		emptyRows := sqlmock.NewRows([]string{"id", "name"})
		mockPool.On("Query", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, baseGeoTreeListQuery)
		}), []interface{}{int64(filter.Limit), int64(filter.Offset)}).Return(emptyRows, nil).Once()
		result, err := pgxDB.List(ctx, filter)
		assert.NoError(t, err)
		assert.Empty(t, result)
		mockPool.AssertExpectations(t)
	})

	t.Run("handles other database errors from Query", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedErr := errors.New("some other db error")
		filter := Filter{Limit: 10, Offset: 0}
		mockPool.On("Query", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, baseGeoTreeListQuery)
		}), []interface{}{int64(filter.Limit), int64(filter.Offset)}).Return(nil, expectedErr).Once()
		result, err := pgxDB.List(ctx, filter)
		assert.ErrorIs(t, err, expectedErr)
		assert.Nil(t, result)
		mockPool.AssertExpectations(t)
	})
}

func TestPgx_Get(t *testing.T) {
	ctx := context.Background()
	testID := "test-id-123"
	t.Run("successful retrieval", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedTree := GeoTree{ID: testID, Name: "Found Tree"}
		// For Get, QueryRow is called, and its Scan method will be invoked with a pointer to GeoTree.
		// So, mockRow.value should be the actual GeoTree struct or a pointer to it.
		mockPool.On("QueryRow", ctx, getGeoTree, []interface{}{testID}).Return(&expectedTree, nil).Once()
		result, err := pgxDB.Get(ctx, testID)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, expectedTree.ID, result.ID)
		assert.Equal(t, expectedTree.Name, result.Name)
		mockPool.AssertExpectations(t)
	})

	t.Run("handles pgx.ErrNoRows", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		mockPool.On("QueryRow", ctx, getGeoTree, []interface{}{testID}).Return(nil, pgx.ErrNoRows).Once()
		result, err := pgxDB.Get(ctx, testID)
		assert.ErrorIs(t, err, pgx.ErrNoRows)
		assert.Nil(t, result)
		mockPool.AssertExpectations(t)
	})

	t.Run("handles other database errors", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedErr := errors.New("some other db error")
		mockPool.On("QueryRow", ctx, getGeoTree, []interface{}{testID}).Return(nil, expectedErr).Once()
		result, err := pgxDB.Get(ctx, testID)
		assert.ErrorIs(t, err, expectedErr)
		assert.Nil(t, result)
		mockPool.AssertExpectations(t)
	})
}

func TestPgx_Exist(t *testing.T) {
	ctx := context.Background()
	testID := "test-id-exist"
	t.Run("exists when count > 0", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedQuery := `SELECT count(id) FROM public.geo_tree WHERE id = $1`
		mockDb.On("GetQueryInt", ctx, expectedQuery, []interface{}{testID}).Return(int64(1), nil).Once()
		exists, err := pgxDB.Exist(ctx, testID)
		assert.NoError(t, err)
		assert.True(t, exists)
		mockDb.AssertExpectations(t)
	})

	t.Run("does not exist when count = 0", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedQuery := `SELECT count(id) FROM public.geo_tree WHERE id = $1`
		mockDb.On("GetQueryInt", ctx, expectedQuery, []interface{}{testID}).Return(int64(0), nil).Once()
		exists, err := pgxDB.Exist(ctx, testID)
		assert.NoError(t, err)
		assert.False(t, exists)
		mockDb.AssertExpectations(t)
	})

	t.Run("returns false and error when GetQueryInt returns error", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		dbError := errors.New("db query error")
		expectedQuery := `SELECT count(id) FROM public.geo_tree WHERE id = $1`
		mockDb.On("GetQueryInt", ctx, expectedQuery, []interface{}{testID}).Return(int64(0), dbError).Once()
		exists, err := pgxDB.Exist(ctx, testID)
		assert.ErrorIs(t, err, dbError)
		assert.False(t, exists)
		mockDb.AssertExpectations(t)
	})
}

func TestPgx_Count(t *testing.T) {
	ctx := context.Background()

	t.Run("successful count - no filters", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedCount := int64(42)
		filter := Filter{}

		mockDb.On("GetQueryInt", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, countGeoTree) && !strings.Contains(sql, "WHERE")
		}), mock.AnythingOfType("[]interface {}")).Return(expectedCount, nil).Once()

		count, err := pgxDB.Count(ctx, filter)
		assert.NoError(t, err)
		assert.Equal(t, expectedCount, count)
		mockDb.AssertExpectations(t)
	})

	t.Run("successful count - with filters", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		expectedCount := int64(5)
		filter := Filter{CreatedBy: "userTest", Status: "active"}

		mockDb.On("GetQueryInt", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, countGeoTree) &&
				strings.Contains(sql, "created_by = $") &&
				strings.Contains(sql, "status = $")
		}), []interface{}{filter.CreatedBy, filter.Status}).Return(expectedCount, nil).Once()

		count, err := pgxDB.Count(ctx, filter)
		assert.NoError(t, err)
		assert.Equal(t, expectedCount, count)
		mockDb.AssertExpectations(t)
	})

	t.Run("handles error from GetQueryInt", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		dbError := errors.New("db count error")
		filter := Filter{}

		mockDb.On("GetQueryInt", ctx, mock.MatchedBy(func(sql string) bool {
			return strings.HasPrefix(sql, countGeoTree)
		}), mock.AnythingOfType("[]interface {}")).Return(int64(0), dbError).Once()

		count, err := pgxDB.Count(ctx, filter)
		assert.ErrorIs(t, err, dbError)
		assert.Equal(t, int64(0), count)
		mockDb.AssertExpectations(t)
	})
}

func TestPgx_Create(t *testing.T) {
	ctx := context.Background()
	treeToCreate := GeoTree{
		Name:        "NewTree",
		Description: "A beautiful new tree",
		Status:      "active",
		CadaDate:    "2023-11-01",
		CadaComment: "Initial comment",
		CreatedBy:   "user_test",
		UpdatedBy:   "user_test",
		// ID, CreatedAt, UpdatedAt, Version, LockVersion are set by DB or code
	}

	t.Run("successful creation", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil) // Initial count doesn't matter

		// 1. Mock ExecActionQuery for the insert
		// It should return 1 (rows affected) and nil error.
		// The actual ID is generated by uuid.NewV4 in the code before calling ExecActionQuery.
		// So, we can't easily mock based on the ID in the query's args here without more complex arg matching.
		// We will match the query string and assume the args are correct.
		mockDb.On("ExecActionQuery", ctx, createGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(1), nil).Once()

		// 2. Mock the Get call that happens after insert
		// This Get is to retrieve the newly created tree, including DB-generated fields.
		// The ID used for Get will be the one generated within the Create func.
		// We need to capture this ID or use mock.Anything for the ID.
		// For simplicity, assume Get is called with any ID and returns the tree.
		// The returned tree should have DB-generated fields like ID, CreatedAt, etc.
		expectedCreatedTree := treeToCreate // Start with input
		expectedCreatedTree.ID = "mock-uuid" // Assume some ID is set
		// expectedCreatedTree.CreatedAt and UpdatedAt would be set too.

		// pgxDB.Get calls mockPool.QueryRow
		mockPool.On("QueryRow", ctx, getGeoTree, []interface{}{mock.AnythingOfType("string")}).Return(&expectedCreatedTree, nil).Once()


		createdTree, err := pgxDB.Create(ctx, treeToCreate)

		assert.NoError(t, err)
		assert.NotNil(t, createdTree)
		assert.NotEmpty(t, createdTree.ID) // ID should be set by the Create method
		assert.Equal(t, treeToCreate.Name, createdTree.Name)
		// Potentially assert other fields if necessary, esp. if DB defaults are involved

		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t)
	})

	t.Run("failure if ExecActionQuery returns error", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		dbError := errors.New("db insert error")

		mockDb.On("ExecActionQuery", ctx, createGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(0), dbError).Once()
		// Get should not be called in this case

		createdTree, err := pgxDB.Create(ctx, treeToCreate)

		assert.ErrorIs(t, err, dbError)
		assert.Nil(t, createdTree)
		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t) // Ensure Get was not called
	})

	t.Run("failure if ExecActionQuery returns 0 rows affected", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)

		mockDb.On("ExecActionQuery", ctx, createGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(0), nil).Once()
		// Get should not be called

		createdTree, err := pgxDB.Create(ctx, treeToCreate)

		assert.Error(t, err) // Specific error for 0 rows affected might be desirable
		assert.Contains(t, err.Error(), "0 rows affected")
		assert.Nil(t, createdTree)
		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t)
	})

	t.Run("failure if Get after creation returns error", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		getError := errors.New("db get error after insert")

		mockDb.On("ExecActionQuery", ctx, createGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(1), nil).Once()
		mockPool.On("QueryRow", ctx, getGeoTree, []interface{}{mock.AnythingOfType("string")}).Return(nil, getError).Once()

		createdTree, err := pgxDB.Create(ctx, treeToCreate)

		assert.ErrorIs(t, err, getError)
		assert.Nil(t, createdTree)
		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t)
	})

	t.Run("failure if Get after creation returns ErrNoRows (should be unlikely)", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)

		mockDb.On("ExecActionQuery", ctx, createGeoTree, mock.AnythingOfType("[]interface {}")).Return(int64(1), nil).Once()
		mockPool.On("QueryRow", ctx, getGeoTree, []interface{}{mock.AnythingOfType("string")}).Return(nil, pgx.ErrNoRows).Once()

		createdTree, err := pgxDB.Create(ctx, treeToCreate)

		assert.ErrorIs(t, err, pgx.ErrNoRows)
		assert.Nil(t, createdTree)
		mockDb.AssertExpectations(t)
		mockPool.AssertExpectations(t)
	})
}

func TestPgx_Update(t *testing.T) {
	ctx := context.Background()
	mockDb := new(MockDB)
	mockPool := new(MockPgxPool)
	pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil) // Setup doesn't matter much here

	assert.PanicsWithValue(t, "implement me", func() {
		pgxDB.Update(ctx, "some-id", GeoTree{})
	}, "Update method should panic with 'implement me'")
}

func TestPgx_UpdateGoelandThingId(t *testing.T) {
	ctx := context.Background()
	mockDb := new(MockDB)
	mockPool := new(MockPgxPool)
	pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil) // Setup doesn't matter much here

	assert.PanicsWithValue(t, "implement me", func() {
		pgxDB.UpdateGoelandThingId(ctx, "some-id", "new-goeland-id")
	}, "UpdateGoelandThingId method should panic with 'implement me'")
}

func TestPgx_Delete(t *testing.T) {
	ctx := context.Background()
	testID := "test-id-to-delete"

	t.Run("successful deletion", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool) // Required for newTestPgxDB
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)

		// Mock ExecActionQuery for the delete operation
		mockDb.On("ExecActionQuery", ctx, deleteGeoTree, []interface{}{testID}).Return(int64(1), nil).Once()

		err := pgxDB.Delete(ctx, testID)

		assert.NoError(t, err)
		mockDb.AssertExpectations(t)
	})

	t.Run("failure if ExecActionQuery returns error", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)
		dbError := errors.New("db delete error")

		mockDb.On("ExecActionQuery", ctx, deleteGeoTree, []interface{}{testID}).Return(int64(0), dbError).Once()

		err := pgxDB.Delete(ctx, testID)

		assert.ErrorIs(t, err, dbError)
		mockDb.AssertExpectations(t)
	})

	t.Run("failure if ExecActionQuery returns 0 rows affected", func(t *testing.T) {
		mockDb := new(MockDB)
		mockPool := new(MockPgxPool)
		pgxDB, _ := newTestPgxDB(t, mockDb, mockPool, 0, nil)

		mockDb.On("ExecActionQuery", ctx, deleteGeoTree, []interface{}{testID}).Return(int64(0), nil).Once()

		err := pgxDB.Delete(ctx, testID)

		assert.Error(t, err) // Should be an error indicating object not found or not deleted
		assert.Contains(t, err.Error(), "not found or not deleted") // Or specific error like pgx.ErrNoRows if that's what it should return
		mockDb.AssertExpectations(t)
	})
}

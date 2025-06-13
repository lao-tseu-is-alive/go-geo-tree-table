package geoTree

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockStorage is a mock implementation of the Storage interface
type MockStorage struct {
	mock.Mock
}

func (m *MockStorage) Get(ctx context.Context, id string) (*GeoTree, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*GeoTree), args.Error(1)
}

func (m *MockStorage) List(ctx context.Context, filter Filter) ([]GeoTree, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]GeoTree), args.Error(1)
}

func (m *MockStorage) Create(ctx context.Context, geoTree GeoTree) (string, error) {
	args := m.Called(ctx, geoTree)
	return args.String(0), args.Error(1)
}

func (m *MockStorage) Count(ctx context.Context, filter Filter) (int64, error) {
	args := m.Called(ctx, filter)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockStorage) GeoJson(ctx context.Context, filter Filter) ([]byte, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]byte), args.Error(1)
}

func (m *MockStorage) Update(ctx context.Context, id string, geoTree GeoTree) error {
	args := m.Called(ctx, id, geoTree)
	return args.Error(0)
}

func (m *MockStorage) Delete(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockStorage) UpdateGoelandThingId(ctx context.Context, id string, goelandThingId string) error {
	args := m.Called(ctx, id, goelandThingId)
	return args.Error(0)
}

// TestGetHandler tests the Get handler
func TestGetHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)

	// Test successful retrieval
	t.Run("success", func(t *testing.T) {
		expectedGeoTree := &GeoTree{ID: "1", Name: "Test Tree"}
		mockStorage.On("Get", mock.Anything, "1").Return(expectedGeoTree, nil).Once()

		req, _ := http.NewRequest("GET", "/1", nil)
		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "1")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Get(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		var actualGeoTree GeoTree
		json.Unmarshal(rr.Body.Bytes(), &actualGeoTree)
		assert.Equal(t, *expectedGeoTree, actualGeoTree)
		mockStorage.AssertExpectations(t)
	})

	// Test not found
	t.Run("not found", func(t *testing.T) {
		mockStorage.On("Get", mock.Anything, "2").Return(nil, ErrNotFound).Once()

		req, _ := http.NewRequest("GET", "/2", nil)
		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "2")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Get(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test general error
	t.Run("error", func(t *testing.T) {
		mockStorage.On("Get", mock.Anything, "3").Return(nil, errors.New("some error")).Once()

		req, _ := http.NewRequest("GET", "/3", nil)
		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "3")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Get(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})
}

// TestDeleteHandler tests the Delete handler
func TestDeleteHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)

	// Test successful deletion by admin
	t.Run("success admin", func(t *testing.T) {
		mockStorage.On("Delete", mock.Anything, "1").Return(nil).Once()

		req, _ := http.NewRequest("DELETE", "/1", nil)
		// Simulate admin user
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)

		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "1")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Delete(rr, req)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test deletion by non-admin
	t.Run("non-admin", func(t *testing.T) {
		req, _ := http.NewRequest("DELETE", "/1", nil)
		// Simulate non-admin user
		ctx := context.WithValue(req.Context(), "isAdmin", false)
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "1")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Delete(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
	})

	// Test not found
	t.Run("not found", func(t *testing.T) {
		mockStorage.On("Delete", mock.Anything, "2").Return(ErrNotFound).Once()

		req, _ := http.NewRequest("DELETE", "/2", nil)
		// Simulate admin user
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "2")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Delete(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test general error
	t.Run("error", func(t *testing.T) {
		mockStorage.On("Delete", mock.Anything, "3").Return(errors.New("some error")).Once()

		req, _ := http.NewRequest("DELETE", "/3", nil)
		// Simulate admin user
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)
		rr := httptest.NewRecorder()

		// Add chi context
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "3")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		service.Delete(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})
}

// TestListHandler tests the List handler
func TestListHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)

	defaultFilter := Filter{Limit: 10, Offset: 0}

	// Test successful listing with default parameters
	t.Run("success default", func(t *testing.T) {
		expectedGeoTrees := []GeoTree{{ID: "1", Name: "Tree1"}, {ID: "2", Name: "Tree2"}}
		mockStorage.On("List", mock.Anything, defaultFilter).Return(expectedGeoTrees, nil).Once()

		req, _ := http.NewRequest("GET", "/", nil)
		rr := httptest.NewRecorder()
		service.List(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		var actualGeoTrees []GeoTree
		json.Unmarshal(rr.Body.Bytes(), &actualGeoTrees)
		assert.Equal(t, expectedGeoTrees, actualGeoTrees)
		mockStorage.AssertExpectations(t)
	})

	// Test listing with limit and offset
	t.Run("success with limit and offset", func(t *testing.T) {
		customFilter := Filter{Limit: 1, Offset: 1}
		expectedGeoTrees := []GeoTree{{ID: "2", Name: "Tree2"}}
		mockStorage.On("List", mock.Anything, customFilter).Return(expectedGeoTrees, nil).Once()

		req, _ := http.NewRequest("GET", "/?limit=1&offset=1", nil)
		rr := httptest.NewRecorder()
		service.List(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		var actualGeoTrees []GeoTree
		json.Unmarshal(rr.Body.Bytes(), &actualGeoTrees)
		assert.Equal(t, expectedGeoTrees, actualGeoTrees)
		mockStorage.AssertExpectations(t)
	})

	// Test listing with filter parameters
	t.Run("success with filters", func(t *testing.T) {
		filter := Filter{Limit: 10, Offset: 0, CadaDate: "2023-01-01", CreatedBy: "user1"}
		expectedGeoTrees := []GeoTree{{ID: "3", Name: "Tree3", CadaDate: "2023-01-01", CreatedBy: "user1"}}
		mockStorage.On("List", mock.Anything, filter).Return(expectedGeoTrees, nil).Once()

		req, _ := http.NewRequest("GET", "/?cada_date=2023-01-01&created_by=user1", nil)
		rr := httptest.NewRecorder()
		service.List(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		var actualGeoTrees []GeoTree
		json.Unmarshal(rr.Body.Bytes(), &actualGeoTrees)
		assert.Equal(t, expectedGeoTrees, actualGeoTrees)
		mockStorage.AssertExpectations(t)
	})

	// Test no geoTree objects found
	t.Run("not found", func(t *testing.T) {
		mockStorage.On("List", mock.Anything, defaultFilter).Return([]GeoTree{}, nil).Once()

		req, _ := http.NewRequest("GET", "/", nil)
		rr := httptest.NewRecorder()
		service.List(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "[]\n", rr.Body.String()) // Expecting an empty JSON array
		mockStorage.AssertExpectations(t)
	})

	// Test general error
	t.Run("error", func(t *testing.T) {
		mockStorage.On("List", mock.Anything, defaultFilter).Return(nil, errors.New("some db error")).Once()

		req, _ := http.NewRequest("GET", "/", nil)
		rr := httptest.NewRecorder()
		service.List(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})
}

// TestCreateHandler tests the Create handler
func TestCreateHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)

	// Test successful creation
	t.Run("success", func(t *testing.T) {
		geoTree := GeoTree{Name: "New Tree", CadaComment: "Valid comment"}
		expectedID := "newID"
		mockStorage.On("Create", mock.Anything, geoTree).Return(expectedID, nil).Once()

		body, _ := json.Marshal(geoTree)
		req, _ := http.NewRequest("POST", "/", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		service.Create(rr, req)

		assert.Equal(t, http.StatusCreated, rr.Code)
		var response map[string]string
		json.Unmarshal(rr.Body.Bytes(), &response)
		assert.Equal(t, expectedID, response["id"])
		mockStorage.AssertExpectations(t)
	})

	// Test creation with empty CadaComment
	t.Run("empty cada_comment", func(t *testing.T) {
		geoTree := GeoTree{Name: "Test Tree", CadaComment: ""} // Invalid
		body, _ := json.Marshal(geoTree)
		req, _ := http.NewRequest("POST", "/", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		service.Create(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
		// Optionally check error message in response if service provides one
	})

	// Test creation when ID already exists (handled by storage returning an error)
	// The service itself doesn't check for existing ID before calling Create,
	// it relies on the storage layer to return an error.
	// Let's simulate a generic storage error that could represent this.
	t.Run("id already exists", func(t *testing.T) {
		geoTree := GeoTree{Name: "Tree Exists", CadaComment: "Valid comment"}
		mockStorage.On("Create", mock.Anything, geoTree).Return("", errors.New("ID already exists")).Once() // Simulate storage error

		body, _ := json.Marshal(geoTree)
		req, _ := http.NewRequest("POST", "/", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		service.Create(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code) // As per current service.go error handling for Create
		mockStorage.AssertExpectations(t)
	})

	// Test general error during creation
	t.Run("storage error", func(t *testing.T) {
		geoTree := GeoTree{Name: "Error Tree", CadaComment: "Valid comment"}
		mockStorage.On("Create", mock.Anything, geoTree).Return("", errors.New("some db error")).Once()

		body, _ := json.Marshal(geoTree)
		req, _ := http.NewRequest("POST", "/", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		service.Create(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code) // As per current service.go error handling for Create
		mockStorage.AssertExpectations(t)
	})

	// Test invalid request body format
	t.Run("invalid request body", func(t *testing.T) {
		req, _ := http.NewRequest("POST", "/", bytes.NewBufferString("not a json"))
		req.Header.Set("Content-Type", "application/json")
		rr := httptest.NewRecorder()

		service.Create(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

}

// TestCountHandler tests the Count handler
func TestCountHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)

	defaultFilter := Filter{} // Assuming default filter for count doesn't have limit/offset

	// Test successful counting with default parameters
	t.Run("success default", func(t *testing.T) {
		expectedCount := int64(5)
		mockStorage.On("Count", mock.Anything, defaultFilter).Return(expectedCount, nil).Once()

		req, _ := http.NewRequest("GET", "/count", nil)
		rr := httptest.NewRecorder()
		service.Count(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		var response map[string]int64
		json.Unmarshal(rr.Body.Bytes(), &response)
		assert.Equal(t, expectedCount, response["count"])
		mockStorage.AssertExpectations(t)
	})

	// Test counting with filter parameters
	t.Run("success with filters", func(t *testing.T) {
		filter := Filter{CadaDate: "2023-01-01", CreatedBy: "user1"}
		expectedCount := int64(2)
		mockStorage.On("Count", mock.Anything, filter).Return(expectedCount, nil).Once()

		req, _ := http.NewRequest("GET", "/count?cada_date=2023-01-01&created_by=user1", nil)
		rr := httptest.NewRecorder()
		service.Count(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		var response map[string]int64
		json.Unmarshal(rr.Body.Bytes(), &response)
		assert.Equal(t, expectedCount, response["count"])
		mockStorage.AssertExpectations(t)
	})

	// Test general error
	t.Run("error", func(t *testing.T) {
		mockStorage.On("Count", mock.Anything, defaultFilter).Return(int64(0), errors.New("some db error")).Once()

		req, _ := http.NewRequest("GET", "/count", nil)
		rr := httptest.NewRecorder()
		service.Count(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})
}

// TestGeoJsonHandler tests the GeoJson handler
func TestGeoJsonHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)

	defaultFilter := Filter{}

	// Test successful retrieval of GeoJSON
	t.Run("success default", func(t *testing.T) {
		expectedGeoJson := []byte(`{"type": "FeatureCollection", "features": []}`) // Example empty GeoJSON
		mockStorage.On("GeoJson", mock.Anything, defaultFilter).Return(expectedGeoJson, nil).Once()

		req, _ := http.NewRequest("GET", "/geojson", nil)
		rr := httptest.NewRecorder()
		service.GeoJson(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
		assert.JSONEq(t, string(expectedGeoJson), rr.Body.String())
		mockStorage.AssertExpectations(t)
	})

	// Test retrieval with filter parameters
	t.Run("success with filters", func(t *testing.T) {
		filter := Filter{CadaDate: "2023-01-01", CreatedBy: "user1"}
		expectedGeoJson := []byte(`{"type": "FeatureCollection", "features": [{"type": "Feature", "geometry": null, "properties": {"id": "1"}}]}`) // Example
		mockStorage.On("GeoJson", mock.Anything, filter).Return(expectedGeoJson, nil).Once()

		req, _ := http.NewRequest("GET", "/geojson?cada_date=2023-01-01&created_by=user1", nil)
		rr := httptest.NewRecorder()
		service.GeoJson(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
		assert.JSONEq(t, string(expectedGeoJson), rr.Body.String())
		mockStorage.AssertExpectations(t)
	})

	// Test case where no data results in an "empty" GeoJSON response
	t.Run("empty result", func(t *testing.T) {
		// The current implementation returns `[]byte("null")` when the SQL query returns no rows.
		// A more standard approach would be an empty FeatureCollection.
		// For now, testing the existing behavior.
		expectedResponse := []byte("null")
		mockStorage.On("GeoJson", mock.Anything, defaultFilter).Return(expectedResponse, nil).Once()

		req, _ := http.NewRequest("GET", "/geojson", nil)
		rr := httptest.NewRecorder()
		service.GeoJson(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
		assert.Equal(t, string(expectedResponse), rr.Body.String())
		mockStorage.AssertExpectations(t)
	})

	// Test case where storage returns nil, nil (no rows)
	t.Run("no rows from storage", func(t *testing.T) {
		mockStorage.On("GeoJson", mock.Anything, defaultFilter).Return(nil, nil).Once()

		req, _ := http.NewRequest("GET", "/geojson", nil)
		rr := httptest.NewRecorder()
		service.GeoJson(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
		assert.Equal(t, "application/json", rr.Header().Get("Content-Type"))
		// Service currently returns "null" string for nil byte slice from storage
		assert.Equal(t, "null", rr.Body.String())
		mockStorage.AssertExpectations(t)
	})

	// Test general error
	t.Run("error", func(t *testing.T) {
		mockStorage.On("GeoJson", mock.Anything, defaultFilter).Return(nil, errors.New("some db error")).Once()

		req, _ := http.NewRequest("GET", "/geojson", nil)
		rr := httptest.NewRecorder()
		service.GeoJson(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})
}

// TestUpdateHandler tests the Update handler
func TestUpdateHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)
	objectID := "1"

	// Test successful update by admin
	t.Run("success admin", func(t *testing.T) {
		geoTreeUpdate := GeoTree{Name: "Updated Tree", CadaComment: "Updated comment"}
		mockStorage.On("Update", mock.Anything, objectID, geoTreeUpdate).Return(nil).Once()

		body, _ := json.Marshal(geoTreeUpdate)
		req, _ := http.NewRequest("PUT", "/"+objectID, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		// Simulate admin user
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)

		// Add chi context for URL param
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.Update(rr, req)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test update attempt by non-admin
	t.Run("non-admin", func(t *testing.T) {
		geoTreeUpdate := GeoTree{Name: "Updated Tree", CadaComment: "Updated comment"}
		body, _ := json.Marshal(geoTreeUpdate)
		req, _ := http.NewRequest("PUT", "/"+objectID, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		// Simulate non-admin user
		ctx := context.WithValue(req.Context(), "isAdmin", false)
		req = req.WithContext(ctx)

		// Add chi context for URL param
		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.Update(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
	})

	// Test updating non-existent geoTree
	t.Run("not found", func(t *testing.T) {
		geoTreeUpdate := GeoTree{Name: "Updated Tree", CadaComment: "Updated comment"}
		mockStorage.On("Update", mock.Anything, "nonexistent", geoTreeUpdate).Return(ErrNotFound).Once()

		body, _ := json.Marshal(geoTreeUpdate)
		req, _ := http.NewRequest("PUT", "/nonexistent", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "nonexistent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.Update(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test update with empty CadaComment
	t.Run("empty cada_comment", func(t *testing.T) {
		geoTreeUpdate := GeoTree{Name: "Updated Tree", CadaComment: ""} // Invalid
		body, _ := json.Marshal(geoTreeUpdate)
		req, _ := http.NewRequest("PUT", "/"+objectID, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.Update(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	// Test general error during update
	t.Run("storage error", func(t *testing.T) {
		geoTreeUpdate := GeoTree{Name: "Error Tree", CadaComment: "Valid comment"}
		mockStorage.On("Update", mock.Anything, objectID, geoTreeUpdate).Return(errors.New("some db error")).Once()

		body, _ := json.Marshal(geoTreeUpdate)
		req, _ := http.NewRequest("PUT", "/"+objectID, bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.Update(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code) // service.go returns 500 for general update errors
		mockStorage.AssertExpectations(t)
	})

	// Test invalid request body format
	t.Run("invalid request body", func(t *testing.T) {
		req, _ := http.NewRequest("PUT", "/"+objectID, bytes.NewBufferString("not a json"))
		req.Header.Set("Content-Type", "application/json")
		ctx := context.WithValue(req.Context(), "isAdmin", true)
		req = req.WithContext(ctx)

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.Update(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})
}

// TestUpdateGoelandThingIdHandler tests the UpdateGoelandThingId handler
func TestUpdateGoelandThingIdHandler(t *testing.T) {
	mockStorage := new(MockStorage)
	service := NewService(mockStorage)
	objectID := "1"
	goelandThingID := "goelandID123"

	// Test successful update of goeland_thing_id
	// Note: Current service.UpdateGoelandThingId re-binds the whole object and calls Store.Update.
	// This means it also re-validates CadaComment.
	t.Run("success", func(t *testing.T) {
		// First, mock the Get call that happens inside UpdateGoelandThingId
		existingGeoTree := &GeoTree{ID: objectID, Name: "Test Tree", CadaComment: "Initial valid comment"}
		mockStorage.On("Get", mock.Anything, objectID).Return(existingGeoTree, nil).Once()

		// Then, mock the Update call
		updatedGeoTree := *existingGeoTree // Make a copy
		updatedGeoTree.GoelandThingId = goelandThingID
		// IMPORTANT: The service's UpdateGoelandThingId handler calls storage.Update, not a dedicated storage.UpdateGoelandThingId.
		// And it sends the whole GeoTree object, after fetching and modifying it.
		mockStorage.On("Update", mock.Anything, objectID, updatedGeoTree).Return(nil).Once()

		updatePayload := map[string]string{"goeland_thing_id": goelandThingID}
		body, _ := json.Marshal(updatePayload)
		req, _ := http.NewRequest("PUT", "/"+objectID+"/goeland", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		assert.Equal(t, http.StatusNoContent, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test attempting to update non-existent geoTree
	t.Run("not found", func(t *testing.T) {
		mockStorage.On("Get", mock.Anything, "nonexistent").Return(nil, ErrNotFound).Once()

		updatePayload := map[string]string{"goeland_thing_id": goelandThingID}
		body, _ := json.Marshal(updatePayload)
		req, _ := http.NewRequest("PUT", "/nonexistent/goeland", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", "nonexistent")
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		assert.Equal(t, http.StatusNotFound, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test invalid request body (e.g. not JSON, or missing goeland_thing_id)
	t.Run("invalid request body - not json", func(t *testing.T) {
		req, _ := http.NewRequest("PUT", "/"+objectID+"/goeland", bytes.NewBufferString("not a json"))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		assert.Equal(t, http.StatusBadRequest, rr.Code)
	})

	t.Run("invalid request body - missing goeland_thing_id", func(t *testing.T) {
		updatePayload := map[string]string{"other_field": "some_value"} // goeland_thing_id is missing
		body, _ := json.Marshal(updatePayload)
		req, _ := http.NewRequest("PUT", "/"+objectID+"/goeland", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		// The handler tries to Get the existing object first. If that succeeds,
		// it then tries to bind the payload. If goeland_thing_id is missing,
		// it might not cause an error if the struct field has `omitempty`.
		// However, the current GeoTree struct doesn't specify omitempty for GoelandThingId.
		// The current code would proceed to call Update with an unchanged GoelandThingId.
		// This test needs to reflect the actual behavior.
		// Let's assume Get is successful.
		existingGeoTree := &GeoTree{ID: objectID, Name: "Test Tree", CadaComment: "Initial valid comment", GoelandThingId: "oldID"}
		mockStorage.On("Get", mock.Anything, objectID).Return(existingGeoTree, nil).Once()
		// Since goeland_thing_id is missing in payload, the existing one is used for update.
		// No error from bind, no error from update.
		mockStorage.On("Update", mock.Anything, objectID, *existingGeoTree).Return(nil).Once()


		service.UpdateGoelandThingId(rr, req)
		assert.Equal(t, http.StatusNoContent, rr.Code) // No change, but no error by current logic.
		mockStorage.AssertExpectations(t)
	})


	// Test general error during Get operation in UpdateGoelandThingId
	t.Run("get error", func(t *testing.T) {
		mockStorage.On("Get", mock.Anything, objectID).Return(nil, errors.New("some db error")).Once()

		updatePayload := map[string]string{"goeland_thing_id": goelandThingID}
		body, _ := json.Marshal(updatePayload)
		req, _ := http.NewRequest("PUT", "/"+objectID+"/goeland", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test general error during Update operation in UpdateGoelandThingId
	t.Run("update error", func(t *testing.T) {
		existingGeoTree := &GeoTree{ID: objectID, Name: "Test Tree", CadaComment: "Valid comment for update"}
		mockStorage.On("Get", mock.Anything, objectID).Return(existingGeoTree, nil).Once()

		updatedGeoTree := *existingGeoTree
		updatedGeoTree.GoelandThingId = goelandThingID
		mockStorage.On("Update", mock.Anything, objectID, updatedGeoTree).Return(errors.New("some db error")).Once()

		updatePayload := map[string]string{"goeland_thing_id": goelandThingID}
		body, _ := json.Marshal(updatePayload)
		req, _ := http.NewRequest("PUT", "/"+objectID+"/goeland", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		mockStorage.AssertExpectations(t)
	})

	// Test validation error due to CadaComment during the Update call
	t.Run("cada_comment validation error during update", func(t *testing.T) {
		// Simulate Get returning an object that has an invalid CadaComment (e.g. empty)
		// This shouldn't happen if data integrity is maintained, but tests the handler's validation path.
		existingGeoTree := &GeoTree{ID: objectID, Name: "Test Tree", CadaComment: ""} // Invalid CadaComment
		mockStorage.On("Get", mock.Anything, objectID).Return(existingGeoTree, nil).Once()

		// The Update call will not be mocked here because the validation for CadaComment happens before it.

		updatePayload := map[string]string{"goeland_thing_id": goelandThingID}
		body, _ := json.Marshal(updatePayload)
		req, _ := http.NewRequest("PUT", "/"+objectID+"/goeland", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		rctx := chi.NewRouteContext()
		rctx.URLParams.Add("id", objectID)
		req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

		rr := httptest.NewRecorder()
		service.UpdateGoelandThingId(rr, req)

		// The service's UpdateGoelandThingId method fetches the GeoTree object,
		// updates its GoelandThingId field, and then calls s.Store.Update(ctx, id, *geoTree).
		// The validation for CadaComment is within the Update method of the service,
		// but UpdateGoelandThingId calls storage.Update directly after fetching and modifying.
		// Let's re-read service.go:
		// UpdateGoelandThingId gets, modifies, then calls s.validateGeoTree.
		// If validateGeoTree fails (e.g. CadaComment is empty on the fetched object), it should return BadRequest.
		assert.Equal(t, http.StatusBadRequest, rr.Code)
		mockStorage.AssertExpectations(t) // Only Get should be called.
	})
}

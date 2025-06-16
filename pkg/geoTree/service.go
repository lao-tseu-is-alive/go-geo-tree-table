package geoTree

import (
	"errors"
	"fmt"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/goHttpEcho"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/golog"
	"net/http"
	"strings"
)

type Service struct {
	Log              golog.MyLogger
	DbConn           database.DB
	Store            Storage
	Server           *goHttpEcho.Server
	ListDefaultLimit int
}

func (s Service) GeoJson(ctx echo.Context, params GeoJsonParams) error {
	handlerName := "GeoJson"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("in %s : currentUserId: %d", handlerName, currentUserId)
	jsonResult, err := s.Store.GeoJson(params)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("there was a problem when calling store.List :%v", err))
		} else {
			jsonResult = "empty"
			return ctx.JSONBlob(http.StatusOK, []byte(jsonResult))
		}
	}
	return ctx.JSONBlob(http.StatusOK, []byte(jsonResult))
}

// List sends a list of geoTrees in the store based on the given parameters filters
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree?limit=3&ofset=0' |jq
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree?limit=3&type=112' |jq
func (s Service) List(ctx echo.Context, params ListParams) error {
	handlerName := "List"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("in %s : currentUserId: %d", handlerName, currentUserId)
	limit := s.ListDefaultLimit
	if params.Limit != nil {
		limit = int(*params.Limit)
	}
	offset := 0
	if params.Offset != nil {
		offset = int(*params.Offset)
	}
	list, err := s.Store.List(offset, limit, params)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("there was a problem when calling store.List :%v", err))
		} else {
			list = make([]*GeoTreeList, 0)
			return ctx.JSON(http.StatusOK, list)
		}
	}
	return ctx.JSON(http.StatusOK, list)
}

// Create allows to insert a new geoTree
// curl -s -XPOST -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"id": "3999971f-53d7-4eb6-8898-97f257ea5f27","type_id": 3,"name": "Gil-Parcelle","description": "just a nice parcelle test","external_id": 345678912,"inactivated": false,"managed_by": 999, "more_data": NULL,"pos_x":2537603.0 ,"pos_y":1152613.0   }' 'http://localhost:9090/goapi/v1/geoTree'
func (s Service) Create(ctx echo.Context) error {
	handlerName := "Create"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("in %s : currentUserId: %d", handlerName, currentUserId)

	newGeoTree := &GeoTree{
		CreatedBy: int32(currentUserId),
	}
	if err := ctx.Bind(newGeoTree); err != nil {
		msg := fmt.Sprintf("Create has invalid format [%v]", err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("Create GeoTree Bind ok : %+v ", newGeoTree)
	if len(strings.Trim(newGeoTree.CadaComment, " ")) < 1 {

		msg := fmt.Sprintf(FieldCannotBeEmpty, "CadaComment")
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	if s.Store.Exist(newGeoTree.Id) {
		msg := fmt.Sprintf("This id (%v) already exist !", newGeoTree.Id)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	geoTreeCreated, err := s.Store.Create(*newGeoTree)
	if err != nil {
		msg := fmt.Sprintf("Create had an error saving geoTree:%#v, err:%#v", *newGeoTree, err)
		s.Log.Info(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("# Create() success GeoTree %#v\n", geoTreeCreated)
	return ctx.JSON(http.StatusCreated, geoTreeCreated)
}

// Count returns the number of geoTrees found after filtering data with any given CountParams
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree/count' |jq
func (s Service) Count(ctx echo.Context, params CountParams) error {
	handlerName := "Count"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("in %s : currentUserId: %d", handlerName, currentUserId)
	numGeoTrees, err := s.Store.Count(params)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("problem counting geoTrees :%v", err))
	}
	return ctx.JSON(http.StatusOK, numGeoTrees)
}

// Delete will remove the given geoTreeId entry from the store, and if not present will return 400 Bad Request
// curl -v -XDELETE -H "Content-Type: application/json" -H "Authorization: Bearer $token" 'http://localhost:8888/api/users/3' ->  204 No Content if present and delete it
// curl -v -XDELETE -H "Content-Type: application/json"  -H "Authorization: Bearer $token" 'http://localhost:8888/users/93333' -> 400 Bad Request
func (s Service) Delete(ctx echo.Context, geoTreeId uuid.UUID) error {
	handlerName := "Delete"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := int32(claims.User.UserId)
	s.Log.Info("in %s : currentUserId: %d", handlerName, currentUserId)
	// IF USER IS NOT ADMIN  RETURN 401 Unauthorized
	if !claims.User.IsAdmin {
		return echo.NewHTTPError(http.StatusUnauthorized, OnlyAdminCanManageTypeThings)
	}
	if s.Store.Exist(geoTreeId) == false {
		msg := fmt.Sprintf("Delete(%v) cannot delete this id, it does not exist !", geoTreeId)
		s.Log.Warn(msg)
		return ctx.JSON(http.StatusNotFound, msg)
	}

	err := s.Store.Delete(geoTreeId, currentUserId)
	if err != nil {
		msg := fmt.Sprintf("Delete(%v) got an error: %#v ", geoTreeId, err)
		s.Log.Error(msg)
		return echo.NewHTTPError(http.StatusInternalServerError, msg)
	}
	return ctx.NoContent(http.StatusNoContent)

}

// Get will retrieve the GeoTree with the given id in the store and return it
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree/9999971f-53d7-4eb6-8898-97f257ea5f27' |jq
func (s Service) Get(ctx echo.Context, geoTreeId uuid.UUID) error {
	handlerName := "Get"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("in %s : currentUserId: %d", handlerName, currentUserId)
	if s.Store.Exist(geoTreeId) == false {
		msg := fmt.Sprintf("Get(%v) cannot get this id, it does not exist !", geoTreeId)
		s.Log.Info(msg)
		return ctx.JSON(http.StatusNotFound, msg)
	}
	geoTree, err := s.Store.Get(geoTreeId)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("problem retrieving geoTree :%v", err))
		} else {
			msg := fmt.Sprintf("Get(%v) no rows found in db", geoTreeId)
			s.Log.Info(msg)
			return ctx.JSON(http.StatusNotFound, msg)
		}
	}
	return ctx.JSON(http.StatusOK, geoTree)
}

// Update will change the attributes values for the geoTree identified by the given geoTreeId
// curl -s -XPUT -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"id": "3999971f-53d7-4eb6-8898-97f257ea5f27","type_id": 3,"name": "Gil-Parcelle","description": "just a nice parcelle test by GIL","external_id": 345678912,"inactivated": false,"managed_by": 999, "more_data": {"info_value": 3230 },"pos_x":2537603.0 ,"pos_y":1152613.0   }' 'http://localhost:9090/goapi/v1/geoTree/3999971f-53d7-4eb6-8898-97f257ea5f27' |jq
func (s Service) Update(ctx echo.Context, geoTreeId uuid.UUID) error {
	handlerName := "Update"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := int32(claims.User.UserId)
	s.Log.Info("in %s(%d) : currentUserId: %d", handlerName, geoTreeId, currentUserId)
	// IF USER IS NOT ADMIN  RETURN 401 Unauthorized
	if !claims.User.IsAdmin {
		return echo.NewHTTPError(http.StatusUnauthorized, OnlyAdminCanManageTypeThings)
	}
	if s.Store.Exist(geoTreeId) == false {
		msg := fmt.Sprintf("Update(%v) cannot update this id, it does not exist !", geoTreeId)
		s.Log.Warn(msg)
		return ctx.JSON(http.StatusNotFound, msg)
	}

	updateGeoTree := new(GeoTree)
	if err := ctx.Bind(updateGeoTree); err != nil {
		msg := fmt.Sprintf("Update has invalid format error:[%v]", err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	if len(strings.Trim(updateGeoTree.CadaComment, " ")) < 1 {
		msg := fmt.Sprintf(FieldCannotBeEmpty, "CadaComment")
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}

	//updateGeoTree.CLastModifiedBy = &currentUserId

	geoTreeUpdated, err := s.Store.Update(geoTreeId, *updateGeoTree)
	if err != nil {
		msg := fmt.Sprintf("Update had an error saving geoTree:%#v, err:%#v", *updateGeoTree, err)
		s.Log.Info(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("# Update success GeoTree %#v\n", geoTreeUpdated)
	return ctx.JSON(http.StatusOK, geoTreeUpdated)
}

// UpdateGoelandThingId will change the goeland_thing_id value for the geoTree identified by the given geoTreeId
// curl -s -XPUT -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{"id": "3999971f-53d7-4eb6-8898-97f257ea5f27","goeland_thing_id": 3,"goeland_thing_saved_by": 3456,   }' 'http://localhost:9090/goapi/v1/geoTree/setGoelandThingId/3999971f-53d7-4eb6-8898-97f257ea5f27' |jq
func (s Service) UpdateGoelandThingId(ctx echo.Context, geoTreeId uuid.UUID) error {
	handlerName := "UpdateGoelandThingId"
	s.Log.TraceHttpRequest(handlerName, ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := int32(claims.User.UserId)
	s.Log.Info("in %s(%s) : currentUserId: %d", handlerName, geoTreeId, currentUserId)
	if s.Store.Exist(geoTreeId) == false {
		msg := fmt.Sprintf("UpdateGoelandThingId(%v) cannot update this id, it does not exist !", geoTreeId)
		s.Log.Warn(msg)
		return ctx.JSON(http.StatusNotFound, msg)
	}

	updateGeoTreeGoelandThingId := new(GeoTreeGoelandThingId)
	if err := ctx.Bind(updateGeoTreeGoelandThingId); err != nil {
		msg := fmt.Sprintf("Update has invalid format error:[%v]", err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}

	geoTreeUpdated, err := s.Store.UpdateGoelandThingId(geoTreeId, *updateGeoTreeGoelandThingId)
	if err != nil {
		msg := fmt.Sprintf("UpdateGoelandThingId had an error saving updateGeoTreeGoelandThingId:%#v, err:%#v", *updateGeoTreeGoelandThingId, err)
		s.Log.Info(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("# Update success GeoTree %#v\n", geoTreeUpdated)
	return ctx.JSON(http.StatusOK, geoTreeUpdated)
}

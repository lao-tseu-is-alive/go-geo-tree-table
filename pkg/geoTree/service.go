package geoTree

import (
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/labstack/echo/v4"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/goHttpEcho"
)

type Service struct {
	Log              *slog.Logger
	DbConn           database.DB
	Store            Storage
	Server           *goHttpEcho.Server
	Authorizer       Authorizer
	ListDefaultLimit int
}

func (s Service) ListByPosition(ctx echo.Context, params ListByPositionParams) error {
	handlerName := "ListByPosition"
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId)
	list, err := s.Store.ListByPosition(reqCtx, params)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("there was a problem when calling store.ListByPosition :%v", err))
		} else {
			list = make([]*GeoTreeList, 0)
			return ctx.JSON(http.StatusOK, list)
		}
	}
	return ctx.JSON(http.StatusOK, list)
}

func (s Service) GeoJson(ctx echo.Context, params GeoJsonParams) error {
	handlerName := "GeoJson"
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId)
	jsonResult, err := s.Store.GeoJson(reqCtx, params)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return echo.NewHTTPError(http.StatusInternalServerError, fmt.Sprintf("there was a problem when calling store.GeoJson :%v", err))
		} else {
			return ctx.JSONBlob(http.StatusOK, []byte(emptyGeoJson))
		}
	}
	return ctx.JSONBlob(http.StatusOK, []byte(jsonResult))
}

// List sends a list of geoTrees in the store based on the given parameters filters
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree?limit=3&ofset=0' |jq
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree?limit=3&type=112' |jq
func (s Service) List(ctx echo.Context, params ListParams) error {
	handlerName := "List"
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId)
	limit := s.ListDefaultLimit
	if params.Limit != nil {
		limit = int(*params.Limit)
	}
	offset := 0
	if params.Offset != nil {
		offset = int(*params.Offset)
	}
	list, err := s.Store.List(reqCtx, offset, limit, params)
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
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	currentUserLogin := claims.User.Login
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId, "login", currentUserLogin)
	isAuthorized, err := s.Authorizer.IsUserAuthorized(reqCtx, currentUserLogin)
	if err != nil {
		s.Log.Error("authorization check failed", "login", currentUserLogin, "error", err)
		// It's good practice to return a generic error message to the client
		// to avoid leaking internal implementation details.
		return echo.NewHTTPError(http.StatusInternalServerError, "Could not verify user authorization.")
	}
	if !isAuthorized {
		s.Log.Warn("user is not authorized to create a geoTree, (not member of CadaGeomTree ?)", "login", currentUserLogin)
		return echo.NewHTTPError(http.StatusUnauthorized, fmt.Sprintf("user %s is not authorized to perform this action(not member of CadaGeomTree ?).", currentUserLogin))
	}
	s.Log.Info("user is authorized to create a geoTree", "login", currentUserLogin)

	newGeoTree := &GeoTree{
		CreatedBy: int32(currentUserId),
	}
	if err := ctx.Bind(newGeoTree); err != nil {
		msg := fmt.Sprintf("Create has invalid format [%v]", err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	newGeoTree.CreatedBy = int32(currentUserId)
	s.Log.Debug("Create GeoTree Bind ok", "geoTree", newGeoTree)
	if err := newGeoTree.Validate(); err != nil {
		msg := fmt.Sprintf("Create has invalid values: %v", err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	if len(strings.Trim(newGeoTree.CadaComment, " ")) < 1 {
		// store current timestamp
		dateNow := time.Now()
		newGeoTree.CadaComment = fmt.Sprintf("created by user: [%d] %s at %s",
			currentUserId,
			claims.User.Name,
			dateNow.Format("2006-01-02 15:04:05	"),
		)
	}
	if s.Store.Exist(reqCtx, newGeoTree.Id) {
		msg := fmt.Sprintf("This id (%v) already exist !", newGeoTree.Id)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	geoTreeCreated, err := s.Store.Create(reqCtx, *newGeoTree)
	if err != nil {
		msg := fmt.Sprintf("Create had an error saving geoTree:%#v, err:%#v", *newGeoTree, err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("Create success", "id", geoTreeCreated.Id)
	return ctx.JSON(http.StatusCreated, geoTreeCreated)
}

// Count returns the number of geoTrees found after filtering data with any given CountParams
// curl -s -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" 'http://localhost:9090/goapi/v1/geoTree/count' |jq
func (s Service) Count(ctx echo.Context, params CountParams) error {
	handlerName := "Count"
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId)
	numGeoTrees, err := s.Store.Count(reqCtx, params)
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
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := int32(claims.User.UserId)
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId, "geoTreeId", geoTreeId)
	// IF USER IS NOT ADMIN  RETURN 401 Unauthorized
	if !claims.User.IsAdmin {
		return echo.NewHTTPError(http.StatusUnauthorized, OnlyAdminCanManageThis)
	}
	if !s.Store.Exist(reqCtx, geoTreeId) {
		msg := fmt.Sprintf("Delete(%v) cannot delete this id, it does not exist !", geoTreeId)
		s.Log.Warn(msg)
		return ctx.JSON(http.StatusNotFound, msg)
	}

	err := s.Store.Delete(reqCtx, geoTreeId, currentUserId)
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
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId, "geoTreeId", geoTreeId)
	if !s.Store.Exist(reqCtx, geoTreeId) {
		msg := fmt.Sprintf("Get(%v) cannot get this id, it does not exist !", geoTreeId)
		s.Log.Info(msg)
		return ctx.JSON(http.StatusNotFound, msg)
	}
	geoTree, err := s.Store.Get(reqCtx, geoTreeId)
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
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := int32(claims.User.UserId)
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId, "geoTreeId", geoTreeId)
	// IF USER IS NOT ADMIN  RETURN 401 Unauthorized
	if !claims.User.IsAdmin {
		return echo.NewHTTPError(http.StatusUnauthorized, OnlyAdminCanManageThis)
	}
	if !s.Store.Exist(reqCtx, geoTreeId) {
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
	if err := updateGeoTree.Validate(); err != nil {
		msg := fmt.Sprintf("Update has invalid values: %v", err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	if len(strings.Trim(updateGeoTree.CadaComment, " ")) < 1 {
		msg := fmt.Sprintf(FieldCannotBeEmpty, "CadaComment")
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}

	geoTreeUpdated, err := s.Store.Update(reqCtx, geoTreeId, *updateGeoTree)
	if err != nil {
		msg := fmt.Sprintf("Update had an error saving geoTree:%#v, err:%#v", *updateGeoTree, err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("Update success", "id", geoTreeUpdated.Id)
	return ctx.JSON(http.StatusOK, geoTreeUpdated)
}

// UpdateGoelandThingId will change the goeland_thing_id value for the geoTree identified by the given geoTreeId
// curl -s -XPUT   -H "Authorization: Bearer $TOKEN" -d '{"id": "3999971f-53d7-4eb6-8898-97f257ea5f27","goeland_thing_id": 3,"goeland_thing_saved_by": 3456,   }' 'http://localhost:9090/goapi/v1/geoTree/setGoelandThingId/3999971f-53d7-4eb6-8898-97f257ea5f27' |jq
// curl -X PUT -H "Content-Type: application/json" -v -b cookies.txt -d '{"id":"52e1a220-7652-41f3-abe1-a6f3c7587f33","goeland_thing_id":69, "goeland_thing_saved_by":34}'  cookies.txt http://localhost:7979/goapi/v1/geoTree/setGoelandThingId/52e1a220-7652-41f3-abe1-a6f3c7587f33
func (s Service) UpdateGoelandThingId(ctx echo.Context, geoTreeId uuid.UUID) error {
	handlerName := "UpdateGoelandThingId"
	goHttpEcho.TraceHttpRequest(handlerName, ctx.Request(), s.Log)
	reqCtx := ctx.Request().Context()
	// get the current user from JWT TOKEN
	claims := s.Server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := int32(claims.User.UserId)
	s.Log.Info("entering handler", "handler", handlerName, "currentUserId", currentUserId, "geoTreeId", geoTreeId)
	if !s.Store.Exist(reqCtx, geoTreeId) {
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
	s.Log.Debug("about to call UpdateGoelandThingId", "geoTreeId", geoTreeId, "data", *updateGeoTreeGoelandThingId)
	geoTreeUpdated, err := s.Store.UpdateGoelandThingId(reqCtx, geoTreeId, *updateGeoTreeGoelandThingId)
	if err != nil {
		msg := fmt.Sprintf("UpdateGoelandThingId had an error saving updateGeoTreeGoelandThingId:%#v, err:%#v", *updateGeoTreeGoelandThingId, err)
		s.Log.Error(msg)
		return ctx.JSON(http.StatusBadRequest, msg)
	}
	s.Log.Info("UpdateGoelandThingId success", "id", geoTreeUpdated.Id)
	return ctx.JSON(http.StatusOK, geoTreeUpdated)
}

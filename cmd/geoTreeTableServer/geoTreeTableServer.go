package main

import (
	"context"
	"embed"
	"errors"
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"runtime"
	"strings"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/config"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/goHttpEcho"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/golog"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/metadata"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/tools"
	"github.com/lao-tseu-is-alive/go-geo-tree-table/pkg/geoTree"
	"github.com/lao-tseu-is-alive/go-geo-tree-table/pkg/version"
)

const (
	defaultPort                  = 8080
	defaultDBPort                = 5432
	defaultDBIp                  = "127.0.0.1"
	defaultDBSslMode             = "prefer"
	defaultLogName               = "stderr"
	defaultRestrictedUrlBasePath = "/goapi/v1"
	defaultJwtStatusUrl          = "/status"
	defaultJwtCookieName         = "goJWT_token"
	defaultWebRootDir            = "geoTreeTableFront/dist/"
	defaultSqlDbMigrationsPath   = "db/migrations"
	defaultAdminUser             = "goadmin"
	defaultAdminEmail            = "goadmin@yourdomain.org"
	defaultAdminId               = 960901
	defaultAdminExternalId       = 9999999
	defaultJwtDurationMinutes    = 60
	charsetUTF8                  = "charset=UTF-8"
	MIMEHtml                     = "text/html"
	MIMEHtmlCharsetUTF8          = MIMEHtml + "; " + charsetUTF8
)

// content holds our static web server content.
//
//go:embed geoTreeTableFront/dist/*
var content embed.FS

// sqlMigrations holds our db migrations sql files using https://github.com/golang-migrate/migrate
// in the line above you SHOULD have the same path  as const defaultSqlDbMigrationsPath
//
//go:embed db/migrations/*.sql
var sqlMigrations embed.FS

// UserLogin defines model for UserLogin.
type UserLogin struct {
	PasswordHash string `json:"password_hash"`
	Username     string `json:"username"`
}
type Service struct {
	Logger        *slog.Logger
	dbConn        database.DB
	server        *goHttpEcho.Server
	jwtCookieName string
}

// logFatalf logs the given message with the error level and exits the process.
// golog.MyLogger.Fatal disappeared with the migration to log/slog in
// go-cloud-k8s-common-libs v0.6.x, this helper keeps the same "log and die" semantic.
func logFatalf(l *slog.Logger, msg string, args ...any) {
	l.Error(msg, args...)
	os.Exit(1)
}

// login is just a trivial stupid example to test this server
// you should use the jwt token returned from LoginUser  in github.com/lao-tseu-is-alive/go-cloud-k8s-user-group'
// and share the same secret with the above component
func (s Service) login(ctx echo.Context) error {
	goHttpEcho.TraceHttpRequest("login", ctx.Request(), s.Logger)
	reqCtx := ctx.Request().Context()
	uLogin := new(UserLogin)
	login := ctx.FormValue("login")
	passwordHash := ctx.FormValue("hashed")
	// maybe it was not a form but a fetch data post
	if len(strings.Trim(login, " ")) < 1 {
		if err := ctx.Bind(uLogin); err != nil {
			myErrMsg := "error invalid user login or json format in request body"
			s.Logger.Warn(myErrMsg)
			return ctx.JSON(http.StatusUnauthorized, map[string]string{"jwtStatus": myErrMsg, "token": ""})
		}
	} else {
		uLogin.Username = login
		uLogin.PasswordHash = passwordHash
	}
	s.Logger.Debug("About to check user credentials", "username", uLogin.Username)
	if s.server.Authenticator.AuthenticateUser(reqCtx, uLogin.Username, uLogin.PasswordHash) {
		// uLogin.Username is used and not login, because the credentials may come from the json body
		userInfo, err := s.server.Authenticator.GetUserInfoFromLogin(reqCtx, uLogin.Username)
		if err != nil {
			myErrMsg := fmt.Sprintf("Error getting user info from login: %v", err)
			s.Logger.Error(myErrMsg)
			return ctx.JSON(http.StatusUnauthorized, map[string]string{"jwtStatus": myErrMsg, "token": ""})
		}
		token, err := s.server.JwtCheck.GetTokenFromUserInfo(userInfo)
		if err != nil {
			myErrMsg := fmt.Sprintf("Error getting jwt token from user info: %v", err)
			s.Logger.Error(myErrMsg)
			return ctx.JSON(http.StatusInternalServerError, map[string]string{"jwtStatus": myErrMsg, "token": ""})
		}
		// Prepare the response
		response := map[string]string{
			"jwtStatus": "success",
			"token":     token.String(),
		}
		s.Logger.Info("LoginUser successful login", "login", uLogin.Username)
		return ctx.JSON(http.StatusOK, response)
	} else {
		myErrMsg := "username not found or password invalid"
		s.Logger.Warn(myErrMsg)
		return ctx.JSON(http.StatusUnauthorized, map[string]string{"jwtStatus": myErrMsg, "token": ""})
	}
}

func (s Service) GetStatus(ctx echo.Context) error {
	goHttpEcho.TraceHttpRequest("GetStatus", ctx.Request(), s.Logger)
	// get the current user from JWT TOKEN
	claims := s.server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Logger.Info("in GetStatus", "currentUserId", currentUserId)
	// you can check if the user is not active anymore and RETURN 401 Unauthorized
	//if !s.Store.IsUserActive(currentUserId) {
	//	return echo.NewHTTPError(http.StatusUnauthorized, "current calling user is not active anymore")
	//}
	return ctx.JSON(http.StatusOK, claims)
}

func main() {
	logWriter, err := config.GetLogWriter(defaultLogName)
	if err != nil {
		log.Fatalf("💥💥 error getting log writer: %v'\n", err)
	}
	logLevel, err := config.GetLogLevel(golog.InfoLevel)
	if err != nil {
		log.Fatalf("💥💥 error getting log level: %v'\n", err)
	}
	l := golog.NewLogger("simple", logWriter, logLevel, version.APP)
	l.Info("🚀 Starting", "app", version.APP, "version", version.VERSION, "revision", version.REVISION, "build", version.BuildStamp, "repository", version.REPOSITORY)

	// ctx is the context used for all the startup tasks (db connection, migrations, metadata)
	ctx := context.Background()

	dbDsn, err := config.GetPgDbDsnUrl(defaultDBIp, defaultDBPort, tools.ToSnakeCase(version.APP), version.AppSnake, defaultDBSslMode)
	if err != nil {
		logFatalf(l, "💥💥 error doing config.GetPgDbDsnUrl", "error", err)
	}
	db, err := database.GetInstance(ctx, "pgx", dbDsn, runtime.NumCPU(), l)
	if err != nil {
		logFatalf(l, "💥💥 error doing database.GetInstance(pgx ...)", "error", err)
	}
	defer db.Close()

	dbVersion, err := db.GetVersion(ctx)
	if err != nil {
		logFatalf(l, "💥💥 error doing dbConn.GetVersion()", "error", err)
	}
	l.Info("connected to db", "dbVersion", dbVersion)

	// checking metadata information
	metadataService := metadata.Service{Log: l, Db: db}
	metadataService.CreateMetadataTableOrFail(ctx)
	found, ver := metadataService.GetServiceVersionOrFail(ctx, version.APP)
	if found {
		l.Info("service was found in metadata", "service", version.APP, "version", ver)
	} else {
		l.Info("service was not found in metadata", "service", version.APP)
	}
	metadataService.SetServiceVersionOrFail(ctx, version.APP, version.VERSION)

	// https://github.com/golang-migrate/migrate
	d, err := iofs.New(sqlMigrations, defaultSqlDbMigrationsPath)
	if err != nil {
		logFatalf(l, "💥💥 error doing iofs.New for db migrations", "error", err)
	}
	m, err := migrate.NewWithSourceInstance("iofs", d, strings.Replace(dbDsn, "postgres", "pgx5", 1))
	if err != nil {
		// dbDsn is not logged because it contains the db password
		logFatalf(l, "💥💥 error doing migrate.NewWithSourceInstance(iofs, dbURL)", "error", err)
	}

	err = m.Up()
	if err != nil {
		if !errors.Is(err, migrate.ErrNoChange) {
			logFatalf(l, "💥💥 error doing migrate.Up", "error", err)
		}
	}

	// Get the ENV JWT_AUTH_URL value
	jwtAuthUrl, err := config.GetJwtAuthUrl()
	if err != nil {
		logFatalf(l, "💥💥 error doing config.GetJwtAuthUrl", "error", err)
	}
	jwtStatusUrl := config.GetJwtStatusUrl(defaultJwtStatusUrl)

	myVersionReader := goHttpEcho.NewSimpleVersionReader(
		version.APP,
		version.VERSION,
		version.REPOSITORY,
		version.REVISION,
		version.BuildStamp,
		jwtAuthUrl,
		jwtStatusUrl,
	)
	// Create a new JWT checker with the jwt config found in the environment
	myJwt, err := goHttpEcho.GetNewJwtCheckerFromConfig(version.APP, defaultJwtDurationMinutes, l)
	if err != nil {
		logFatalf(l, "💥💥 error doing goHttpEcho.GetNewJwtCheckerFromConfig", "error", err)
	}
	// Create a new Authenticator with a simple admin user
	adminConfig, err := goHttpEcho.GetAdminConfig(goHttpEcho.AdminDefaults{
		UserId:     defaultAdminId,
		ExternalId: defaultAdminExternalId,
		Login:      defaultAdminUser,
		Email:      defaultAdminEmail,
	})
	if err != nil {
		logFatalf(l, "💥💥 error doing goHttpEcho.GetAdminConfig", "error", err)
	}
	myAuthenticator := goHttpEcho.NewSimpleAdminAuthenticator(&goHttpEcho.UserInfo{
		UserId:     adminConfig.UserId,
		ExternalId: adminConfig.ExternalId,
		Name:       "NewSimpleAdminAuthenticator_Admin",
		Email:      adminConfig.Email,
		Login:      adminConfig.Login,
		IsAdmin:    false,
		Groups:     []int{1}, // this is the group id of the global_admin group
	},
		adminConfig.Password,
		myJwt)

	server, err := goHttpEcho.CreateNewServerFromEnv(
		defaultPort,
		"0.0.0.0", // defaultServerIp,
		&goHttpEcho.Config{
			ListenAddress: "",
			Authenticator: myAuthenticator,
			JwtCheck:      myJwt,
			VersionReader: myVersionReader,
			Logger:        l,
			WebRootDir:    defaultWebRootDir,
			Content:       content,
			RestrictedUrl: defaultRestrictedUrlBasePath,
		},
	)
	if err != nil {
		logFatalf(l, "💥💥 error doing goHttpEcho.CreateNewServerFromEnv", "error", err)
	}
	cookieNameForJWT := config.GetJwtCookieName(defaultJwtCookieName)
	yourService := Service{
		Logger:        l,
		dbConn:        db,
		server:        server,
		jwtCookieName: cookieNameForJWT,
	}

	e := server.GetEcho()
	e.Use(goHttpEcho.CookieToHeaderMiddleware(yourService.jwtCookieName, l))
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins:     []string{"https://golux.lausanne.ch", "http://localhost:3000"},
		AllowMethods:     []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
		AllowCredentials: true,
	}))
	e.GET("/readiness", server.GetReadinessHandler(func(info string) bool {
		ver, err := db.GetVersion(ctx)
		if err != nil {
			l.Error("Error getting db version", "error", err)
			return false
		}
		l.Debug("Connected to DB", "dbVersion", ver)
		return true
	}, "Connection to DB"))
	e.GET("/health", server.GetHealthHandler(func(info string) bool {
		// you decide what makes you ready, may be it is the connection to the database
		getVersion, err := db.GetVersion(ctx)
		if err != nil {
			l.Error("Error getting db version", "error", err)
			return false
		}
		l.Debug("health check ok", "info", info, "dbVersion", getVersion)
		return true
	}, "Connection to DB"))

	e.GET("/goAppInfo", server.GetAppInfoHandler())
	e.POST(jwtAuthUrl, yourService.login)
	// Call the DevRoutes function conditionally
	// This line will only compile if the 'dev' build tag is active.
	// Conditional compilation of dev routes

	if IsDevBuild {
		l.Info("Attempting to register dev routes...")
		DevRoutes(e, &yourService, jwtAuthUrl)
	}

	r := server.GetRestrictedGroup()
	r.Use(goHttpEcho.CookieToHeaderMiddleware(yourService.jwtCookieName, l))
	r.GET(jwtStatusUrl, yourService.GetStatus)

	geoStore := geoTree.GetStorageInstanceOrPanic(ctx, "pgx", db, l)
	geoTreeService := geoTree.Service{
		Log:              l,
		DbConn:           db,
		Store:            geoStore,
		Server:           server,
		Authorizer:       nil,
		ListDefaultLimit: 50,
	}

	var areWeInProduction bool
	val, ok := os.LookupEnv("ENV_IS_PROD")
	if !ok || strings.TrimSpace(val) == "" {
		areWeInProduction = false
	}
	areWeInProduction = strings.ToUpper(val) == "TRUE"
	if areWeInProduction {
		l.Warn("areWeInProduction is TRUE =>PROD")
		geoTreeService.Authorizer = geoTree.NewLiveAuthorizer()
	} else {
		l.Warn("areWeInProduction is FALSE => DEV")
		mockAuth := &geoTree.MockAuthorizer{AllowBypass: true}
		geoTreeService.Authorizer = mockAuth
	}

	geoTree.RegisterHandlers(r, &geoTreeService)

	err = server.StartServer()
	if err != nil {
		logFatalf(l, "💥💥 error doing server.StartServer", "error", err)
	}
}

package main

import (
	"embed"
	"errors"
	"fmt"
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
	"log"
	"net/http"
	"runtime"
	"strings"
)

const (
	defaultPort                  = 8080
	defaultDBPort                = 5432
	defaultDBIp                  = "127.0.0.1"
	defaultDBSslMode             = "prefer"
	defaultRestrictedUrlBasePath = "/goapi/v1"
	defaultWebRootDir            = "geoTreeTableFront/dist/"
	defaultSqlDbMigrationsPath   = "db/migrations"
	defaultAdminUser             = "goadmin"
	defaultAdminEmail            = "goadmin@yourdomain.org"
	defaultAdminId               = 960901
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
	Logger golog.MyLogger
	//Store       Storage
	dbConn database.DB
	server *goHttpEcho.Server
}

// login is just a trivial stupid example to test this server
// you should use the jwt token returned from LoginUser  in github.com/lao-tseu-is-alive/go-cloud-k8s-user-group'
// and share the same secret with the above component
func (s Service) login(ctx echo.Context) error {
	s.Logger.TraceHttpRequest("login", ctx.Request())
	uLogin := new(UserLogin)
	login := ctx.FormValue("login")
	passwordHash := ctx.FormValue("hashed")
	s.Logger.Debug("login: %s, hash: %s ", login, passwordHash)
	// maybe it was not a form but a fetch data post
	if len(strings.Trim(login, " ")) < 1 {
		if err := ctx.Bind(uLogin); err != nil {
			return echo.NewHTTPError(http.StatusBadRequest, "invalid user login or json format in request body")
		}
	} else {
		uLogin.Username = login
		uLogin.PasswordHash = passwordHash
	}
	s.Logger.Debug("About to check username: %s , password: %s", uLogin.Username, uLogin.PasswordHash)
	if s.server.Authenticator.AuthenticateUser(uLogin.Username, uLogin.PasswordHash) {
		userInfo, err := s.server.Authenticator.GetUserInfoFromLogin(login)
		if err != nil {
			errGetUInfFromLogin := fmt.Sprintf("Error getting user info from login: %v", err)
			s.Logger.Error(errGetUInfFromLogin)
			return ctx.JSON(http.StatusInternalServerError, errGetUInfFromLogin)
		}
		token, err := s.server.JwtCheck.GetTokenFromUserInfo(userInfo)
		if err != nil {
			errGetUInfFromLogin := fmt.Sprintf("Error getting jwt token from user info: %v", err)
			s.Logger.Error(errGetUInfFromLogin)
			return ctx.JSON(http.StatusInternalServerError, errGetUInfFromLogin)
		}
		// Prepare the response
		response := map[string]string{
			"token": token.String(),
		}
		s.Logger.Info("LoginUser(%s) successful login", login)
		return ctx.JSON(http.StatusOK, response)
	} else {
		return ctx.JSON(http.StatusUnauthorized, "username not found or password invalid")
	}
}

func (s Service) GetStatus(ctx echo.Context) error {
	s.Logger.TraceHttpRequest("GetStatus", ctx.Request())
	// get the current user from JWT TOKEN
	claims := s.server.JwtCheck.GetJwtCustomClaimsFromContext(ctx)
	currentUserId := claims.User.UserId
	s.Logger.Info("in GetStatus : currentUserId: %d", currentUserId)
	// you can check if the user is not active anymore and RETURN 401 Unauthorized
	//if !s.Store.IsUserActive(currentUserId) {
	//	return echo.NewHTTPError(http.StatusUnauthorized, "current calling user is not active anymore")
	//}
	return ctx.JSON(http.StatusOK, claims)
}

func main() {
	l, err := golog.NewLogger("zap", golog.DebugLevel, version.APP)
	if err != nil {
		log.Fatalf("💥💥 error log.NewLogger error: %v'\n", err)
	}
	l.Info("🚀🚀 Starting:'%s', v%s, rev:%s, build:%v from: %s", version.APP, version.VERSION, version.REVISION, version.BuildStamp, version.REPOSITORY)

	dbDsn := config.GetPgDbDsnUrlFromEnvOrPanic(defaultDBIp, defaultDBPort, tools.ToSnakeCase(version.APP), version.AppSnake, defaultDBSslMode)
	db, err := database.GetInstance("pgx", dbDsn, runtime.NumCPU(), l)
	if err != nil {
		l.Fatal("💥💥 error doing database.GetInstance(pgx ...) error: %v", err)
	}
	defer db.Close()

	dbVersion, err := db.GetVersion()
	if err != nil {
		l.Fatal("💥💥 error doing dbConn.GetVersion() error: %v", err)
	}
	l.Info("connected to db version : %s", dbVersion)

	// checking metadata information
	metadataService := metadata.Service{Log: l, Db: db}
	metadataService.CreateMetadataTableOrFail()
	found, ver := metadataService.GetServiceVersionOrFail(version.APP)
	if found {
		l.Info("service %s was found in metadata with version: %s", version.APP, ver)
	} else {
		l.Info("service %s was not found in metadata", version.APP)
	}
	metadataService.SetServiceVersionOrFail(version.APP, version.VERSION)

	// https://github.com/golang-migrate/migrate
	d, err := iofs.New(sqlMigrations, defaultSqlDbMigrationsPath)
	if err != nil {
		l.Fatal("💥💥 error doing iofs.New for db migrations  error: %v\n", err)
	}
	m, err := migrate.NewWithSourceInstance("iofs", d, strings.Replace(dbDsn, "postgres", "pgx5", 1))
	if err != nil {
		l.Fatal("💥💥 error doing migrate.NewWithSourceInstance(iofs, dbURL:%s)  error: %v\n", dbDsn, err)
	}

	err = m.Up()
	if err != nil {
		//if err == m.
		if !errors.Is(err, migrate.ErrNoChange) {
			l.Fatal("💥💥 error doing migrate.Up error: %v\n", err)
		}
	}

	// Get the ENV JWT_AUTH_URL value
	jwtAuthUrl := config.GetJwtAuthUrlFromEnvOrPanic()

	myVersionReader := goHttpEcho.NewSimpleVersionReader(version.APP, version.VERSION, version.REPOSITORY, jwtAuthUrl)
	// Create a new JWT checker
	myJwt := goHttpEcho.NewJwtChecker(
		config.GetJwtSecretFromEnvOrPanic(),
		config.GetJwtIssuerFromEnvOrPanic(),
		version.APP,
		config.GetJwtContextKeyFromEnvOrPanic(),
		config.GetJwtDurationFromEnvOrPanic(60),
		l)
	// Create a new Authenticator with a simple admin user
	myAuthenticator := goHttpEcho.NewSimpleAdminAuthenticator(&goHttpEcho.UserInfo{
		UserId:     config.GetAdminIdFromEnvOrPanic(defaultAdminId),
		ExternalId: config.GetAdminExternalIdFromEnvOrPanic(9999999),
		Name:       "NewSimpleAdminAuthenticator_Admin",
		Email:      config.GetAdminEmailFromEnvOrPanic(defaultAdminEmail),
		Login:      config.GetAdminUserFromEnvOrPanic(defaultAdminUser),
		IsAdmin:    false,
		Groups:     []int{1}, // this is the group id of the global_admin group
	},

		config.GetAdminPasswordFromEnvOrPanic(),
		myJwt)

	server := goHttpEcho.CreateNewServerFromEnvOrFail(
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

	e := server.GetEcho()
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"https://golux.lausanne.ch", "http://localhost:3000"},
		AllowMethods: []string{http.MethodGet, http.MethodPut, http.MethodPost, http.MethodDelete},
	}))
	e.GET("/readiness", server.GetReadinessHandler(func(info string) bool {
		ver, err := db.GetVersion()
		if err != nil {
			l.Error("Error getting db version : %v", err)
			return false
		}
		l.Info("Connected to DB version : %s", ver)
		return true
	}, "Connection to DB"))
	e.GET("/health", server.GetHealthHandler(func(info string) bool {
		// you decide what makes you ready, may be it is the connection to the database
		getVersion, err := db.GetVersion()
		if err != nil {
			l.Error("Error getting db version : %v", err)
			return false
		}
		l.Info("%s DB version : %s", info, getVersion)
		return true
	}, "Connection to DB"))
	yourService := Service{
		Logger: l,
		dbConn: db,
		server: server,
	}
	e.GET("/goAppInfo", server.GetAppInfoHandler())
	e.POST(jwtAuthUrl, yourService.login)
	r := server.GetRestrictedGroup()
	r.GET("/status", yourService.GetStatus)

	geoStore := geoTree.GetStorageInstanceOrPanic("pgx", db, l)

	// now with restricted group reference you can register your secured handlers defined in OpenApi things.yaml
	thingService := geoTree.Service{
		Log:              l,
		DbConn:           db,
		Store:            geoStore,
		Server:           server,
		ListDefaultLimit: 50,
	}

	geoTree.RegisterHandlers(r, &thingService)

	err = server.StartServer()
	if err != nil {
		l.Fatal("💥💥 error doing server.StartServer error: %v'\n", err)
	}
}

package main

import (
	"crypto/sha256"
	"crypto/tls"
	"crypto/x509"
	"encoding/json"
	"fmt"
	"github.com/labstack/echo/v4"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/config"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/database"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/gohttpclient"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/golog"
	"github.com/lao-tseu-is-alive/go-cloud-k8s-common-libs/pkg/tools"
	"github.com/lao-tseu-is-alive/go-geo-tree-table/pkg/geoTree"
	"github.com/lao-tseu-is-alive/go-geo-tree-table/pkg/version"
	"github.com/stretchr/testify/assert"
	"io"
	"net/http"
	"net/url"
	"runtime"
	"strings"
	"sync"
	"testing"
	"time"
)

const (
	DEBUG                           = false
	assertCorrectStatusCodeExpected = "expected status code should be returned"
	urlGeoTree                      = "/geoTree"
	newGeoTreeId                    = "3999971f-53d7-4eb6-8898-97f257ea5f27"
	urlNewGeoTreeId                 = "/geoTree/" + newGeoTreeId
	bodyIdNewGeoTree                = "\"id\":\"" + newGeoTreeId + "\""
)

type testStruct struct {
	name                         string
	contentType                  string
	wantStatusCode               int
	wantBody                     string
	paramKeyValues               map[string]string
	httpMethod                   string
	url                          string
	useFormUrlencodedContentType bool
	useJwtToken                  bool
	body                         string
}

var exampleGeoTree = fmt.Sprintf(`
{
    "id": "%s",
    "cada_id": 12345,
    "cada_code": 678,
    "pos_east": 2537607.64,
    "pos_north": 1152609.12,
    "pos_altitude": 500.5,
    "tree_circumference_cm": 120,
    "tree_crown_m": 5,
    "cada_tree_type": "Oak",
    "cada_date": "2025-06-13T01:01:01+07:00",
    "cada_comment": "A majestic oak tree near the park",
    "description": "Healthy tree with wide canopy",
    "created_by": 999999,
    "deleted": false
}
`, newGeoTreeId)

var exampleGeoTreeUpdate = fmt.Sprintf(`
{
    "id": "%s",
    "cada_id": 12345,
    "cada_code": 678,
    "pos_east": 2537607.64,
    "pos_north": 1152609.12,
    "pos_altitude": 500.5,
    "tree_circumference_cm": 125,
    "tree_crown_m": 6,
    "cada_tree_type": "Oak",
    "cada_date": "2025-06-13T01:01:01+07:00",
    "cada_comment": "Updated: A majestic oak tree near the park with new measurements",
    "description": "Healthy tree with wider canopy",
    "created_by": 999999,
    "deleted": false
}
`, newGeoTreeId)

var exampleGeoTreeGoelandThingId = fmt.Sprintf(`
{
    "id": "%s",
    "goeland_thing_id": 123,
    "goeland_thing_saved_by": 999999
}
`, newGeoTreeId)

func MakeHttpRequest(method, url, sendBody, token string, caCert []byte, l golog.MyLogger, defaultReadTimeout time.Duration) (string, error) {
	var bearer = "Bearer " + token
	req, err := http.NewRequest(method, url, strings.NewReader(sendBody))
	if err != nil {
		l.Error("MakeHttpRequest: Error creating request.\n[ERROR] - %v", err)
		return "", err
	}
	req.Header.Add("Authorization", bearer)
	if method == http.MethodPost || method == http.MethodPut {
		if strings.Contains(url, "setGoelandThingId") {
			req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		} else {
			req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
		}
	}
	caCertPool := x509.NewCertPool()
	caCertPool.AppendCertsFromPEM(caCert)
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{
			RootCAs: caCertPool,
		},
	}
	client := &http.Client{
		Transport: tr,
		Timeout:   defaultReadTimeout,
	}
	resp, err := client.Do(req)
	if err != nil {
		l.Error("MakeHttpRequest: Error on response.\n[ERROR] - %v", err)
		return "", err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			l.Error("MakeHttpRequest: Error on Body.Close().\n[ERROR] - %v", err)
		}
	}(resp.Body)
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		l.Error("MakeHttpRequest: Error while reading the response bytes: %v", err)
		return "", err
	}
	return string(body), nil
}

func TestMainExec(t *testing.T) {
	prefix := fmt.Sprintf("%s_TESTING ", version.APP)
	l, err := golog.NewLogger("zap", golog.DebugLevel, prefix)
	if err != nil {
		t.Fatalf("### ERROR: golog.NewLogger failed: %v", err)
	}
	listenPort := config.GetPortFromEnvOrPanic(defaultPort)
	listenAddr := fmt.Sprintf("http://localhost:%d", listenPort)
	fmt.Printf("INFO: 'Will start HTTP server listening on port %s'\n", listenAddr)

	// Get the ENV JWT_AUTH_URL value
	jwtAuthUrl := config.GetJwtAuthUrlFromEnvOrPanic()
	urlLogin := fmt.Sprintf("%s", jwtAuthUrl)

	// Common messages
	nameCannotBeEmpty := fmt.Sprintf(geoTree.FieldCannotBeEmpty, "CadaComment")

	// Set local admin user for test
	adminUsername := config.GetAdminUserFromEnvOrPanic("goadmin")
	adminPassword := config.GetAdminPasswordFromEnvOrPanic()
	h := sha256.New()
	h.Write([]byte(adminPassword))
	adminPasswordHash := fmt.Sprintf("%x", h.Sum(nil))
	formLogin := make(url.Values)
	formLogin.Set("login", adminUsername)
	formLogin.Set("hashed", adminPasswordHash)

	// Preparing for testing an invalid authentication
	formLoginWrong := make(url.Values)
	formLoginWrong.Set("login", adminUsername)
	formLoginWrong.Set("pass", "anObviouslyWrongPass")

	getValidToken := func() string {
		req, err := http.NewRequest(http.MethodPost, listenAddr+urlLogin, strings.NewReader(formLogin.Encode()))
		if err != nil {
			t.Fatalf("### getValidToken: Problem creating request: %v", err)
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			fmt.Printf("### getValidToken: Problem requesting JWT TOKEN 💥💥 ERROR: %v\n%+v", err, resp)
			t.Fatal(err)
		}
		defer resp.Body.Close()
		receivedJson, err := io.ReadAll(resp.Body)
		if err != nil {
			fmt.Printf("### getValidToken: Problem reading JWT TOKEN 💥💥 ERROR: %v\n%+v", err, resp)
			t.Fatal(err)
		}
		fmt.Printf("getValidToken: TOKEN retrieved 💡👉 status: %v, response.Body:\n%s\n", resp.StatusCode, string(receivedJson))
		type JwtToken struct {
			TOKEN string `json:"token"`
		}
		var myToken JwtToken
		err = json.Unmarshal(receivedJson, &myToken)
		if err != nil {
			fmt.Printf("### getValidToken: Problem Unmarshalling JWT TOKEN 💥💥 ERROR: %s\n", err)
			t.Fatal(err)
		}
		fmt.Printf("TOKEN=\"%s\"\n", myToken.TOKEN)
		return myToken.TOKEN
	}

	// Database setup
	dbDsn := config.GetPgDbDsnUrlFromEnvOrPanic(defaultDBIp, defaultDBPort, tools.ToSnakeCase(version.APP), version.AppSnake, defaultDBSslMode)
	db, err := database.GetInstance("pgx", dbDsn, runtime.NumCPU(), l)
	if err != nil {
		t.Fatalf("💥💥 error doing database.GetInstance(pgx ...): %v", err)
	}
	defer db.Close()

	// Checking database connection
	dbVersion, err := db.GetVersion()
	if err != nil {
		t.Fatalf("💥💥 error doing dbConn.GetVersion(): %v", err)
	}
	fmt.Printf("connected to db version: %s\n", dbVersion)

	// Check if cada_tree_position table exists and clean up test data
	existTable, err := db.GetQueryBool("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'cada_tree_position');")
	if err != nil {
		t.Fatalf("problem verifying if cada_tree_position exists in DB: %v", err)
	}
	if existTable {
		count, err := db.GetQueryInt("SELECT COUNT(*) FROM public.cada_tree_position WHERE id = $1;", newGeoTreeId)
		if err != nil {
			t.Fatalf("problem during cleanup before test DB: %v", err)
		}
		if count > 0 {
			fmt.Printf("This Id(%v) exists, will cleanup before running test\n", newGeoTreeId)
			db.ExecActionQuery("DELETE FROM public.cada_tree_position WHERE id=$1", newGeoTreeId)
		}
	}

	// Define test cases
	tests := []testStruct{
		{
			name:                         "GET / should return HTML content",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "<html",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodGet,
			url:                          "/",
			useFormUrlencodedContentType: false,
			useJwtToken:                  false,
			body:                         "",
		},
		{
			name:                         "POST /login with valid credentials should return a JWT token",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "token",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPost,
			url:                          urlLogin,
			useFormUrlencodedContentType: true,
			useJwtToken:                  false,
			body:                         formLogin.Encode(),
		},
		{
			name:                         "POST /login with invalid credentials should return an error",
			wantStatusCode:               http.StatusUnauthorized,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "username not found or password invalid",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPost,
			url:                          urlLogin,
			useFormUrlencodedContentType: true,
			useJwtToken:                  false,
			body:                         formLoginWrong.Encode(),
		},
		{
			name:                         "GET /geoTree without JWT token should return an error",
			wantStatusCode:               http.StatusUnauthorized,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "Authorization header missing",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + urlGeoTree,
			useFormUrlencodedContentType: false,
			useJwtToken:                  false,
			body:                         "",
		},
		{
			name:                         "POST /geoTree with valid JWT token should create a new GeoTree",
			wantStatusCode:               http.StatusCreated,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     bodyIdNewGeoTree,
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPost,
			url:                          defaultRestrictedUrlBasePath + urlGeoTree,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         exampleGeoTree,
		},
		{
			name:                         "POST /geoTree with existing id should return error",
			wantStatusCode:               http.StatusBadRequest,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "already exist",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPost,
			url:                          defaultRestrictedUrlBasePath + urlGeoTree,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         exampleGeoTree,
		},
		{
			name:                         "GET /geoTree with valid JWT token should return a list of GeoTrees",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     bodyIdNewGeoTree,
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + urlGeoTree + "?limit=1&offset=0&created_by=999999",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "GET /geoTree/count should return the number of GeoTrees",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "1",
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + urlGeoTree + "/count?created_by=999999",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "GET /geoTree/geojson should return GeoJSON",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     bodyIdNewGeoTree,
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + urlGeoTree + "/geojson?created_by=999999",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "GET /geoTree with specific id should return the GeoTree",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     bodyIdNewGeoTree,
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + urlNewGeoTreeId,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "GET /geoTreeByPosition should return GeoTrees by position",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     bodyIdNewGeoTree,
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + "/geoTreeByPosition?pos_east=2537607.64&pos_north=1152609.12&radius=10",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "GET /geoTreeByPosition should return empty list of GeoTrees if position is not near one",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "[]",
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + "/geoTreeByPosition?pos_east=2547607.64&pos_north=1152609.12&radius=10",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "GET /geoTree with non-existing id should return StatusNotFound",
			wantStatusCode:               http.StatusNotFound,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "does not exist",
			paramKeyValues:               make(map[string]string),
			httpMethod:                   http.MethodGet,
			url:                          defaultRestrictedUrlBasePath + "/geoTree/11111111-4444-5555-6666-777777777777",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "PUT /geoTree with existing id but empty cada_comment should return bad request",
			wantStatusCode:               http.StatusBadRequest,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     nameCannotBeEmpty,
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPut,
			url:                          defaultRestrictedUrlBasePath + urlNewGeoTreeId,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         fmt.Sprintf(`{"id": "%s", "cada_id": 12345, "cada_code": 678, "pos_east": 2537607.64, "pos_north": 1152609.12, "cada_date": "2025-06-13T01:01:01+07:00", "cada_comment": "", "created_by": 999999}`, newGeoTreeId),
		},
		{
			name:                         "PUT /geoTree with existing id should update the GeoTree",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "\"cada_comment\":\"Updated: A majestic oak",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPut,
			url:                          defaultRestrictedUrlBasePath + urlNewGeoTreeId,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         exampleGeoTreeUpdate,
		},
		{
			name:                         "PUT /geoTree with non-existing id should return StatusNotFound",
			wantStatusCode:               http.StatusNotFound,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "does not exist",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPut,
			url:                          defaultRestrictedUrlBasePath + "/geoTree/11111111-4444-5555-6666-777777777777",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         exampleGeoTreeUpdate,
		},
		{
			name:                         "PUT /geoTree/setGoelandThingId with existing id should update GoelandThingId",
			wantStatusCode:               http.StatusOK,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "\"goeland_thing_id\":123",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPut,
			url:                          defaultRestrictedUrlBasePath + "/geoTree/setGoelandThingId/" + newGeoTreeId,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         exampleGeoTreeGoelandThingId,
		},
		{
			name:                         "PUT /geoTree/setGoelandThingId with non-existing id should return StatusNotFound",
			wantStatusCode:               http.StatusNotFound,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "does not exist",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodPut,
			url:                          defaultRestrictedUrlBasePath + "/geoTree/setGoelandThingId/11111111-4444-5555-6666-777777777777",
			useFormUrlencodedContentType: true,
			useJwtToken:                  true,
			body:                         exampleGeoTreeGoelandThingId,
		},
		{
			name:                         "DELETE /geoTree with existing id should return StatusNoContent",
			wantStatusCode:               http.StatusNoContent,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodDelete,
			url:                          defaultRestrictedUrlBasePath + urlNewGeoTreeId,
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
		{
			name:                         "DELETE /geoTree with non-existing id should return StatusNotFound",
			wantStatusCode:               http.StatusNotFound,
			contentType:                  MIMEHtmlCharsetUTF8,
			wantBody:                     "does not exist",
			paramKeyValues:               make(map[string]string, 0),
			httpMethod:                   http.MethodDelete,
			url:                          defaultRestrictedUrlBasePath + "/geoTree/11111111-4444-5555-6666-777777777777",
			useFormUrlencodedContentType: false,
			useJwtToken:                  true,
			body:                         "",
		},
	}

	// Start main in its own goroutine
	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		main()
	}()
	gohttpclient.WaitForHttpServer(listenAddr, 1*time.Second, 10)

	// Get a valid JWT token
	var bearer = "Bearer " + getValidToken()

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			r, err := http.NewRequest(tt.httpMethod, listenAddr+tt.url, strings.NewReader(tt.body))
			if err != nil {
				t.Fatalf("### %s: Problem creating request: %v", tt.name, err)
			}
			if tt.useFormUrlencodedContentType {
				r.Header.Set("Content-Type", "application/x-www-form-urlencoded")
			} else if tt.httpMethod == http.MethodPost || tt.httpMethod == http.MethodPut {
				r.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
			}
			if tt.useJwtToken {
				r.Header.Add("Authorization", bearer)
			}
			if DEBUG {
				fmt.Printf("### %s: will try %s on %s\n", tt.name, r.Method, r.URL)
			}
			resp, err := http.DefaultClient.Do(r)
			if err != nil {
				fmt.Printf("### %s: GOT ERROR: %v\n%+v", tt.name, err, resp)
				t.Fatal(err)
			}
			defer resp.Body.Close()
			assert.Equal(t, tt.wantStatusCode, resp.StatusCode, assertCorrectStatusCodeExpected)
			receivedJson, _ := io.ReadAll(resp.Body)
			if DEBUG {
				fmt.Printf("WANTED   :%T - %#v\n", tt.wantBody, tt.wantBody)
				fmt.Printf("RECEIVED :%T - %#v\n", receivedJson, string(receivedJson))
			}
			assert.Contains(t, string(receivedJson), tt.wantBody, "Response should contain what was expected.")
		})
	}
}

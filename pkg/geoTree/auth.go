package geoTree

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"
)

const (
	authBaseUrl   = "https://soi-golux.lausanne.ch/goeland/gestion_spec/g_user_ingroup.php"
	securityGroup = "cadageomtree"
)

// Authorizer is an interface for checking user authorization.
// This allows for mocking in tests and using a real implementation in production.
type Authorizer interface {
	IsUserAuthorized(ctx context.Context, userLogin string) (bool, error)
}

// LiveAuthorizer is the implementation of Authorizer that makes a real HTTP call.
type LiveAuthorizer struct {
	Client      *http.Client
	AuthBaseURL string
}

// NewLiveAuthorizer creates a new instance of LiveAuthorizer.
func NewLiveAuthorizer() *LiveAuthorizer {
	return &LiveAuthorizer{
		Client: &http.Client{
			Timeout: 10 * time.Second,
		},
		AuthBaseURL: authBaseUrl,
	}
}

// AuthResponse defines the structure of the JSON response from the authorization service.
type AuthResponse struct {
	IdEmploye      int    `json:"id_employe"`
	NomEmploye     string `json:"nom_employe"`
	PrenomEmploye  string `json:"prenom_employe"`
	LoginEmploye   string `json:"login_employe"`
	BActif         int    `json:"bactif"`
	BSexem         int    `json:"bsexem"`
	GroupeSecurite string `json:"groupesecurite"`
	BinGroupe      int    `json:"bingroupe"`
}

// IsUserAuthorized checks if a user is part of a specific security group.
// It makes an external HTTP GET request to the authorization service.
func (a *LiveAuthorizer) IsUserAuthorized(ctx context.Context, userLogin string) (bool, error) {
	// 1. Construct the request URL with the necessary query parameters.
	// les valeurs sont échappées pour éviter toute injection dans la query string.
	authUrl := fmt.Sprintf("%s?userlogin=%s&groupesecurite=%s",
		a.AuthBaseURL, url.QueryEscape(userLogin), url.QueryEscape(securityGroup))

	// 2. Perform the HTTP GET request, bound to the caller context.
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, authUrl, nil)
	if err != nil {
		return false, fmt.Errorf("error creating authorization request: %w", err)
	}
	resp, err := a.Client.Do(req)
	if err != nil {
		return false, fmt.Errorf("error performing authorization request: %w", err)
	}
	defer resp.Body.Close()

	// 3. Check for a successful HTTP status code.
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("authorization service returned non-200 status: %d", resp.StatusCode)
	}

	// 4. Decode the JSON response into our struct.
	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return false, fmt.Errorf("error decoding authorization response: %w", err)
	}

	// 5. The core authorization logic: check if 'bingroupe' is 1.
	return authResp.BinGroupe == 1, nil
}

// MockAuthorizer is a mock implementation of the Authorizer interface for testing.
type MockAuthorizer struct {
	// AllowBypass can be set to false to test unauthorized cases.
	AllowBypass bool
}

// IsUserAuthorized for MockAuthorizer always returns AllowBypass, bypassing the real check.
func (m *MockAuthorizer) IsUserAuthorized(_ context.Context, userLogin string) (bool, error) {
	// In tests, we can simply return true to bypass the check.
	// We could also add logic here to test failure scenarios.
	return m.AllowBypass, nil
}

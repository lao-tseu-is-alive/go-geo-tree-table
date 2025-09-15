package geoTree

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

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

const (
	authBaseUrl   = "https://soi-golux.lausanne.ch/goeland/gestion_spec/g_user_ingroup.php"
	securityGroup = "cadageomtree"
)

// IsUserAuthorized checks if a user is part of a specific security group.
// It makes an external HTTP GET request to the authorization service.
func IsUserAuthorized(userLogin string) (bool, error) {
	// 1. Construct the request URL with the necessary query parameters.
	url := fmt.Sprintf("%s?userlogin=%s&groupesecurite=%s", authBaseUrl, userLogin, securityGroup)

	// 2. Create a new HTTP client with a reasonable timeout to prevent hanging requests.
	// This is a best practice for production-grade services.
	client := &http.Client{
		Timeout: 10 * time.Second,
	}

	// 3. Perform the HTTP GET request.
	resp, err := client.Get(url)
	if err != nil {
		return false, fmt.Errorf("error performing authorization request: %w", err)
	}
	defer resp.Body.Close()

	// 4. Check for a successful HTTP status code.
	if resp.StatusCode != http.StatusOK {
		return false, fmt.Errorf("authorization service returned non-200 status: %d", resp.StatusCode)
	}

	// 5. Decode the JSON response into our struct.
	var authResp AuthResponse
	if err := json.NewDecoder(resp.Body).Decode(&authResp); err != nil {
		return false, fmt.Errorf("error decoding authorization response: %w", err)
	}

	// 6. The core authorization logic: check if 'bingroupe' is 1.
	return authResp.BinGroupe == 1, nil
}

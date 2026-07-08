package geoTree

import "testing"

func floatPtr(v float64) *float64 { return &v }

func TestGeoTree_Validate(t *testing.T) {
	// Coordonnées valides de référence (au centre des bornes).
	validEast := 2537607.64
	validNorth := 1152609.12

	tests := []struct {
		name    string
		tree    GeoTree
		wantErr bool
	}{
		{
			name:    "valid without altitude",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth},
			wantErr: false,
		},
		{
			name:    "valid with altitude in range",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth, PosAltitude: floatPtr(500.5)},
			wantErr: false,
		},
		{
			name:    "altitude zero treated as null",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth, PosAltitude: floatPtr(0)},
			wantErr: false,
		},
		{
			name:    "altitude at lower bound",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth, PosAltitude: floatPtr(MinPosAltitude)},
			wantErr: false,
		},
		{
			name:    "altitude at upper bound",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth, PosAltitude: floatPtr(MaxPosAltitude)},
			wantErr: false,
		},
		{
			name:    "altitude below min",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth, PosAltitude: floatPtr(369.9)},
			wantErr: true,
		},
		{
			name:    "altitude above max",
			tree:    GeoTree{PosEast: validEast, PosNorth: validNorth, PosAltitude: floatPtr(950.1)},
			wantErr: true,
		},
		{
			name:    "east below min",
			tree:    GeoTree{PosEast: MinPosEast - 1, PosNorth: validNorth},
			wantErr: true,
		},
		{
			name:    "east above max",
			tree:    GeoTree{PosEast: MaxPosEast + 1, PosNorth: validNorth},
			wantErr: true,
		},
		{
			name:    "north below min",
			tree:    GeoTree{PosEast: validEast, PosNorth: MinPosNorth - 1},
			wantErr: true,
		},
		{
			name:    "north above max",
			tree:    GeoTree{PosEast: validEast, PosNorth: MaxPosNorth + 1},
			wantErr: true,
		},
		{
			name:    "east and north at bounds",
			tree:    GeoTree{PosEast: MinPosEast, PosNorth: MaxPosNorth},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := tt.tree.Validate()
			if (err != nil) != tt.wantErr {
				t.Errorf("Validate() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

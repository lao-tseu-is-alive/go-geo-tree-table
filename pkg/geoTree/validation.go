package geoTree

import "fmt"

// Bornes géographiques et d'altitude acceptées pour un arbre (coordonnées MN95 / EPSG:2056).
// Ces bornes doivent rester cohérentes avec la validation de l'import CSV côté frontend
// on utilise ici des valeurs pour la region lausannoise
// (voir geoTreeTableFront/src/stores/geoTree.ts).
const (
	MinPosEast     = 2_531_000.0
	MaxPosEast     = 2_547_000.0
	MinPosNorth    = 1_149_000.0
	MaxPosNorth    = 1_161_000.0
	MinPosAltitude = 370.0
	MaxPosAltitude = 950.0
)

// ErrValueOutOfRange est le gabarit de message utilisé quand un champ position est hors bornes.
const ErrValueOutOfRange = "field %s must be between %g and %g, found %g"

// Validate vérifie que les coordonnées et l'altitude respectent les bornes attendues.
// pos_east et pos_north sont obligatoires et toujours contrôlés.
// pos_altitude est optionnel : une valeur nulle ou égale à 0 est considérée comme absente
// (pas d'altitude) et acceptée ; sinon elle doit être comprise entre MinPosAltitude et MaxPosAltitude.
func (g GeoTree) Validate() error {
	if g.PosEast < MinPosEast || g.PosEast > MaxPosEast {
		return fmt.Errorf(ErrValueOutOfRange, "pos_east", MinPosEast, MaxPosEast, g.PosEast)
	}
	if g.PosNorth < MinPosNorth || g.PosNorth > MaxPosNorth {
		return fmt.Errorf(ErrValueOutOfRange, "pos_north", MinPosNorth, MaxPosNorth, g.PosNorth)
	}
	if g.PosAltitude != nil && *g.PosAltitude != 0 {
		if *g.PosAltitude < MinPosAltitude || *g.PosAltitude > MaxPosAltitude {
			return fmt.Errorf(ErrValueOutOfRange, "pos_altitude", MinPosAltitude, MaxPosAltitude, *g.PosAltitude)
		}
	}
	return nil
}

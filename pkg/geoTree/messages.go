package geoTree

const (
	FieldCannotBeEmpty = "field %s cannot be empty or contain only spaces"
	FieldMinLengthIsN  = "field %s minimum length is %d"
	FoundNum           = ", found %d"
	// FunctionNReturnedNoResults et SelectFailedInNWithErrorE sont utilisés comme
	// message slog : le nom de la méthode et l'erreur sont passés en attributs
	// ("method", "error") et non plus via un format printf.
	FunctionNReturnedNoResults = "function returned no results"
	OnlyAdminCanManageThis     = "only admin user can manage this"
	SelectFailedInNWithErrorE  = "pgxscan select unexpectedly failed"
	ErrInvalidUUID             = "invalid UUID"
	ErrNoRowsAffectedByQuery   = "no rows affected by query"
	ErrInvalidSavedBy          = "geoTreeGoelandThingId.GoelandThingSavedBy has invalid value for UpdateGoelandThingId on id: %s"
)

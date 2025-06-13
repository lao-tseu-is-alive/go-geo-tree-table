package geoTree

const (
	FieldCannotBeEmpty           = "field %s cannot be empty or contain only spaces"
	FieldMinLengthIsN            = "field %s minimum length is %d"
	FoundNum                     = ", found %d"
	FunctionNReturnedNoResults   = "%s returned no results "
	OnlyAdminCanManageTypeThings = "only admin user can manage type thing"
	SelectFailedInNWithErrorE    = "pgxscan.Select unexpectedly failed in %s, error : %v"
	ErrInvalidUUID               = "invalid UUID"
	ErrNoRowsAffectedByQuery     = "no rows affected by query"
	ErrInvalidSavedBy            = "geoTreeGoelandThingId.GoelandThingSavedBy has invalid value for UpdateGoelandThingId on id: %s"
)

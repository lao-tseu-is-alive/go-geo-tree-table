CREATE TABLE IF NOT EXISTS public.cada_tree_position
(   -- using Postgres Native UUID v4 128bit https://www.postgresql.org/docs/14/datatype-uuid.html
    -- this choice allows to do client side generation of the id UUID v4
    -- https://shekhargulati.com/2022/06/23/choosing-a-primary-key-type-in-postgres/

    id                     uuid    not null
        constraint pk_cada_tree_position primary key default gen_random_uuid(),
    goeland_thing_id       integer,
    cada_id                integer                 not null,
    cada_code              integer                 not null,
    pos_east               double precision        not null,
    pos_north              double precision        not null,
    pos_altitude           double precision,
    tree_circumference_cm  integer,
    tree_crown_m           integer,
    cada_tree_type         text                    null,
    cada_date              date                    not null,
    cada_comment           text                    not null,
    description            text,
    created_at             timestamp default now() not null,
    created_by             integer                 not null,
    goeland_thing_saved_at timestamp,
    goeland_thing_saved_by integer,
    deleted                boolean default false   not null,
    deleted_at             timestamp,
    deleted_by             integer,
    geom                   geometry(POINT, 2056)   NOT NULL,
    EXCLUDE USING gist (geom WITH &&) WHERE (ST_DWithin(geom, geom, 0.1))
);
/*
The EXCLUDE USING gist (geom WITH &&) WHERE (ST_DWithin(geom, geom, 0.1))
ensures that no two rows can have geom points within 0.1 meters of each other.
ST_DWithin(geom, geom, 0.1) checks if two points are within 0.1 meters,
based on the SRID 2056 (Swiss coordinate system, where units are meters).
The && operator in the GiST index ensures efficient spatial overlap checks for the bounding boxes of the points.
The constraint prevents inserting or updating a row if its geom point is too close (within 0.1 meters) to an existing point.
 */
CREATE INDEX idx_cada_tree_position_geom_gist ON public.cada_tree_position USING gist (geom);

COMMENT ON TABLE cada_tree_position IS 'cada_tree_position is the main table to store the cadastre precise position of each trees in Lausanne';
COMMENT ON COLUMN cada_tree_position.goeland_thing_id IS ' is foreign key to an id of a goeland thing';
COMMENT ON COLUMN cada_tree_position.pos_east IS 'the east (x) coordinate of the position of this tree';
COMMENT ON COLUMN cada_tree_position.pos_north IS 'the north (y) coordinate of the position of this tree';
COMMENT ON COLUMN cada_tree_position.geom IS 'PostGIS geometry column storing the tree position as a POINT in SRID 2056';
CREATE OR REPLACE FUNCTION update_cada_tree_position_geom()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.geom := ST_SetSRID(ST_MakePoint(NEW.pos_east, NEW.pos_north), 2056);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_cada_tree_position_geom
    BEFORE INSERT OR UPDATE
    ON public.cada_tree_position
    FOR EACH ROW
EXECUTE FUNCTION update_cada_tree_position_geom();
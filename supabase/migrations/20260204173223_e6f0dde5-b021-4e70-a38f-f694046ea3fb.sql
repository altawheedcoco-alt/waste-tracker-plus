-- Rename osm_id column to source_id in industrial_facilities table
-- This removes the OpenStreetMap reference from the database schema

ALTER TABLE public.industrial_facilities 
RENAME COLUMN osm_id TO source_id;
-- Up Migration
-- Where an uploaded object is going, recorded when the upload starts.
--
-- Attaching a file took three calls from the client: create the object,
-- send the bytes, then release it onto an owning resource — and release
-- requires a clean scan, which only the worker sweep produces (every
-- five minutes, and only while an instance is alive, since the service
-- scales to zero). So a participant had to upload a photograph, wait an
-- unknown time, come back, and press a second button to actually attach
-- it. That asks somebody to do the platform's bookkeeping and to know
-- when a background job has run.
--
-- The destination is now part of the request that starts the upload, and
-- a clean scan releases the object onto it. The columns are nullable
-- because an upload with no destination stays legitimate: the existing
-- explicit release path is unchanged, and an object may be uploaded
-- before its owner knows where it belongs.
--
-- These are the INTENDED destination, deliberately named apart from
-- owning_resource_type/id. Those two mean the object is attached and
-- released; these mean somebody asked for it to be. Collapsing them
-- would make a quarantined file look attached.
ALTER TABLE storage_ops.stored_objects
  ADD COLUMN intended_owning_resource_type text,
  ADD COLUMN intended_owning_resource_id   text;

-- Both or neither: half a destination is not a destination.
ALTER TABLE storage_ops.stored_objects
  ADD CONSTRAINT stored_objects_intended_destination_complete
  CHECK ((intended_owning_resource_type IS NULL) = (intended_owning_resource_id IS NULL));

-- Down Migration
ALTER TABLE storage_ops.stored_objects
  DROP CONSTRAINT stored_objects_intended_destination_complete;
ALTER TABLE storage_ops.stored_objects
  DROP COLUMN intended_owning_resource_type,
  DROP COLUMN intended_owning_resource_id;

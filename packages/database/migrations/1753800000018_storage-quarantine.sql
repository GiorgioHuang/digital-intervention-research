-- Up Migration
-- Object-storage upload quarantine pipeline (Doc 14 §59, Doc 15 §58.4):
-- uploads stay quarantined until permission, size/type validation,
-- malware scan, checksum, classification and owning-resource assignment
-- are ALL complete. Object identifiers are opaque; the blob store is a
-- deterministic simulator (real vendor Pending External Approval).

CREATE SCHEMA IF NOT EXISTS storage_ops;

CREATE TABLE storage_ops.stored_objects (
  id                    text PRIMARY KEY,
  owner_participant_id  text NOT NULL,
  uploaded_by_actor_id  text NOT NULL,
  declared_content_type text NOT NULL,
  declared_size_bytes   bigint NOT NULL CHECK (declared_size_bytes > 0),
  checksum_sha256       text,
  object_state          text NOT NULL DEFAULT 'Pending Upload' CHECK (object_state IN
                          ('Pending Upload', 'Quarantined', 'Available', 'Rejected', 'Deleted')),
  scan_outcome          text CHECK (scan_outcome IS NULL OR scan_outcome IN
                          ('Clean', 'Malware Detected', 'Scan Failed')),
  rejection_reason      text,
  data_classification   text CHECK (data_classification IS NULL OR data_classification IN
                          ('Public', 'Internal', 'Private', 'Sensitive-Personal', 'Safety-Critical')),
  owning_resource_type  text,
  owning_resource_id    text,
  record_version        integer NOT NULL DEFAULT 1,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- Release gate (Doc 14 §59): Available requires EVERY step complete —
  -- clean scan, checksum, classification, owning resource. A failed or
  -- missing scan can never yield Available.
  CHECK (object_state <> 'Available' OR (
    scan_outcome = 'Clean'
    AND checksum_sha256 IS NOT NULL
    AND data_classification IS NOT NULL
    AND owning_resource_type IS NOT NULL
    AND owning_resource_id IS NOT NULL
  )),
  CHECK ((object_state = 'Rejected') = (rejection_reason IS NOT NULL))
);
CREATE INDEX stored_objects_owner_idx ON storage_ops.stored_objects (owner_participant_id, created_at);

-- Simulator blob store: content lives here only until a real object
-- store is approved. Quarantined bytes are never served to clients.
CREATE TABLE storage_ops.simulated_blobs (
  object_id  text PRIMARY KEY REFERENCES storage_ops.stored_objects (id),
  content    bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Down Migration
DROP TABLE storage_ops.simulated_blobs;
DROP TABLE storage_ops.stored_objects;
DROP SCHEMA storage_ops;

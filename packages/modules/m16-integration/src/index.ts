export * from './contracts/index.js';
export { createProviderSimulator, handleProviderCallback, signCallback } from './application/provider-adapter.js';
export {
  initiateUpload,
  completeUpload,
  scanObject,
  scanPendingObjects,
  releaseObject,
  getObjectStatus,
  assertObjectSendable,
  DEFAULT_STORAGE_CONFIG,
  EICAR_MARKER,
  SCAN_ERROR_MARKER,
  type StorageConfig,
  type StorageDeps,
  type StoredObjectStatus,
} from './application/storage-pipeline.js';

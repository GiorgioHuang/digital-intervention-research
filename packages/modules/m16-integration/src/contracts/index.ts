/**
 * M16 provider boundary (ADR-033/052): M16 owns adapters, callback
 * authentication, replay protection and provider references. It NEVER
 * writes M18 tables — canonical delivery state changes only through the
 * injected M18 delivery command port.
 */
export interface DeliveryCommandPort {
  recordDeliveryState(input: {
    messageId: string;
    deliveryState: 'Sent to Provider' | 'Provider Accepted' | 'Delivered' | 'Delivery Failed' | 'Delivery Unknown';
    provider?: string;
    providerReference?: string;
  }): Promise<void>;
}

export interface ProviderCallback {
  provider: string;
  providerReference: string;
  /** Provider-side raw status vocabulary (mapped by the ACL, ADR-124 config). */
  status: 'accepted' | 'delivered' | 'failed' | 'unknown';
  timestamp: string;
  nonce: string;
  signature: string;
}

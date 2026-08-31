import { Body, Controller, Inject, Ip, Optional, Post } from '@nestjs/common';
import {
  relayContactMessage,
  type ContactPayload,
  type ContactRelayConfig,
  type RelayOutcome,
} from './contact-relay.js';

export const CONTACT_RELAY = 'CONTACT_RELAY';

/**
 * How fast one address may send.
 *
 * In memory, and therefore per instance: this service runs up to three, so
 * the real ceiling is three times this. That is stated rather than glossed
 * — it is a brake on a person or a naive script, not a defence against
 * anybody who means it, and pretending otherwise is how a limit ends up
 * being relied on for something it cannot do. What it does buy is that the
 * one unauthenticated route here cannot be turned into an outbound request
 * amplifier by a single caller in a loop.
 */
const WINDOW_MS = 60_000;
const PER_WINDOW = 5;

@Controller()
export class ContactController {
  /**
   * Recent sends per address. Bounded by sweeping expired entries on every
   * call, so a stream of distinct addresses cannot grow it without limit —
   * an unauthenticated endpoint keyed on caller-controlled input is exactly
   * where an unbounded map becomes the vulnerability.
   */
  private readonly recent = new Map<string, number[]>();

  constructor(@Optional() @Inject(CONTACT_RELAY) private readonly relay?: ContactRelayConfig) {}

  private allow(who: string, now: number): boolean {
    for (const [key, times] of this.recent) {
      const kept = times.filter((t) => now - t < WINDOW_MS);
      if (kept.length === 0) this.recent.delete(key);
      else this.recent.set(key, kept);
    }
    const mine = this.recent.get(who) ?? [];
    if (mine.length >= PER_WINDOW) return false;
    this.recent.set(who, [...mine, now]);
    return true;
  }

  /**
   * The about screen's message box.
   *
   * The one route this platform answers without an actor, and it is safe
   * to be: it reads nothing, returns nothing about anybody, and touches no
   * record. It has to work signed out — somebody who cannot get in is
   * exactly who needs it.
   *
   * Always HTTP 200 with an outcome in the body, never a thrown status.
   * The error filter replaces the body of any HttpException with the
   * platform's error envelope, so a reason thrown as a status would be
   * written and never readable — a defect this codebase has already met on
   * `/ready`. The screen needs to tell "nothing was sent because this
   * deployment has no relay" apart from "it was not delivered, try again",
   * and those words only exist if they survive the filter.
   */
  @Post('contact')
  async send(@Body() body: ContactPayload, @Ip() ip: string): Promise<RelayOutcome> {
    if (!this.allow(ip || 'unknown', Date.now())) {
      return { ok: false, reason: 'delivery-failed' };
    }
    return relayContactMessage(body ?? { name: '', contact: '', message: '' }, this.relay);
  }
}

import { Body, Controller, Delete, Get, Inject, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { PlatformError } from '@platform/kernel';
import { issueNonce, nonceIsValid, type GoogleVerifier } from './google-token.js';
import { readCookie, SESSION_COOKIE } from './cookies.js';
import type { SessionStore } from './session-store.js';

export interface AuthSessionView {
  actorId: string;
  displayName: string;
  authStrength: string;
  /** Present when this account is also a participant on the platform. */
  participantId?: string;
  expiresAt: string;
}

export const AUTH_DEPS = Symbol('AUTH_DEPS');

export interface AuthDeps {
  verifier: GoogleVerifier;
  sessions: SessionStore;
  /**
   * Resolves the participant this account is, if it is one. The client used
   * to be told its participant identifier by the person signing in typing
   * it into a box — which is a thing no older adult should ever be asked to
   * do, and which the server has known all along.
   */
  findParticipantIdByAccount: (userAccountId: string) => Promise<string | undefined>;
  findDisplayName: (userAccountId: string) => Promise<string | undefined>;
  sessionSecret: string;
  clientId: string;
  /** Cookies are Secure except where the platform is served over plain HTTP. */
  secureCookies: boolean;
  stepUpMaxAgeSeconds: number;
  now?: () => number;
}

const credentialSchema = z.object({
  credential: z.string().min(1),
  nonce: z.string().min(1),
});

/**
 * Sign in with Google (ADR-104).
 *
 * The session lives in an HttpOnly cookie rather than anywhere JavaScript
 * can read. The platform's own pages never need to read it — the browser
 * attaches it — and the difference is that a cross-site scripting bug
 * anywhere on the origin stops being an account takeover for every signed-in
 * person and stays a bug on a page.
 */
@Controller('v1/auth')
export class AuthController {
  constructor(@Inject(AUTH_DEPS) private readonly deps: AuthDeps) {}

  /**
   * A nonce to hand to Google, so the token that comes back can be tied to
   * this sign-in attempt and to no other.
   */
  @Get('nonce')
  nonce(): { nonce: string; clientId: string } {
    // The client ID is not a secret — it ships in the page that renders
    // the Google button. Returning it here means one configured value on
    // the server rather than the same value configured twice, in two
    // places, where the second one can be wrong for a week.
    return {
      nonce: issueNonce(this.deps.sessionSecret, this.now()),
      clientId: this.deps.clientId,
    };
  }

  /**
   * Who this browser currently is. The session lives in an HttpOnly cookie,
   * so the page cannot read it and has to ask — which is the point: on a
   * reload the answer comes from the server that can actually check it,
   * rather than from whatever the last page left lying in local storage.
   */
  @Get('session')
  async current(@Req() req: Request): Promise<AuthSessionView> {
    const token = readCookie(req, SESSION_COOKIE);
    const session = token === undefined ? undefined : await this.deps.sessions.resolve(token);
    if (session === undefined) throw new PlatformError('AUTHENTICATION_REQUIRED', 'Not signed in');
    return this.view(session.userAccountId, session.authStrength, session.expiresAt);
  }

  @Post('session')
  async signIn(
    @Body() body: unknown,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthSessionView> {
    const parsed = credentialSchema.safeParse(body);
    if (!parsed.success) throw new PlatformError('VALIDATION_ERROR', 'A Google credential and nonce are required');
    if (!nonceIsValid(this.deps.sessionSecret, parsed.data.nonce, this.now())) {
      throw new PlatformError('AUTHENTICATION_REQUIRED', 'Sign-in took too long — please try again');
    }
    const identity = await this.deps.verifier.verify(parsed.data.credential, parsed.data.nonce);
    const session = await this.deps.sessions.signIn(identity, parsed.data.nonce);
    this.setCookie(res, session.token, session.expiresAt);
    return this.view(session.userAccountId, session.authStrength, session.expiresAt);
  }

  private async view(
    userAccountId: string,
    authStrength: string,
    expiresAt: Date,
  ): Promise<AuthSessionView> {
    const [participantId, displayName] = await Promise.all([
      this.deps.findParticipantIdByAccount(userAccountId),
      this.deps.findDisplayName(userAccountId),
    ]);
    return {
      actorId: userAccountId,
      displayName: displayName ?? '',
      authStrength,
      ...(participantId !== undefined ? { participantId } : {}),
      expiresAt: expiresAt.toISOString(),
    };
  }

  /**
   * Re-authentication in front of a consequential action — approving an
   * intervention version, deciding an export.
   *
   * Google's ID tokens carry no `amr`, so no token from a plain sign-in can
   * tell this platform that a second factor was used. What CAN be
   * established is that the person is at the keyboard right now: the client
   * runs the Google flow again with `prompt=login`, and the token that
   * comes back is only accepted if Google minted it seconds ago. That is
   * what step-up is for, and it does not require anybody to assert anything
   * about how their Google account is configured.
   */
  @Post('step-up')
  async stepUp(
    @Req() req: Request,
    @Body() body: unknown,
  ): Promise<{ authStrength: string }> {
    const token = readCookie(req, SESSION_COOKIE);
    if (token === undefined) throw new PlatformError('AUTHENTICATION_REQUIRED', 'Authentication required');
    const parsed = credentialSchema.safeParse(body);
    if (!parsed.success) throw new PlatformError('VALIDATION_ERROR', 'A Google credential and nonce are required');
    if (!nonceIsValid(this.deps.sessionSecret, parsed.data.nonce, this.now())) {
      throw new PlatformError('AUTHENTICATION_REQUIRED', 'Sign-in took too long — please try again');
    }
    const identity = await this.deps.verifier.verify(parsed.data.credential, parsed.data.nonce);

    // Freshness is the whole claim being made here. A token Google issued
    // an hour ago verifies perfectly and proves only that this person was
    // present an hour ago, which is not what the action is asking.
    const ageSeconds = Math.floor(this.now() / 1000) - identity.issuedAt;
    if (identity.issuedAt === 0 || ageSeconds > this.deps.stepUpMaxAgeSeconds) {
      throw new PlatformError('STEP_UP_AUTHENTICATION_REQUIRED', 'Please confirm it is you and try again');
    }
    const session = await this.deps.sessions.stepUp(token, identity);
    return { authStrength: session.authStrength };
  }

  @Delete('session')
  async signOut(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<{ signedOut: true }> {
    const token = readCookie(req, SESSION_COOKIE);
    if (token !== undefined) await this.deps.sessions.signOut(token);
    // Cleared whether or not a session was found: a cookie the server no
    // longer honours should not stay in the browser looking like one.
    res.clearCookie(SESSION_COOKIE, this.cookieOptions(undefined));
    return { signedOut: true };
  }

  private setCookie(res: Response, token: string, expiresAt: Date): void {
    res.cookie(SESSION_COOKIE, token, this.cookieOptions(expiresAt));
  }

  private cookieOptions(expiresAt: Date | undefined): Record<string, unknown> {
    return {
      httpOnly: true,
      secure: this.deps.secureCookies,
      // Lax, not None: this platform is never embedded in anybody else's
      // page, and Lax is what stops another site's form post from
      // arriving with this cookie attached.
      sameSite: 'lax' as const,
      path: '/',
      ...(expiresAt !== undefined ? { expires: expiresAt } : {}),
    };
  }

  private now(): number {
    return this.deps.now?.() ?? Date.now();
  }
}


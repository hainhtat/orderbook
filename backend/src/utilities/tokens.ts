import { createHash, randomBytes } from 'node:crypto';
import * as jose from 'jose';
import type { Env } from '../config/env.js';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

function parseDuration(ttl: string): string {
  return ttl;
}

export class TokenService {
  private secret: Uint8Array;

  constructor(private env: Env) {
    this.secret = new TextEncoder().encode(env.JWT_SECRET);
  }

  async signAccessToken(userId: string): Promise<string> {
    return new jose.SignJWT({ typ: 'access' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(this.env.JWT_ISSUER)
      .setAudience(this.env.JWT_AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(parseDuration(this.env.ACCESS_TOKEN_TTL))
      .sign(this.secret);
  }

  async signRefreshToken(userId: string, sessionId: string): Promise<string> {
    return new jose.SignJWT({ typ: 'refresh', sid: sessionId })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuer(this.env.JWT_ISSUER)
      .setAudience(`${this.env.JWT_AUDIENCE}-refresh`)
      .setIssuedAt()
      .setExpirationTime(parseDuration(this.env.REFRESH_TOKEN_TTL))
      .sign(this.secret);
  }

  async verifyAccessToken(token: string): Promise<{ userId: string }> {
    const { payload } = await jose.jwtVerify(token, this.secret, {
      issuer: this.env.JWT_ISSUER,
      audience: this.env.JWT_AUDIENCE,
      algorithms: ['HS256'],
    });
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') {
      throw new Error('Invalid token type');
    }
    return { userId: payload.sub };
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string; sessionId: string }> {
    const { payload } = await jose.jwtVerify(token, this.secret, {
      issuer: this.env.JWT_ISSUER,
      audience: `${this.env.JWT_AUDIENCE}-refresh`,
      algorithms: ['HS256'],
    });
    if (payload.typ !== 'refresh' || typeof payload.sub !== 'string' || typeof payload.sid !== 'string') {
      throw new Error('Invalid token type');
    }
    return { userId: payload.sub, sessionId: payload.sid };
  }

  hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  generateRefreshSessionId(): string {
    return randomBytes(16).toString('hex');
  }
}

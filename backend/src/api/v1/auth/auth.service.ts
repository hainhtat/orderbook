import type { PrismaClient, Shop, User } from '../../../../generated/client/index.js';
import { hashPassword, verifyPassword } from '../../../utilities/passwords.js';
import type { TokenService } from '../../../utilities/tokens.js';
import { AppError } from '../../../errors/app-error.js';
import { ErrorCodes } from '../../../errors/error-codes.js';

export type PublicUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthResult = {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
};

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, name: user.name };
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private tokens: TokenService,
  ) {}

  async register(input: { name: string; email: string; password: string }): Promise<AuthResult> {
    const passwordHash = await hashPassword(input.password);
    const user = await this.prisma.user.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        passwordHash,
      },
    });
    return this.issueTokens(user);
  }

  async login(input: { email: string; password: string }): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 401);
    }
    return this.issueTokens(user);
  }

  async verify(userId: string): Promise<{ user: PublicUser; shop: Shop | null }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401);
    }
    const membership = await this.prisma.shopMember.findFirst({
      where: { userId },
      include: { shop: true },
      orderBy: { shop: { createdAt: 'asc' } },
    });
    return { user: toPublicUser(user), shop: membership?.shop ?? null };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const { userId, sessionId } = await this.tokens.verifyRefreshToken(refreshToken).catch(() => {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401);
    });
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const session = await this.prisma.refreshSession.findUnique({ where: { tokenHash } });
    if (!session || session.id !== sessionId || session.expiresAt < new Date()) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401);
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, 401);
    }
    await this.prisma.refreshSession.delete({ where: { id: session.id } });
    const tokens = await this.issueTokens(user);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      const tokenHash = this.tokens.hashRefreshToken(refreshToken);
      await this.prisma.refreshSession.deleteMany({ where: { userId, tokenHash } });
    } else {
      await this.prisma.refreshSession.deleteMany({ where: { userId } });
    }
  }

  private async issueTokens(user: User): Promise<AuthResult> {
    const sessionId = this.tokens.generateRefreshSessionId();
    const accessToken = await this.tokens.signAccessToken(user.id);
    const refreshToken = await this.tokens.signRefreshToken(user.id, sessionId);
    const tokenHash = this.tokens.hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshSession.create({
      data: { id: sessionId, userId: user.id, tokenHash, expiresAt },
    });
    return { user: toPublicUser(user), accessToken, refreshToken };
  }
}

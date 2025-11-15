import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { StellarService } from '../stellar/stellar.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly stellarService: StellarService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { publicKey: registerDto.publicKey },
    });

    if (existingUser) {
      throw new ConflictException('User with this public key already exists');
    }

    // Check if username is taken
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    // Create new user
    const user = this.userRepository.create({
      publicKey: registerDto.publicKey,
      username: registerDto.username,
      displayName: registerDto.displayName,
      bio: registerDto.bio,
      avatarUrl: registerDto.avatarUrl,
    });

    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Verify signature
    const isValid = this.stellarService.verifySignature(
      loginDto.publicKey,
      loginDto.message,
      loginDto.signature,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid signature');
    }

    // Verify message timestamp (prevent replay attacks)
    const messageMatch = loginDto.message.match(/Timestamp:\s*(\d+)/);
    if (!messageMatch) {
      throw new UnauthorizedException('Invalid message format');
    }

    const timestamp = parseInt(messageMatch[1], 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - timestamp) > fiveMinutes) {
      throw new UnauthorizedException('Message expired');
    }

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { publicKey: loginDto.publicKey },
    });

    if (!user) {
      // Auto-create user on first login
      user = this.userRepository.create({
        publicKey: loginDto.publicKey,
        username: `user_${loginDto.publicKey.substring(0, 8)}`,
      });
      await this.userRepository.save(user);
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      publicKey: user.publicKey,
      username: user.username,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '1d',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 86400, // 1 day in seconds
    };
  }

  private sanitizeUser(user: User) {
    const { ...sanitized } = user;
    return sanitized;
  }
}

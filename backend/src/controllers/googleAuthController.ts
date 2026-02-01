import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { env } from '../config/env';
import { User } from '../models/User';
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
  env.googleOAuth.clientId,
  env.googleOAuth.clientSecret,
  env.googleOAuth.redirectUri
);

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
    });

    res.redirect(authUrl);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code) {
      res.status(400).json({
        success: false,
        error: 'Authorization code not provided',
      });
      return;
    }

    const { tokens } = await oauth2Client.getToken(code as string);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2',
    });

    const { data } = await oauth2.userinfo.get();

    if (!data.email || !data.name) {
      res.status(400).json({
        success: false,
        error: 'Failed to get user information',
      });
      return;
    }

    let user = await User.findOne({ email: data.email });

    if (!user) {
      user = new User({
        name: data.name,
        email: data.email,
        avatar: data.picture,
        provider: 'google',
        providerId: data.id || undefined,
        isEmailVerified: true,
      });
      await user.save();
    } else if (user.provider !== 'google') {
      // Update existing user to use Google OAuth
      user.provider = 'google';
      user.providerId = data.id || undefined;
      user.avatar = data.picture || user.avatar;
      await user.save();
    }

    if (!env.jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    const secret: string = env.jwtSecret;
    const options: jwt.SignOptions = {
      expiresIn: env.jwtExpiresIn as StringValue | number,
    };
    const token = jwt.sign(
      { userId: user._id.toString() },
      secret,
      options
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: env.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend
    res.redirect(`${env.frontendUrl}/dashboard?token=${token}`);
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

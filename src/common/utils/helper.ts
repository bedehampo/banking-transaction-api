import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';

export const validatePassword = (password: string): void => {
  try {
    const minLength = 8;
    const maxLength = 20;
    const hasNumber = /\d/;
    const hasLetter = /[a-zA-Z]/;
    const hasSpecialChar = /[!@#$%^&*(),.?-_":{}|<>]/;

    const isValid =
      password.length >= minLength &&
      password.length <= maxLength &&
      hasNumber.test(password) &&
      hasLetter.test(password) &&
      hasSpecialChar.test(password);

    if (!isValid) {
      throw new BadRequestException(
        'Password must be 8-20 characters long, and include at least one number, one letter, and one special character',
      );
    }
  } catch (error) {
    throw error;
  }
};

export const generateOTP = (): { otp: string; otpExpiry: Date } => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

  return { otp, otpExpiry };
};

export const verifyPassword = async (
  userPassword: string,
  givenPassword: string,
): Promise<void> => {
  try {
    const isPasswordValid = await argon2.verify(userPassword, givenPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid password. Please check your credentials and try again.',
      );
    }
    // No need to return true
  } catch (error) {
    // If argon2.verify throws an error, re-throw it as an UnauthorizedException.
    throw new UnauthorizedException(
      'Invalid password. Please check your credentials and try again.',
    );
  }
};

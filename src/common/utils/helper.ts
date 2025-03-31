import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

// Validate Password
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

// Generate OTP
export const generateOTP = (): { otp: string; otpExpiry: Date } => {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

  return { otp, otpExpiry };
};

// Verify Password
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

export const convertCurrency = async (from, to, value) => {
  const APP_ID = process.env.OPEN_EXCHANGE_RATE_APP_ID;
  const BASE_URL = process.env.OPEN_EXCHANGE_URL;

  try {
    if (!from || !to || !value) {
      throw new BadRequestException('Missing required parameters');
    }

    const amount = Number(value);
    if (isNaN(amount) || amount < 0) {
      throw new BadRequestException('Invalid amount');
    }

    const response = await axios.get(BASE_URL, {
      params: { app_id: APP_ID },
    });

    const rates = response.data.rates;
    if (!rates[from]) {
      throw new BadRequestException(`Invalid source currency: ${from}`);
    }
    if (!rates[to]) {
      throw new BadRequestException(`Invalid target currency: ${to}`);
    }

    const convertedAmount =
      from === 'USD'
        ? amount * rates[to]
        : to === 'USD'
          ? amount / rates[from]
          : (amount / rates[from]) * rates[to];

    return convertedAmount;
  } catch (error) {
    throw error;
  }
};

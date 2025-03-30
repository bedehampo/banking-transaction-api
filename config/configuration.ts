export interface AppConfig {
  port: number;
  database: {
    uri: string;
  };
  jwt: {
    secret: string;
  };
  bankName: string;
}

// Factory function with proper typing
export default (): AppConfig => {
  const uri = process.env.MONGODB_URI;
  const jwtSecret = process.env.JWT_SECRET;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
  }
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in the environment variables');
  }

  return {
    port: parseInt(process.env.PORT, 10) || 3000,
    database: {
      uri,
    },
    jwt: {
      secret: jwtSecret,
    },
    bankName: process.env.BANK_NAME || 'Default Bank',
  };
};

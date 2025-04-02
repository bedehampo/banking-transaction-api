import { Types } from 'mongoose';
import { CustomRequest } from 'src/common/interfaces/custom-request';

export const mockRequest = {
  user: {
    _id: new Types.ObjectId('65123abcd456ef7890123456'),
    mobileNumber: '07012345678',
    status: 'verified',
  },
} as unknown as CustomRequest;

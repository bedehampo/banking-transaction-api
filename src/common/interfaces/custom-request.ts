import { Types } from 'mongoose';

export interface CustomRequest extends Request {
  user?: {
    _id: Types.ObjectId;
    mobileNumber: string;
    status: string;
  };
}

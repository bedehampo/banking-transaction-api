export interface IUser {
  _id: unknown;
  firstName: string;
  lastName: string;
  accountNumber: string;
}

export interface IUsers {
  users: IUser[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
}

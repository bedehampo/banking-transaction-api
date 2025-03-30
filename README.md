# Banking Transactions API (Ledger System)

This project is a NestJS-based API for a banking ledger system. It handles financial transactions with ACID compliance and double-entry accounting, using MongoDB as the database.

## Initial Setup

This initial commit sets up the basic NestJS project structure.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/bedehampo/banking-transaction-api.git
    cd banking_ledger
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Run the application:**

    ```bash
    yarn start:dev
    ```

## Project Structure
 - src/
    - app.module.ts 
    - app.controller.ts 
    - app.service.ts
    - main.ts 
 - auth/
   - dto/ 
   - auth.service.ts
   - auth.controller.ts
   - auth.module.ts
   - auth.service.spec.ts
   - auth.controller.spec.ts
 - accounts/
   - dto/ 
   - accounts.service.ts
   - accounts.controller.ts
   - accounts.module.ts
   - accounts.service.spec.ts
   - accounts.controller.spec.ts
 - transactions/
   - dto/ 
   - accounts.service.ts
   - accounts.controller.ts
   - accounts.module.ts
   - accounts.service.spec.ts
   - accounts.controller.spec.ts
 - common/
   - filter/
   - interface/
   - utils/
 - utils/
 - package.json
 - .env.example
 - .gitignore
 - yarn.lock
 - README.md 

- Features Implemented
  - Authentication
    - This project now includes a basic authentication process with the following endpoints:

     - Register User: Allows users to register, automatically creating an account for them.
       POST `/create-account`
     - Login: Authenticates users and provides access to protected endpoints.
       POST `/login`
     - Get Logged-In User: Retrieves details of the currently logged-in user.
       GET `/get-login-user`
     - Get All Users: Fetches a list of all registered users.
       GET `/get-users`
     - Get User by ID: Retrieves details of a specific user by their ID.
       GET `/get-user/:id`
       
- Account Management
  The following endpoints are available for account-related operations:

  - Get My Account Details: Retrieves the account details of the logged-in user.
    GET `/get-my-account-details`
  - Get User Account Details: Retrieves account details for a specific user by their ID.
    GET `/get-user-account-details/:userId`
 - Authentication
   - Docker containerization

## Future Development
This project will be expanded to include:
* Financial transactions (deposits, withdrawals, transfers)
* Double-entry accounting
* ACID compliance using MongoDB transactions
* Unit tests.



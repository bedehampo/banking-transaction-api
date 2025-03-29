# Banking Transactions API (Ledger System)

This project is a NestJS-based API for a banking ledger system. It handles financial transactions with ACID compliance and double-entry accounting, using MongoDB as the database.

## Initial Setup

This initial commit sets up the basic NestJS project structure.

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
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
 - utils/
 - package.json
 - .env.example
 - .gitignore
 - yarn.lock
 - README.md 

## Future Development
This project will be expanded to include:
* User management (registration, login)
* Financial transactions (deposits, withdrawals, transfers)
* Double-entry accounting
* ACID compliance using MongoDB transactions
* Token-based authentication
* Swagger documentation.
* Unit tests.
* Docker containerization
* Environment variables using `.env` files.
* Validation using `class-validator` and `class-transformer`.
* Error handling with custom exception filters.
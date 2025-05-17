# Messaging System Backend

This project is a support messaging system that enables sending messages via WhatsApp using the WallMessage API. It also stores user information in a SQL Server database.

## Table of Contents

- [Introduction](#introduction)
- [Prerequisites](#prerequisites)
- [Installation and Setup](#installation-and-setup)
- [Project Structure](#project-structure)
- [APIs](#apis)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Security](#security)
- [License](#license)

## Introduction

This messaging system allows users to send WhatsApp messages through a simple API. The system includes an Express server that processes requests, stores user information in a SQL Server database, and sends messages through the WallMessage service.

## Prerequisites

- Node.js (version 14 or higher)
- SQL Server
- Access to WallMessage API (API keys)

## Installation and Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/messaging-system-backend.git
cd messaging-system-backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root directory and set the following environment variables:

```
DB_SERVER=your_sql_server_address
DB_USER=your_sql_username
DB_PASSWORD=your_sql_password
DB_NAME=your_database_name
DB_PORT=1433

WALLMESSAGE_API_URL=https://api.wallmessage.com/send
WALLMESSAGE_APP_KEY=your_app_key
WALLMESSAGE_AUTH_KEY=your_auth_key
```

4. Run the server in development mode:

```bash
npm run dev
```

The server will be available at `http://localhost:3000`.

## Project Structure

```
├── config/                 # Configuration files
│   ├── db.js              # Database connection configuration
│   └── initDb.js          # Database table creation
├── public/                # Static files
├── .env                   # Environment variables (must be created)
├── .gitignore             # Files ignored by git
├── package.json           # Project dependencies
└── server.js              # Main entry point of the application
```

## APIs

### Send WhatsApp Message

```
POST /send-whatsapp
```

**Request Parameters:**

```json
{
  "name": "User Name",
  "phone": "Phone Number" // Can start with 0 or country code (+xx)
}
```

**Success Response:**

```json
{
  "success": true,
  "message": "Message sent successfully! This is from Hotelex Holding."
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error message"
}
```

## Database

This project uses SQL Server as the database. The following table is automatically created on the first run of the application:

### Users Table

| Column | Type | Description |
|--------|------|-------------|
| Id | INT | Primary key, auto-increment |
| Name | NVARCHAR(100) | User name |
| Phone | NVARCHAR(20) | User phone number |
| CreatedAt | DATETIME | Record creation time (default: current time) |

## Environment Variables

| Variable | Description |
|----------|-------------|
| DB_SERVER | SQL Server address |
| DB_USER | SQL Server username |
| DB_PASSWORD | SQL Server password |
| DB_NAME | Database name |
| DB_PORT | SQL Server port (usually 1433) |
| WALLMESSAGE_API_URL | WallMessage service API address |
| WALLMESSAGE_APP_KEY | WallMessage application key |
| WALLMESSAGE_AUTH_KEY | WallMessage authentication key |

## Development

To run the server in development mode with auto-reload capability:

```bash
npm run dev
```

### Code Formatting

This project uses Prettier for code formatting. To format the code:

```bash
npx prettier --write .
```

## Security

- Make sure the `.env` file is in `.gitignore` and never added to the repository.
- Always store API keys and sensitive information in environment variables.
- Use HTTPS in production environment.

## License

ISC
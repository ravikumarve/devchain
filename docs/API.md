# DevChain API Reference

Base URL: `https://devchain.onrender.com/api/v1`

All endpoints require authentication unless specified otherwise. Use `Authorization: Bearer <token>` header for protected routes.

## Authentication Endpoints

| Method | Endpoint         | Description              | Auth Required      |
| ------ | ---------------- | ------------------------ | ------------------ |
| `POST` | `/auth/register` | Create new user account  | No                 |
| `POST` | `/auth/login`    | User login               | No                 |
| `POST` | `/auth/refresh`  | Refresh access token     | No (refresh token) |
| `POST` | `/auth/logout`   | User logout              | Yes                |
| `GET`  | `/auth/me`       | Get current user profile | Yes                |

## Products Endpoints

| Method   | Endpoint                 | Description         | Auth Required |
| -------- | ------------------------ | ------------------- | ------------- |
| `GET`    | `/products`              | List all products   | No            |
| `GET`    | `/products/:id`          | Get product details | No            |
| `POST`   | `/products`              | Create new product  | Yes           |
| `PUT`    | `/products/:id`          | Update product      | Yes (owner)   |
| `DELETE` | `/products/:id`          | Delete product      | Yes (owner)   |
| `GET`    | `/products/user/:userId` | Get user's products | No            |

## Jobs Endpoints

| Method   | Endpoint             | Description     | Auth Required |
| -------- | -------------------- | --------------- | ------------- |
| `GET`    | `/jobs`              | List all jobs   | No            |
| `GET`    | `/jobs/:id`          | Get job details | No            |
| `POST`   | `/jobs`              | Create new job  | Yes           |
| `PUT`    | `/jobs/:id`          | Update job      | Yes (owner)   |
| `DELETE` | `/jobs/:id`          | Delete job      | Yes (owner)   |
| `POST`   | `/jobs/:id/apply`    | Apply for job   | Yes           |
| `GET`    | `/jobs/user/:userId` | Get user's jobs | No            |

## Ownership Endpoints

| Method | Endpoint                         | Description             | Auth Required |
| ------ | -------------------------------- | ----------------------- | ------------- |
| `GET`  | `/ownership`                     | Get user's purchases    | Yes           |
| `GET`  | `/ownership/:id`                 | Get ownership details   | Yes (owner)   |
| `POST` | `/ownership/:productId/purchase` | Purchase product        | Yes           |
| `GET`  | `/ownership/product/:productId`  | Check product ownership | Yes           |

## Uploads Endpoints

| Method   | Endpoint             | Description   | Auth Required |
| -------- | -------------------- | ------------- | ------------- |
| `POST`   | `/uploads`           | Upload file   | Yes           |
| `GET`    | `/uploads/:filename` | Download file | Yes\*         |
| `DELETE` | `/uploads/:filename` | Delete file   | Yes (owner)   |

\*Download access may be restricted based on file permissions

## Health & Utility Endpoints

| Method | Endpoint  | Description  | Auth Required |
| ------ | --------- | ------------ | ------------- |
| `GET`  | `/`       | API status   | No            |
| `GET`  | `/health` | Health check | No            |

## Response Format

### Success Response

```json
{
  "data": { ... },
  "message": "Success message"
}
```

### Error Response

```json
{
  "error": "Error message",
  "details": { ... }
}
```

## Pagination

List endpoints support pagination via query parameters:

- `?page=1` - Page number (default: 1)
- `?limit=20` - Items per page (default: 20)

## Authentication Flow

1. Register user → returns access + refresh tokens
2. Use access token for API requests (expires in 15m)
3. When access token expires, use refresh token to get new access token
4. Refresh tokens expire after 7 days

## File Uploads

File uploads are handled via Supabase Storage. Uploaded files are stored in the `devchain-files` bucket with user-specific access controls.

## Rate Limiting

API is rate limited to 100 requests per 15 minutes per IP address.

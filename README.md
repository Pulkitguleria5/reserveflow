# Allo Inventory Reservation System

## Overview

This project is a concurrency-safe inventory reservation system built as part of the Allo Health Software Engineering Assignment.

The system solves a common e-commerce inventory problem where multiple users may attempt to purchase the same product simultaneously while payment is still processing.

Instead of reducing inventory immediately during checkout, the system temporarily reserves stock for a limited duration. If payment succeeds, the reservation is confirmed and stock is permanently deducted. If payment fails or expires, the reserved inventory is released back into available stock.

The project focuses heavily on:

* Correctness under concurrency
* Transaction-safe inventory updates
* Preventing race conditions
* Reservation lifecycle management
* Real-time stock consistency

---

# Tech Stack

## Frontend

* Next.js (App Router)
* TypeScript
* Tailwind CSS

## Backend

* Next.js Route Handlers
* PostgreSQL
* pg (node-postgres)

## Database Hosting

* Supabase PostgreSQL

## Deployment

* Vercel

---

# Features

* Product listing with warehouse-wise stock
* Temporary inventory reservation system
* Reservation confirmation flow
* Reservation release/cancellation flow
* Reservation expiry countdown timer
* Automatic lazy expiry cleanup
* Concurrency-safe stock reservation
* Dynamic stock availability updates
* Error handling for insufficient stock and expired reservations

---

# Database Design

## Products Table

Stores product information.

| Column | Description  |
| ------ | ------------ |
| id     | Product ID   |
| name   | Product name |

---

## Warehouses Table

Stores warehouse information.

| Column | Description    |
| ------ | -------------- |
| id     | Warehouse ID   |
| name   | Warehouse name |

---

## Inventory Table

Tracks inventory for products across warehouses.

| Column         | Description                  |
| -------------- | ---------------------------- |
| id             | Inventory ID                 |
| product_id     | Linked product               |
| warehouse_id   | Linked warehouse             |
| total_stock    | Total physical inventory     |
| reserved_stock | Currently reserved inventory |

### Available Stock Formula

```txt
available_stock = total_stock - reserved_stock
```

Available stock is calculated dynamically instead of storing it directly to avoid inconsistency issues.

---

## Reservations Table

Tracks temporary inventory reservations.

| Column       | Description                    |
| ------------ | ------------------------------ |
| id           | Reservation ID                 |
| product_id   | Reserved product               |
| warehouse_id | Reserved warehouse             |
| quantity     | Reserved quantity              |
| status       | Reservation status             |
| expires_at   | Reservation expiry time        |
| created_at   | Reservation creation timestamp |

### Reservation Status Values

```txt
pending
confirmed
released
```

---

# API Endpoints

## GET /api/products

Returns all products with warehouse stock availability.

---

## GET /api/reservations/:id

Returns reservation details.

---

## POST /api/reservations

Creates a temporary reservation.

### Behaviour

* Starts transaction
* Locks inventory row
* Validates stock availability
* Increases reserved stock
* Creates reservation
* Commits transaction

Returns:

* 409 if insufficient stock is available

---

## POST /api/reservations/:id/confirm

Confirms reservation after successful payment.

### Behaviour

* Validates reservation status
* Validates expiry
* Permanently reduces total stock
* Removes reserved stock
* Marks reservation as confirmed

Returns:

* 410 if reservation has expired

---

## POST /api/reservations/:id/release

Releases reservation after cancellation or payment failure.

### Behaviour

* Removes reserved stock
* Marks reservation as released

---

# Handling Concurrent Reservations

The most important part of this assignment is preventing race conditions during simultaneous reservations.

Example problem:

```txt
Only 1 unit left in stock.
Two users reserve simultaneously.
```

Without concurrency control:

* Both requests may succeed
* Overselling occurs

To prevent this, PostgreSQL row-level locking is used.

## Transaction Flow

```sql
BEGIN;

SELECT *
FROM inventory
WHERE product_id = $1
AND warehouse_id = $2
FOR UPDATE;

UPDATE inventory
SET reserved_stock = reserved_stock + 1;

INSERT INTO reservations (...);

COMMIT;
```

## Why FOR UPDATE?

`SELECT ... FOR UPDATE` locks the inventory row during the transaction.

This guarantees:

* Only one request can modify the inventory row at a time
* Simultaneous reservation requests cannot oversell stock

If another request attempts to reserve the same inventory row simultaneously, it must wait until the first transaction completes.

This ensures the reservation logic remains race-condition-free.

---

# Reservation Flow

```txt
pending -> confirmed
pending -> released
pending -> expired/released
```

## Pending

Reservation is active and awaiting payment.

## Confirmed

Payment succeeded and stock is permanently deducted.

## Released

Reservation cancelled, expired, or payment failed.

---

# Reservation Expiry Handling

This project uses a lazy expiry cleanup strategy.

Instead of using cron jobs or background workers, expired reservations are cleaned automatically whenever inventory-related APIs are accessed.

## Cleanup Behaviour

During:

* Product fetch requests
* Reservation creation requests

The system:

* Finds expired pending reservations
* Releases reserved inventory
* Updates reservation status to released

## Why Lazy Cleanup?

This approach was chosen because:

* Simpler architecture
* Faster implementation
* No additional infrastructure required
* Suitable for assignment scope

In a larger production system, a dedicated cron job or worker-based cleanup mechanism would likely be preferable.

---

# Frontend Application Flow

## Homepage

Displays:

* Products
* Warehouse stock availability
* Reserve button

## Reservation Page

Displays:

* Reservation details
* Live countdown timer
* Confirm purchase button
* Cancel reservation button

---

# Setup Instructions

## 1. Clone Repository

```bash
git clone <repository-url>
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Create Environment File

Create:

```txt
.env.local
```

Add:

```env
DATABASE_URL=your_supabase_connection_string
```

---

## 4. Run Development Server

```bash
npm run dev
```

---

## 5. Open Application

```txt
http://localhost:3000
```

---

# Deployment

The application is deployed using:

* Vercel (Frontend + API)
* Supabase PostgreSQL (Database)

Environment variables were configured in Vercel project settings.

---

# Tradeoffs and Future Scope

## Current Tradeoffs

* Lazy expiry cleanup used instead of cron jobs
* No authentication system
* Simplified UI to prioritize backend correctness
* No idempotency implementation

---

## Possible Future Improvements

* Add Redis-based distributed locking
* Implement idempotency keys
* Add authentication and user sessions
* Replace lazy cleanup with scheduled background jobs
* Add warehouse prioritization logic
* Add reservation analytics and monitoring
* Improve UI/UX and loading states
* Add automated testing

---

# What I Focused On During Implementation

This project involved learning and implementing:

* PostgreSQL transactions
* Row-level locking
* Concurrency-safe backend design
* Inventory reservation systems
* Race condition prevention
* Full-stack Next.js architecture
* Reservation lifecycle management

---

# Live Demo

## Deployed URL

[https://reserveflow.vercel.app/](https://reserveflow.vercel.app/)

---

# Repository

## GitHub Repository

[https://github.com/Pulkitguleria5/reserveflow](https://github.com/Pulkitguleria5/reserveflow)

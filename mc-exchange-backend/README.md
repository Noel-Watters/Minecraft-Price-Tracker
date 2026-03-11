# MC Shop Backend

A Node.js backend service for ingesting and exporting Minecraft shop event data.

## Features

- **Shop Event Ingestion**: POST endpoint to receive shop transaction data
- **CSV Export**: GET endpoint to export all shop events as CSV
- **Deduplication**: Prevents duplicate entries using hash-based deduplication
- **Data Validation**: Validates incoming shop data for required fields and proper formats

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

### POST `/ingest`
Ingests shop event data.

**Request Body:**
```json
{
  "player": "PlayerName",
  "raw": "[Shop] Selling Oak Log x64 for 1.5D",
  "x": 100,
  "y": 64,
  "z": 200,
  "dimension": "overworld",
  "input_item_id": "oak_log",
  "input_qty": 64,
  "output_item_id": "diamond",
  "output_qty": 1,
  "exchanges_possible": 10,
  "compacted_input": false,
  "compacted_output": false
}
```

### GET `/export.csv`
Exports all shop events as CSV file.

## Tech Stack

- **Node.js** with Express
- **Supabase** for database
- **CORS**, **Helmet**, **Morgan** for middleware

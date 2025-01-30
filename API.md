# FIT Compare Tool API Documentation

## Authentication
All authenticated endpoints require a Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

## Endpoints

### Public Endpoints

#### Get Shared Dataset
```http
GET /api/fit-files/shared/:token
```
Retrieves a shared dataset using a share token.

**Response**
```json
{
  "id": "string",
  "name": "string",
  "createdAt": "string",
  "fitFiles": [
    {
      "id": "string",
      "name": "string",
      "filePath": "string"
    }
  ]
}
```

#### Get Shared File Data
```http
GET /api/fit-files/shared/:token/file/:fileId/data
```
Retrieves processed data for a specific file in a shared dataset.

**Response**
```json
[
  {
    "index": 0,
    "power": 0,
    "cadence": 0,
    "heartRate": 0,
    "speed": 0,
    "altitude": 0,
    "timestamp": "string"
  }
]
```

### Authenticated Endpoints

#### List Datasets
```http
GET /api/fit-files
```
Retrieves all datasets belonging to the authenticated user.

**Response**
```json
[
  {
    "id": "string",
    "name": "string",
    "createdAt": "string",
    "fitFiles": [
      {
        "id": "string",
        "name": "string",
        "filePath": "string"
      }
    ]
  }
]
```

#### Get Dataset
```http
GET /api/fit-files/:id
```
Retrieves a specific dataset belonging to the authenticated user.

**Response**
```json
{
  "id": "string",
  "name": "string",
  "createdAt": "string",
  "fitFiles": [
    {
      "id": "string",
      "name": "string",
      "filePath": "string"
    }
  ]
}
```

#### Get File Data
```http
GET /api/fit-files/file/:id/data
```
Retrieves processed data for a specific file.

**Response**
```json
[
  {
    "index": 0,
    "power": 0,
    "cadence": 0,
    "heartRate": 0,
    "speed": 0,
    "altitude": 0,
    "timestamp": "string"
  }
]
```

#### Create Dataset
```http
POST /api/fit-files
```
Creates a new dataset with uploaded FIT files.

**Request Body (multipart/form-data)**
- `name`: string (optional, defaults to "New Dataset")
- `files`: Array of .fit files

**Response**
```json
{
  "id": "string",
  "name": "string",
  "createdAt": "string",
  "fitFiles": [
    {
      "id": "string",
      "name": "string",
      "filePath": "string"
    }
  ]
}
```

#### Update Dataset
```http
PATCH /api/fit-files/:id
```
Updates a dataset's name.

**Request Body**
```json
{
  "name": "string"
}
```

**Response**
```json
{
  "id": "string",
  "name": "string",
  "createdAt": "string"
}
```

#### Delete Dataset
```http
DELETE /api/fit-files/:id
```
Deletes a dataset and all its associated files.

**Response**
```json
{
  "message": "Dataset deleted successfully"
}
```

#### Share Dataset
```http
POST /api/fit-files/:id/share
```
Generates or retrieves a share token for a dataset.

**Response**
```json
{
  "shareToken": "string"
}
```

#### Delete File
```http
DELETE /api/fit-files/:datasetId/file/:fileId
```
Deletes a specific file from a dataset.

**Response**
```json
{
  "message": "File deleted successfully"
}
```

## Error Responses
All endpoints may return the following error responses:

```json
{
  "error": "Error message"
}
```

Common HTTP status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## File Format Requirements
- Only .fit files are accepted for upload
- Maximum file size: Determined by server configuration
- Files are stored securely and associated with the authenticated user's account

## Data Processing
The API processes FIT files and extracts the following metrics:
- Power (watts)
- Cadence (rpm)
- Heart Rate (bpm)
- Speed (km/h)
- Altitude (m)
- Timestamps

All data points are synchronized and indexed for comparison across multiple files within a dataset.

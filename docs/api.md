# Omnivax API Reference

## 🔐 Authentication Headers
The API supports two forms of authentication:
*   **Bearer Token**: JWT session token generated from Supabase (`Authorization: Bearer <TOKEN>`).
*   **X-API-Key**: Cryptographically hashed long-lived token for automated clients (`X-API-Key: omni_<KEY>`).

---

## 🧠 Model Catalog & Registration

### Deploy Model from Hub
Submit an asynchronous task to download and deploy a model from Hugging Face or Kaggle.
*   **Method**: `POST`
*   **Path**: `/models/deploy-hub`
*   **Request Body** (JSON):
```json
{
  "model_id": "unique_model_id",
  "name": "Display Model Name",
  "source": "huggingface", // or "kaggle"
  "repo_id": "google/vit-base-patch16-224",
  "filename": "model.pth", // optional specific file
  "framework": "pytorch", // optional (pytorch|onnx|tensorflow)
  "class_names": ["class_1", "class_2"], // optional custom class mappings
  "tags": ["tag1", "tag2"] // optional tags
}
```
*   **Response** (202 Accepted):
```json
{
  "task_id": "celery-task-uuid-12345",
  "status": "queued",
  "message": "Deployment job dispatched to background worker."
}
```

### Batch Deploy Models from Hub
Submit a batch request to register multiple models in parallel.
*   **Method**: `POST`
*   **Path**: `/models/batch-hub`
*   **Request Body** (JSON):
```json
{
  "items": [
    {
      "model_id": "model_1",
      "name": "Model 1",
      "source": "huggingface",
      "repo_id": "org/repo1"
    },
    {
      "model_id": "model_2",
      "name": "Model 2",
      "source": "kaggle",
      "repo_id": "org/repo2"
    }
  ]
}
```
*   **Response** (200 OK):
```json
{
  "deployments": [
    {
      "model_id": "model_1",
      "task_id": "task-uuid-1",
      "status": "queued"
    },
    {
      "model_id": "model_2",
      "task_id": "task-uuid-2",
      "status": "queued"
    }
  ]
}
```

### Upload a Model Local Directory
Submit weights and configuration files.
*   **Method**: `POST`
*   **Path**: `/models/upload`
*   **Content-Type**: `multipart/form-data`
*   **Parameters**:
    *   `model_id` (Form string, required)
    *   `name` (Form string, required)
    *   `weights_file` (File, optional)
    *   `config_file` (File, optional)
    *   `config_json` (Form string, optional)
    *   `remote_path` (Form string, optional)

---

## 🔬 Diagnostics & Inference

### Run Diagnostic Prediction
Perform image classification using a registered model.
*   **Method**: `POST`
*   **Path**: `/predict`
*   **Content-Type**: `multipart/form-data`
*   **Parameters**:
    *   `image` (File, required)
    *   `model_id` (Form string, optional, defaults to default model ID)
    *   `top_k` (Form integer, optional, default: `3`)
*   **Response** (200 OK):
```json
{
  "model_id": "efficientnet_b0_v1",
  "top_prediction": {
    "label": "Corn_Common_Rust",
    "confidence": 0.942
  },
  "predictions": [
    {
      "label": "Corn_Common_Rust",
      "confidence": 0.942
    },
    {
      "label": "Corn_Healthy",
      "confidence": 0.051
    }
  ],
  "latency_ms": 12.5
}
```
*   **Errors**:
    *   `400 Bad Request`: Invalid image content-type.
    *   `413 Payload Too Large`: Image file exceeds 5MB.
    *   `429 Too Many Requests`: Rate limit exceeded.

---

## 🔑 Model Hub Credentials Management

Endpoints to manage third-party integration credentials for Hugging Face and Kaggle. Securely stored using AES-256 Fernet symmetric encryption and verified at registration time against remote APIs.

### Configure Model Hub Credentials
Securely set or update third-party tokens/keys. Credentials will be verified immediately.
*   **Method**: `POST`
*   **Path**: `/auth/credentials`
*   **Request Body** (JSON):
```json
{
  "source": "huggingface", // or "kaggle"
  "token": "hf_your_huggingface_personal_access_token", // required for huggingface
  "username": "kaggle_username", // required for kaggle
  "key": "kaggle_api_key" // required for kaggle
}
```
*   **Response** (200 OK):
```json
{
  "source": "huggingface",
  "is_valid": true,
  "token_masked": "hf_yo...token",
  "username": null,
  "created_at": "2026-07-04T10:15:00Z",
  "updated_at": "2026-07-04T10:15:00Z"
}
```

### List Model Hub Credentials
List all credentials currently configured for the authenticated user context. Masked tokens/keys are returned.
*   **Method**: `GET`
*   **Path**: `/auth/credentials`
*   **Response** (200 OK):
```json
[
  {
    "source": "huggingface",
    "is_valid": true,
    "token_masked": "hf_yo...token",
    "username": null,
    "created_at": "2026-07-04T10:15:00Z",
    "updated_at": "2026-07-04T10:15:00Z"
  }
]
```

### Delete Model Hub Credentials
Revoke and delete the stored credentials for the specified source.
*   **Method**: `DELETE`
*   **Path**: `/auth/credentials/{source}`
*   **Response** (200 OK):
```json
{
  "message": "Credentials for huggingface deleted successfully."
}
```

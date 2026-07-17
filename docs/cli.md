# Command Line Interface (CLI) Guide

The Omnivax CLI (`omnivax`) is a command-line tool designed to help developers manage models, credentials, and interactive agent sessions directly from their terminal workspace.

---

## 💻 Installation

To install the CLI in editable mode from the project root:
```bash
pip install -e cli/
```

Verify the installation:
```bash
omnivax --help
```

---

## 🔑 1. Authentication & Credentials (`omnivax auth`)

Set, view, and delete encrypted developer tokens for Hugging Face and Kaggle.

### Set Credentials
Interactively configure secure third-party integration tokens. Set tokens are verified immediately with the remote API before storage.
```bash
omnivax auth credentials set --source huggingface
omnivax auth credentials set --source kaggle
```

### List Credentials
List all configured credentials for your account context, showing verification status and masked tokens.
```bash
omnivax auth credentials list
```

### Delete Credentials
Revoke and remove credentials for a specified source.
```bash
omnivax auth credentials delete --source huggingface
```

---

## 🧠 2. Model Catalog Operations (`omnivax models`)

Manage, test, and register machine learning models.

### Register a Model
Validate and register a local model directory containing weights and a `config.json`.
```bash
omnivax models register --config ./real_resnet_config.json
```

### Deploy from Model Hub
Submit a background download and deployment task for a Hugging Face or Kaggle model.
```bash
omnivax models deploy-hub \
  --model-id resnet50_leaf \
  --name "ResNet50 Leaf Blight Classifier" \
  --source huggingface \
  --repo-id "google/vit-base-patch16-224"
```

### Batch Deploy
Import multiple model configurations simultaneously, displaying a real-time terminal dashboard of downloading and smoke testing status.
```bash
omnivax models batch-deploy --config ./batch_deploy_test.json
```

---

## 🤖 3. Developer Helper Agent (`omnivax agent`)

Orchestrate the local helper agent.

### Start the Agent Server
Spin up the local developer helper agent server, serving the FastAPI WebSocket endpoint and the standalone developer dashboard.
```bash
omnivax agent start --host 127.0.0.1 --port 8088
```
*   **Options**:
    *   `--open-browser` / `--no-open-browser` (Default: open): Controls whether your browser automatically redirects to the dashboard.

### Interactive Terminal Chat
Start a direct, interactive WebSocket session with the running local helper agent.
```bash
omnivax agent chat
```
*   **Options**:
    *   `--session-id <id>`: Resume a past conversation session.

### View Session History
List all locally saved conversation history logs.
```bash
omnivax agent history
```

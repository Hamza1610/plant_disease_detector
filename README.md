# Tiki Tice Omnivax

Omnivax is an enterprise-grade, model-first plant disease AI platform featuring a searchable model catalog, real-time prediction APIs, asynchronous hub deployments, and automated benchmark verification.

---

## 🚀 Key Features

* **Model-as-a-Service Core**: Unified endpoints for plant disease diagnostics and inference.
* **Celery & Redis Background Worker Queue**: Asynchronous, distributed model hub deployments from Hugging Face and Kaggle.
* **Metadata & Config Integration**: Auto-extraction of classes (`config.json`) and automated smoke testing during registration.
* **Installable CLI tool (`omnivax`)**: CLI utility to login, check active models, push local directories, and run massive batch deployments.

---

## 🛠️ System Requirements
* Python 3.9+
* Redis Server (for background worker tasks)

---

## 📦 Installation & Setup

### 1) Create and activate virtual environment

From project root (`omnivax`):
```bash
python -m venv .venv
source .venv/bin/activate
```

Upgrade pip:
```bash
python -m pip install --upgrade pip
```

### 2) Install backend dependencies
```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 3) Install the Omnivax CLI standard library
```bash
pip install -e cli/
```

Now, the `omnivax` command is globally available inside your virtual environment!

---

## 🖥️ Running the Application

### 1) Start the Backend API Server
```bash
cd backend
PYTHONPATH=mock_libs:. uvicorn app.main:app --reload
```
Platform runs at: `http://127.0.0.1:8000`

### 2) Start the Celery Background Workers (for Hub deployments)
Ensure your local Redis server is running, then start the celery worker:
```bash
cd backend
PYTHONPATH=mock_libs:. celery -A app.core.celery_app worker --loglevel=info
```

---

## 💻 CLI Commands Quickstart

Log in to the platform:
```bash
omnivax auth login --email dev@example.com --password devpass
```

List all registered models:
```bash
omnivax models list
```

Deploy a model from a local directory (auto-detects `weights.pth` and `config.json`):
```bash
omnivax models push my_model --name "My Model" --dir ./my_model_folder
```

Deploy a model from Hugging Face:
```bash
omnivax models deploy-hub my_hf_model --name "My HF Model" --source huggingface --repo-id "prajjwal1/bert-tiny"
```

Massive batch deploy from a configuration file:
```bash
omnivax models batch-deploy ./batch_config.json
```

---

## 🧪 Running Automated Tests
To run unit and integration tests:
```bash
cd backend
PYTHONPATH=mock_libs:. pytest -v
```

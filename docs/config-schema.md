# Declarative Model Config.json Specification

Every model registered in the Omnivax platform must include a `config.json` file in its directory. This file defines model-first properties, preprocessing rules, model dimensions, and output task types to configure the prediction adapter and database entries.

---

## 📄 Schema Structure

A standard `config.json` is defined as follows:

```json
{
  "model_id": "resnet50_leaf_v1",
  "name": "ResNet50 Tomato Leaf Blight Classifier",
  "framework": "pytorch",
  "task_type": "classification",
  "input_shape": [1, 3, 224, 224],
  "normalization": {
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "scale": 255.0
  },
  "classes": [
    "Tomato_Blight",
    "Tomato_Leaf_Mold",
    "Tomato_Healthy"
  ],
  "tags": [
    "resnet",
    "tomato",
    "leaves"
  ]
}
```

---

## ⚙️ Properties Definition

### 1. Root Properties
*   `model_id` (string, required): A unique snake_case slug identifying the model. Must match standard regex slug patterns.
*   `name` (string, required): A human-readable display name shown in the Model Catalog and prediction studio.
*   `framework` (string, required): Runtime runtime engine. Must be one of `pytorch`, `onnx`, or `tensorflow`.
*   `task_type` (string, required): Target inference operation. Supported options:
    *   `classification`: Single-label or multi-label image category outputs.
    *   `regression`: Quantitative score estimations.
    *   `object_detection`: Bounding boxes coordinates and labels mapping.
*   `tags` (array of strings, optional): Category filters used in dashboard searching.

### 2. Preprocessing & Input Properties
*   `input_shape` (array of integers, required): Represents the shape dimensions expected by the model inputs layer. E.g., `[batch_size, channels, height, width]`.
*   `normalization` (object, required): Details normalizations scaling calculations executed prior to feeding image arrays:
    *   `scale` (float, required): Value used to divide pixel bytes (e.g. `255.0` to project bytes into `[0.0, 1.0]`).
    *   `mean` (array of floats, required): Channel-wise mean subtraction parameters.
    *   `std` (array of floats, required): Channel-wise standard deviation division parameters.

### 3. Classification Output Properties
*   `classes` (array of strings, required for `classification` tasks): The list of task output category label names mapped index-by-index to the model output logits layer.

---

## 🔬 Local Validation Execution

Prior to registration, you can verify your directory contains all necessary files (e.g. `model.pth`, `config.json`) and validation shape checks pass by running the local smoke test tool:
```bash
omnivax agent start
# Then, running:
omnivax agent chat
# Ask the agent:
"Run local validation test on ./real_resnet_config.json"
```
The test verifies image loaders, normalizes mock arrays, runs mock feed-forwards, and returns diagnostic results.

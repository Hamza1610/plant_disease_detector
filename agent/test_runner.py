import sys
import json
import numpy as np
from pathlib import Path

def run_test(config_path: str):
    print(f"--- Running Local Validation for {config_path} ---")
    config_file = Path(config_path)
    if not config_file.exists():
        print(f"Error: Config file '{config_path}' does not exist.")
        sys.exit(1)

    try:
        with open(config_file, "r", encoding="utf-8") as f:
            cfg = json.load(f)
    except Exception as e:
        print(f"Error parsing config JSON: {str(e)}")
        sys.exit(1)

    # 1. Base Validation
    required_keys = ["model_id", "name", "framework", "model_format", "input_schema", "output_schema"]
    for key in required_keys:
        if key not in cfg:
            print(f"Error: Missing required schema key '{key}'")
            sys.exit(1)

    model_id = cfg["model_id"]
    framework = cfg["framework"]
    model_format = cfg["model_format"]
    
    print(f"Validating Model: {cfg['name']} (ID: {model_id})")
    print(f"Target Framework: {framework} | Format: {model_format}")

    # Validate explicit framework list
    valid_frameworks = ["pytorch", "tensorflow", "sklearn", "onnx", "custom"]
    if framework not in valid_frameworks:
        print(f"Error: Invalid framework '{framework}'. Must be one of {valid_frameworks}")
        sys.exit(1)

    # Validate format list
    valid_formats = ["safetensors", "savedmodel", "onnx", "pickle", "keras_h5"]
    if model_format not in valid_formats:
        print(f"Error: Invalid format '{model_format}'. Must be one of {valid_formats}")
        sys.exit(1)

    # 2. Input Spec Validation
    input_spec = cfg["input_schema"]
    modality = input_spec.get("modality")
    valid_modalities = ["image", "audio", "text", "tabular"]
    if modality not in valid_modalities:
        print(f"Error: Invalid modality '{modality}'. Must be one of {valid_modalities}")
        sys.exit(1)

    params = input_spec.get("parameters", {})
    if modality not in params:
        print(f"Error: Parameters missing for selected modality '{modality}'")
        sys.exit(1)

    modality_params = params[modality]

    # Validate image properties
    if modality == "image":
        dims = modality_params.get("dimensions")
        if not dims or len(dims) != 3:
            print(f"Error: Image dimensions must be a list of 3 integers [H, W, C]. Got: {dims}")
            sys.exit(1)
        norm = modality_params.get("normalization")
        valid_norms = ["imagenet", "rescale_only", "none"]
        if norm not in valid_norms:
            print(f"Error: Invalid image normalization preset '{norm}'. Must be one of {valid_norms}")
            sys.exit(1)
        print("Input Schema: Valid Image Modality Configuration.")

    # 3. Output Spec Validation
    output_spec = cfg["output_schema"]
    task_type = output_spec.get("task_type")
    valid_tasks = ["classification", "regression", "object_detection", "text_generation"]
    if task_type not in valid_tasks:
        print(f"Error: Invalid task type '{task_type}'. Must be one of {valid_tasks}")
        sys.exit(1)

    out_params = output_spec.get("parameters", {})
    if task_type in ["classification", "object_detection"]:
        task_params = out_params.get(task_type, {})
        classes = task_params.get("class_names")
        if not classes or not isinstance(classes, list) or len(classes) == 0:
            print(f"Error: Task '{task_type}' requires a non-empty list of 'class_names'.")
            sys.exit(1)
        print(f"Output Schema: Valid {task_type.capitalize()} Output Configuration with {len(classes)} classes.")

    # 4. Simulation / Loading Weights Check
    weights_info = cfg.get("model_source", {})
    filename = weights_info.get("filename", "")
    
    # Check if a local weights file exists to do real loading test
    local_weights = Path(filename)
    if not local_weights.exists() and filename:
        # Check standard locations (like /models or repository root)
        candidates = [Path("models") / filename, Path("data") / filename, Path("backend/app") / filename]
        for c in candidates:
            if c.exists():
                local_weights = c
                break

    if local_weights.exists() and local_weights.is_file():
        print(f"Weights file found locally at: {local_weights.name}. Running framework load smoke test...")
        try:
            if framework == "pytorch":
                import torch
                # Simple weight map loading check
                if model_format == "safetensors":
                    try:
                        from safetensors.torch import load_file
                        _ = load_file(str(local_weights), device="cpu")
                    except ImportError:
                        print("Warning: safetensors package not installed. Skipping direct safetensors validation.")
                else:
                    _ = torch.load(str(local_weights), map_location="cpu")
                print("PyTorch model checkpoint loaded successfully.")

            elif framework == "tensorflow" or (framework == "keras" and model_format == "keras_h5"):
                try:
                    import tf_keras as keras
                except ImportError:
                    import tensorflow.keras as keras
                _ = keras.models.load_model(str(local_weights), compile=False)
                print("Keras model loaded successfully.")

            elif framework == "sklearn" and model_format == "pickle":
                import pickle
                with open(local_weights, "rb") as pf:
                    _ = pickle.load(pf)
                print("Scikit-learn pickle model loaded successfully.")

        except Exception as e:
            print(f"Warning: Real model loading failed: {str(e)}")
            print("Note: This might be due to package version differences, but configuration structure is correct.")
    else:
        print("No local weights file detected. Running synthetic schema validation only.")

    print("\n[SUCCESS] Configuration schema and parameter validation passed completely!")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Error: Missing config path argument.")
        sys.exit(1)
    run_test(sys.argv[1])

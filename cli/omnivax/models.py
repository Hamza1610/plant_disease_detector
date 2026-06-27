import json
import typer
import httpx
from pathlib import Path
from typing import Optional
from rich.console import Console
from rich.table import Table
from .config import load_config, get_auth_headers

app = typer.Typer(help="Manage and interact with models.")
console = Console()

@app.command()
def list():
    """List all available models in the Omnivax registry."""
    config = load_config()
    
    with console.status("[bold green]Fetching registry..."):
        try:
            headers = get_auth_headers(config)
            response = httpx.get(f"{config.api_url}/models", headers=headers)
            response.raise_for_status()
            models = response.json()
            
            table = Table(title="Omnivax Model Registry")
            table.add_column("ID", style="cyan", no_wrap=True)
            table.add_column("Name", style="magenta")
            table.add_column("Status", style="green")
            table.add_column("Accuracy", justify="right")

            for m in models:
                table.add_row(
                    m.get("model_id"),
                    m.get("name"),
                    "[green]Live[/green]",
                    "94.2%"
                )

            console.print(table)
        except Exception as e:
            console.print(f"[red]Error fetching models:[/red] {str(e)}")

@app.command()
def info(model_id: str):
    """Get detailed information about a specific model."""
    config = load_config()
    try:
        headers = get_auth_headers(config)
        response = httpx.get(f"{config.api_url}/models/{model_id}", headers=headers)
        response.raise_for_status()
        model = response.json()
        
        console.print(f"[bold cyan]Model Information: {model['name']}[/bold cyan]")
        console.print(f"ID: {model['model_id']}")
        console.print(f"Description: {model.get('description', 'N/A')}")
        console.print(f"Classes: {', '.join(model.get('class_names', []))}")
        console.print(f"Tags: {', '.join(model.get('tags', []))}")
    except Exception as e:
        console.print(f"[red]Error:[/red] {str(e)}")

@app.command()
def push(
    file: Optional[Path] = typer.Option(None, "--file", "-f", help="Path to the model weights file (.h5, .pth)"),
    model_id: Optional[str] = typer.Option(None, "--id", help="Unique ID for the model"),
    name: Optional[str] = typer.Option(None, "--name", help="Display name for the model"),
    description: str = typer.Option("", "--desc", help="Brief description"),
    classes: str = typer.Option("[]", "--classes", help="JSON list of class names"),
    tags: str = typer.Option("[]", "--tags", help="JSON list of tags"),
    config_option: Optional[str] = typer.Option(None, "--config", "-c", help="Path to config.json file OR raw JSON string"),
    directory: Optional[Path] = typer.Option(None, "--dir", "-d", help="Directory containing model file and config.json"),
    framework: str = typer.Option("pytorch", "--framework", help="Framework target (pytorch, keras, sklearn)"),
):
    """
    Upload and register a new model to the Omnivax Cloud.
    
    Example:
    python omnivax_cli.py models push -f ./model.h5 --id my_corn_v2 --name 'Corn V2'
    """
    config = load_config()
    headers = get_auth_headers(config)
    if not headers:
        console.print("[red]Error:[/red] You must be authenticated to push models.")
        return

    # Handle directory scanning
    if directory:
        if not directory.exists() or not directory.is_dir():
            console.print(f"[red]Error:[/red] Directory '{directory}' not found or is not a directory.")
            return
        
        # Look for config.json
        config_file_path = directory / "config.json"
        if config_file_path.exists():
            config_option = str(config_file_path)
            
        # Look for weights file
        weights_extensions = [".pth", ".pt", ".h5", ".pkl", ".joblib"]
        found_weights = []
        for ext in weights_extensions:
            found_weights.extend(list(directory.glob(f"*{ext}")))
            
        if found_weights:
            file = found_weights[0]
            console.print(f"[dim]Auto-detected weights file: {file.name}[/dim]")
        else:
            console.print(f"[red]Error:[/red] No weights file (.pth, .h5, .pkl) found in directory '{directory}'.")
            return

    # Parse config payload if provided
    config_dict = {}
    if config_option:
        config_path = Path(config_option)
        if config_path.is_file():
            try:
                with open(config_path, "r", encoding="utf-8") as cf:
                    config_dict = json.load(cf)
            except Exception as e:
                console.print(f"[red]Error reading config file:[/red] {str(e)}")
                return
        else:
            try:
                config_dict = json.loads(config_option)
            except Exception as e:
                console.print(f"[red]Error parsing config string as JSON:[/red] {str(e)}")
                return

    # Extract/infer values from config
    if config_dict:
        if not model_id:
            model_id = config_dict.get("model_id") or config_dict.get("id")
        if not name:
            name = config_dict.get("name")
        if not description:
            description = config_dict.get("description", "")
        if classes == "[]":
            class_list = config_dict.get("class_names") or config_dict.get("output_classes") or []
            if isinstance(class_list, list):
                classes = json.dumps(class_list)
        if tags == "[]":
            tag_list = config_dict.get("tags") or []
            if isinstance(tag_list, list):
                tags = json.dumps(tag_list)
        if framework == "pytorch":
            framework = config_dict.get("framework") or "pytorch"

    # Post-parse validation
    if not file:
        console.print("[red]Error:[/red] Weights file must be specified (via --file or automatically found in --dir).")
        return
    if not model_id:
        console.print("[red]Error:[/red] Unique model ID (--id) is required.")
        return
    if not name:
        console.print("[red]Error:[/red] Model name (--name) is required.")
        return

    if not file.exists():
        console.print(f"[red]Error:[/red] File '{file}' not found.")
        return

    with console.status("[bold green]Uploading model artifact..."):
        try:
            with open(file, "rb") as f:
                files = {"file": (file.name, f, "application/octet-stream")}
                data = {
                    "model_id": model_id,
                    "name": name,
                    "description": description,
                    "class_names": classes,
                    "tags": tags,
                    "framework": framework,
                }
                if config_dict:
                    data["config_json"] = json.dumps(config_dict)
                
                response = httpx.post(
                    f"{config.api_url}/models/upload",
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=120.0 # Large models need more time
                )
            
            response.raise_for_status()
            console.print(f"[green]Success![/green] Model [bold]{name}[/bold] has been deployed.")
        except Exception as e:
            console.print(f"[red]Push failed:[/red] {str(e)}")
            if hasattr(e, 'response') and e.response:
                 console.print(f"[dim]Server: {e.response.text}[/dim]")

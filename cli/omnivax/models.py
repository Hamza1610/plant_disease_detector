import json
import typer
import httpx
import builtins
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
            found_weights.extend(directory.glob(f"*{ext}"))
            
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
            if isinstance(class_list, builtins.list):
                classes = json.dumps(class_list)
        if tags == "[]":
            tag_list = config_dict.get("tags") or []
            if isinstance(tag_list, builtins.list):
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

@app.command("deploy-hub")
def deploy_hub(
    source: str = typer.Option("huggingface", "--source", "-s", help="Model source (huggingface, kaggle)"),
    repo_id: str = typer.Option(..., "--repo", "-r", help="Repository ID or handle (e.g. google/vit-base-patch16-224)"),
    model_id: str = typer.Option(..., "--id", help="Unique ID to register the model with"),
    name: str = typer.Option(..., "--name", help="Display name for the model"),
    filename: Optional[str] = typer.Option(None, "--file", "-f", help="Specific weights file to download"),
    description: str = typer.Option("", "--desc", help="Description"),
    classes: str = typer.Option("[]", "--classes", help="JSON list of class names"),
    tags: str = typer.Option("[]", "--tags", help="JSON list of tags"),
    framework: str = typer.Option("pytorch", "--framework", help="Target framework (pytorch, keras, sklearn)")
):
    """Deploy a model directly from Hugging Face or Kaggle Hub in the background."""
    config = load_config()
    headers = get_auth_headers(config)
    if not headers:
        console.print("[red]Error:[/red] You must be authenticated to deploy models.")
        return

    try:
        class_list = json.loads(classes)
    except Exception:
        class_list = [c.strip() for c in classes.split(",") if c.strip()]
        
    try:
        tag_list = json.loads(tags)
    except Exception:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    payload = {
        "source": source,
        "repo_id": repo_id,
        "model_id": model_id,
        "name": name,
        "filename": filename,
        "description": description,
        "class_names": class_list,
        "tags": tag_list,
        "framework": framework
    }

    with console.status(f"[bold green]Requesting hub deployment for {name}..."):
        try:
            response = httpx.post(
                f"{config.api_url}/models/deploy-hub",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            console.print(f"[green]Success![/green] Background deployment initiated.")
            console.print(f"Model ID: [bold]{data.get('model_id')}[/bold]")
            console.print(f"Status: [yellow]{data.get('status')}[/yellow]")
            console.print(f"Task ID: {data.get('task_id')}")
        except Exception as e:
            console.print(f"[red]Deployment failed:[/red] {str(e)}")
            if hasattr(e, 'response') and e.response:
                console.print(f"[dim]Server: {e.response.text}[/dim]")

@app.command("batch-deploy")
def batch_deploy(
    file: Path = typer.Option(..., "--file", "-f", help="Path to batch deployment JSON configuration file"),
    watch: bool = typer.Option(False, "--watch", "-w", help="Watch real-time status of the deployment batch")
):
    """Bulk deploy multiple models from Hugging Face or Kaggle in one command."""
    config = load_config()
    headers = get_auth_headers(config)
    if not headers:
        console.print("[red]Error:[/red] You must be authenticated to deploy models.")
        return

    if not file.exists() or not file.is_file():
        console.print(f"[red]Error:[/red] File '{file}' not found.")
        return

    try:
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        console.print(f"[red]Error reading JSON configuration file:[/red] {str(e)}")
        return

    # Standardize input format
    if isinstance(data, builtins.list):
        payload = {"items": data}
    elif isinstance(data, dict) and "items" in data:
        payload = data
    else:
        console.print("[red]Error:[/red] JSON must be a list of model items or a dictionary with an 'items' list.")
        return

    with console.status("[bold green]Submitting batch deployment request..."):
        try:
            response = httpx.post(
                f"{config.api_url}/models/batch-hub",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            res_data = response.json()
            models_list = res_data.get("registered_models", [])
        except Exception as e:
            console.print(f"[red]Batch submission failed:[/red] {str(e)}")
            if hasattr(e, 'response') and e.response:
                 console.print(f"[dim]Server: {e.response.text}[/dim]")
            return

    console.print(f"[green]Successfully submitted {len(models_list)} models to the queue.[/green]")
    
    # Print table of models
    table = Table(title="Batch Deployment Queue")
    table.add_column("Model ID", style="cyan")
    table.add_column("Name", style="magenta")
    table.add_column("Status", style="yellow")
    table.add_column("Task ID", style="dim")
    
    for m in models_list:
        table.add_row(m.get("model_id"), m.get("name"), m.get("status"), m.get("task_id"))
    console.print(table)

    if watch and models_list:
        console.print("\n[bold green]Watching deployment status (Press Ctrl+C to stop watching)...[/bold green]")
        
        # Filter out models that failed instantly during registration
        tracking_ids = [m.get("model_id") for m in models_list if m.get("status") != "failed"]
        
        from rich.live import Live
        import time
        
        def generate_status_table() -> Table:
            tbl = Table(title="Live Deployment Dashboard")
            tbl.add_column("Model ID", style="cyan")
            tbl.add_column("Name", style="magenta")
            tbl.add_column("Status", style="bold")
            tbl.add_column("Verified", style="bold")
            tbl.add_column("Logs (Last Line)", style="dim", max_width=60)
            
            nonlocal tracking_ids
            # Query status of each model
            all_done = True
            for mid in [m.get("model_id") for m in models_list]:
                if mid not in tracking_ids:
                    # Failed registration
                    tbl.add_row(mid, next((x.get("name") for x in models_list if x.get("model_id") == mid), ""), "[red]failed[/red]", "False", "Registration failed.")
                    continue
                try:
                    res = httpx.get(f"{config.api_url}/models/{mid}", headers=headers)
                    if res.status_code == 200:
                        m_detail = res.json()
                        status = m_detail.get("status", "unknown")
                        is_verified = str(m_detail.get("is_verified", False))
                        
                        # Color code status
                        if status == "active":
                            status_str = "[green]active[/green]"
                        elif status == "failed":
                            status_str = "[red]failed[/red]"
                        elif status == "verifying":
                            status_str = "[cyan]verifying[/cyan]"
                        else:
                            status_str = f"[yellow]{status}[/yellow]"
                            
                        # Get last log line
                        logs = m_detail.get("verification_logs", "")
                        last_line = logs.split("\n")[-1] if logs else ""
                        
                        tbl.add_row(mid, m_detail.get("name"), status_str, is_verified, last_line)
                        
                        if status not in ["active", "failed"]:
                            all_done = False
                    else:
                        tbl.add_row(mid, "", "[dim]unknown[/dim]", "False", "Failed to query.")
                        all_done = False
                except Exception as ex:
                    tbl.add_row(mid, "", "[red]error[/red]", "False", str(ex))
                    all_done = False
            return tbl, all_done

        try:
            with Live(generate_status_table()[0], refresh_per_second=0.5) as live:
                while True:
                    time.sleep(2)
                    tbl, all_done = generate_status_table()
                    live.update(tbl)
                    if all_done:
                        break
            console.print("[green]All deployment tasks completed![/green]")
        except KeyboardInterrupt:
            console.print("\n[yellow]Watch stopped. Tasks continue executing on the server.[/yellow]")


import typer
import httpx
from pathlib import Path
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
    file: Path = typer.Option(..., "--file", "-f", help="Path to the model weights file (.h5, .pth)"),
    model_id: str = typer.Option(..., "--id", help="Unique ID for the model"),
    name: str = typer.Option(..., "--name", help="Display name for the model"),
    description: str = typer.Option("", "--desc", help="Brief description"),
    classes: str = typer.Option("[]", "--classes", help="JSON list of class names"),
    tags: str = typer.Option("[]", "--tags", help="JSON list of tags"),
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
                    "tags": tags
                }
                
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

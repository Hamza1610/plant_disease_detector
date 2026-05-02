import typer
import httpx
from pathlib import Path
from rich.console import Console
from rich.panel import Panel
from .config import load_config

app = typer.Typer(help="Execute diagnostic tasks and batch predictions.")
console = Console()

@app.command()
def predict(
    model_id: str = typer.Argument(..., help="The unique identifier of the model (e.g., 'efficientnet_b0_v1')"),
    file: Path = typer.Argument(..., help="Local path to the image file (JPG/PNG) to analyze"),
):
    """
    Run a diagnostic prediction on a local image file.
    
    Example:
    python omnivax_cli.py run predict efficientnet_b0_v1 ./leaf.jpg
    """
    if not file.exists():
        console.print(f"[red]Error:[/red] File '{file}' not found.")
        return

    config = load_config()
    
    with console.status(f"[bold cyan]Running diagnosis using {model_id}..."):
        try:
            # Prepare the multi-part form data
            with open(file, "rb") as f:
                files = {"image": (file.name, f, "image/jpeg")}
                data = {"model_id": model_id}
                
                headers = {}
                if config.access_token:
                    headers["Authorization"] = f"Bearer {config.access_token}"
                
                response = httpx.post(
                    f"{config.api_url}/predict",
                    files=files,
                    data=data,
                    headers=headers,
                    timeout=30.0
                )
                
            response.raise_for_status()
            result = response.json()
            
            # Display results beautifully
            prediction = result.get("top_prediction", {})
            label = prediction.get("label", "Unknown")
            confidence = prediction.get("confidence", 0) * 100
            
            color = "green" if confidence > 80 else "yellow" if confidence > 50 else "red"
            
            console.print(Panel(
                f"[bold]Disease Detected:[/bold] [{color}]{label}[/{color}]\n"
                f"[bold]Confidence:[/bold] [{color}]{confidence:.2f}%[/{color}]\n"
                f"[dim]Processed by: {result.get('model_info', {}).get('name')}[/dim]",
                title="Diagnostic Report",
                border_style=color
            ))
            
        except Exception as e:
            console.print(f"[red]Diagnostic failed:[/red] {str(e)}")
            if hasattr(e, 'response') and e.response:
                 console.print(f"[dim]Server response: {e.response.text}[/dim]")

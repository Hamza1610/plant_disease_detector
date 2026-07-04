import typer
import httpx
from rich.console import Console
from rich.table import Table
from typing import Optional
from .config import load_config, get_auth_headers

app = typer.Typer(help="Manage your model hub credentials (Hugging Face / Kaggle).")
console = Console()

@app.command("set")
def set_credentials(
    source: str = typer.Option(..., "--source", "-s", help="The source: 'huggingface' or 'kaggle'"),
    token: Optional[str] = typer.Option(None, "--token", "-t", help="Hugging Face API token"),
    username: Optional[str] = typer.Option(None, "--username", "-u", help="Kaggle username"),
    key: Optional[str] = typer.Option(None, "--key", "-k", help="Kaggle API key"),
):
    """
    Configure credentials for Hugging Face or Kaggle.
    """
    config = load_config()
    headers = get_auth_headers(config)
    if not headers:
        console.print("[red]Error:[/red] You must be logged in to configure credentials.")
        return

    source_val = source.lower()
    if source_val not in ["huggingface", "kaggle"]:
        console.print("[red]Error:[/red] Source must be 'huggingface' or 'kaggle'.")
        return

    payload = {"source": source_val}

    if source_val == "huggingface":
        token_val = token or typer.prompt("Hugging Face Token", hide_input=True)
        payload["token"] = token_val
    else: # kaggle
        user_val = username or typer.prompt("Kaggle Username")
        key_val = key or typer.prompt("Kaggle API Key", hide_input=True)
        payload["username"] = user_val
        payload["key"] = key_val

    try:
        with console.status(f"[bold cyan]Validating and saving credentials for {source_val}..."):
            response = httpx.post(f"{config.api_url}/auth/credentials", json=payload, headers=headers, timeout=15.0)
            
        if response.status_code == 400:
            console.print(f"[red]Validation failed:[/red] {response.json().get('detail')}")
            return
            
        response.raise_for_status()
        data = response.json()
        
        console.print(f"[green]Success![/green] Credentials configured for [bold]{source_val}[/bold].")
        console.print(f"Masked Token/Key: [bold yellow]{data['token_masked']}[/bold yellow]")
        if data.get("username"):
            console.print(f"Kaggle Username: [bold cyan]{data['username']}[/bold cyan]")
            
    except Exception as e:
        console.print(f"[red]Failed to configure credentials:[/red] {str(e)}")
        if hasattr(e, 'response') and e.response:
            console.print(f"[dim]Server response: {e.response.text}[/dim]")

@app.command("list")
def list_credentials():
    """
    List all configured model hub credentials.
    """
    config = load_config()
    headers = get_auth_headers(config)
    if not headers:
        console.print("[red]Error:[/red] You must be logged in to view credentials.")
        return

    try:
        response = httpx.get(f"{config.api_url}/auth/credentials", headers=headers)
        response.raise_for_status()
        creds = response.json()

        if not creds:
            console.print("[yellow]No model hub credentials configured.[/yellow]")
            return

        table = Table(title="Model Hub Credentials")
        table.add_column("Source", style="cyan", bold=True)
        table.add_column("Username (Kaggle)", style="magenta")
        table.add_column("Token (Masked)", style="yellow")
        table.add_column("Status")
        table.add_column("Last Configured", style="dim")

        for c in creds:
            status = "[green]Valid[/green]" if c["is_valid"] else "[red]Invalid / Expired[/red]"
            username_val = c.get("username") or "N/A"
            table.add_row(
                c["source"].upper(),
                username_val,
                c["token_masked"],
                status,
                c["updated_at"][:10]
            )

        console.print(table)
    except Exception as e:
        console.print(f"[red]Failed to list credentials:[/red] {str(e)}")

@app.command("delete")
def delete_credentials(
    source: str = typer.Argument(..., help="The source: 'huggingface' or 'kaggle'")
):
    """
    Revoke and delete credentials for a source.
    """
    config = load_config()
    headers = get_auth_headers(config)
    if not headers:
        console.print("[red]Error:[/red] You must be logged in to delete credentials.")
        return

    source_val = source.lower()
    if source_val not in ["huggingface", "kaggle"]:
        console.print("[red]Error:[/red] Source must be 'huggingface' or 'kaggle'.")
        return

    if not typer.confirm(f"Are you sure you want to delete credentials for {source_val}?"):
        return

    try:
        response = httpx.delete(f"{config.api_url}/auth/credentials/{source_val}", headers=headers)
        response.raise_for_status()
        console.print(f"[green]Credentials for '{source_val}' deleted successfully.[/green]")
    except Exception as e:
        console.print(f"[red]Failed to delete credentials:[/red] {str(e)}")

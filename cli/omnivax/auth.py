import typer
from rich.console import Console
from supabase import create_client, Client
from .config import load_config, save_config, clear_config, CliConfig

app = typer.Typer(help="Manage Omnivax authentication.")
console = Console()

@app.command()
def login(
    url: str = typer.Option(None, "--url", help="Supabase Project URL"),
    key: str = typer.Option(None, "--key", help="Supabase Anon/Publishable Key"),
):
    """Log in to your Omnivax account."""
    config = load_config()
    
    # Update Supabase config if provided
    if url: config.supabase_url = url
    if key: config.supabase_key = key
    
    if not config.supabase_url or not config.supabase_key:
        console.print("[red]Error:[/red] Supabase URL and Key must be configured.")
        console.print("Run: [bold]omnivax auth login --url <URL> --key <KEY>[/bold]")
        return

    email = typer.prompt("Email")
    password = typer.prompt("Password", hide_input=True)

    try:
        supabase: Client = create_client(config.supabase_url, config.supabase_key)
        res = supabase.auth.sign_in_with_password({"email": email, "password": password})
        
        config.access_token = res.session.access_token
        save_config(config)
        
        console.print(f"[green]Success![/green] Logged in as {email}")
    except Exception as e:
        console.print(f"[red]Login failed:[/red] {str(e)}")

@app.command()
def logout():
    """Clear local authentication session."""
    clear_config()
    console.print("[yellow]Logged out successfully.[/yellow]")

@app.command()
def whoami():
    """Display current session information."""
    config = load_config()
    if not config.access_token:
        console.print("[yellow]Not logged in.[/yellow]")
        return
        
    try:
        supabase: Client = create_client(config.supabase_url, config.supabase_key)
        user = supabase.auth.get_user(config.access_token)
        console.print(f"Logged in as: [bold cyan]{user.user.email}[/bold cyan]")
        console.print(f"User ID: [dim]{user.user.id}[/dim]")
    except Exception as e:
        console.print(f"[red]Session invalid or expired.[/red]")
        clear_config()

import httpx
from rich.table import Table

keys_app = typer.Typer(help="Manage your API keys.")
app.add_typer(keys_app, name="keys")

@keys_app.command("create")
def create_key(name: str = typer.Argument(..., help="A descriptive name for the key")):
    """Generate a new long-lived API key."""
    config = load_config()
    if not config.access_token:
        console.print("[red]Error:[/red] You must be logged in to create API keys.")
        return

    try:
        response = httpx.post(f"{config.api_url}/auth/api-keys?name={name}", headers={"Authorization": f"Bearer {config.access_token}"})
        response.raise_for_status()
        data = response.json()
        console.print(f"[green]Key created successfully![/green]")
        console.print(f"Name: [bold]{data['name']}[/bold]")
        console.print(f"API Key: [bold yellow]{data['api_key']}[/bold yellow]")
        console.print("[red]IMPORTANT:[/red] Copy this key now! You will not be able to see it again.")
    except Exception as e:
        console.print(f"[red]Failed to create key:[/red] {str(e)}")

@keys_app.command("list")
def list_keys():
    """List all your active and inactive API keys."""
    config = load_config()
    if not config.access_token:
        console.print("[red]Error:[/red] You must be logged in to list API keys.")
        return

    try:
        response = httpx.get(f"{config.api_url}/auth/api-keys", headers={"Authorization": f"Bearer {config.access_token}"})
        response.raise_for_status()
        keys = response.json()
        
        table = Table(title="Your API Keys")
        table.add_column("ID", style="dim")
        table.add_column("Name", style="cyan")
        table.add_column("Prefix", style="yellow")
        table.add_column("Status")
        table.add_column("Last Used", style="dim")

        for k in keys:
            status = "[green]Active[/green]" if k["is_active"] else "[red]Inactive[/red]"
            table.add_row(k["id"][:8], k["name"], k["prefix"], status, k["last_used_at"] or "Never")
        
        console.print(table)
    except Exception as e:
        console.print(f"[red]Failed to list keys:[/red] {str(e)}")

@keys_app.command("revoke")
def revoke_key(key_id: str = typer.Argument(..., help="The ID (or prefix) of the key to revoke")):
    """Permanently delete an API key."""
    config = load_config()
    # Need full ID for exact match, or we could handle search in future
    try:
        response = httpx.delete(f"{config.api_url}/auth/api-keys/{key_id}", headers={"Authorization": f"Bearer {config.access_token}"})
        response.raise_for_status()
        console.print("[green]Key revoked successfully.[/green]")
    except Exception as e:
        console.print(f"[red]Failed to revoke key:[/red] {str(e)}")

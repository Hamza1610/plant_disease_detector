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

import sys
from pathlib import Path

# Resolve the workspace root directory (parent of cli/)
workspace_root = Path(__file__).resolve().parent.parent.parent
if str(workspace_root) not in sys.path:
    sys.path.insert(0, str(workspace_root))

import typer
import uvicorn
import asyncio
import threading
import time
import webbrowser
from agent.client import chat_loop

app = typer.Typer(
    help="Manage the offline developer helper agent.",
    no_args_is_help=True
)

@app.command("start")
def start(
    port: int = typer.Option(8088, "--port", "-p", help="Port to run the agent server on."),
    host: str = typer.Option("127.0.0.1", "--host", "-h", help="Host address to run the agent server on."),
    open_browser: bool = typer.Option(True, "--open-browser", help="Automatically open the frontend agent dashboard.")
):
    """
    Starts the local developer agent WebSocket server.
    """
    typer.echo(f"Starting Omnivax Agent Server on ws://{host}:{port}/ws...")
    
    if open_browser:
        def open_url():
            # Wait for uvicorn to bind and start accepting connections
            time.sleep(1.5)
            # Open the agent's own standalone dashboard
            webbrowser.open(f"http://localhost:{port}")
            
        threading.Thread(target=open_url, daemon=True).start()

    uvicorn.run("agent.server:app", host=host, port=port, log_level="info")

@app.command("chat")
def chat(
    server_url: str = typer.Option("ws://127.0.0.1:8088/ws", "--server-url", "-s", help="Target WebSocket server URL."),
    session_id: str = typer.Option(None, "--session-id", "-id", help="Session ID of a past conversation to resume.")
):
    """
    Starts an interactive terminal chat session with the running helper agent.
    """
    try:
        asyncio.run(chat_loop(server_url, session_id))
    except KeyboardInterrupt:
        typer.echo("\nSession aborted by user. Goodbye!")

@app.command("history")
def history(
    server_url: str = typer.Option("http://127.0.0.1:8088", "--server-url", "-s", help="Target Agent HTTP server URL.")
):
    """
    Lists all locally saved chat sessions and their metadata.
    """
    import httpx
    from rich.table import Table
    from rich.console import Console

    console = Console()
    try:
        response = httpx.get(f"{server_url}/sessions", timeout=5.0)
        if response.status_code != 200:
            console.print(f"[bold red]Failed to fetch history:[/bold red] Server returned status code {response.status_code}")
            return
        
        sessions = response.json()
        if not sessions:
            console.print("[yellow]No saved conversation history found.[/yellow]")
            return
        
        table = Table(title="[bold magenta]Omnivax Agent Chat History[/bold magenta]")
        table.add_column("Session ID", style="cyan")
        table.add_column("Title", style="white")
        table.add_column("Updated At", style="green")
        table.add_column("Status", style="yellow")
        
        for sess in sessions:
            table.add_row(
                sess.get("session_id", ""),
                sess.get("title", ""),
                sess.get("updated_at", ""),
                sess.get("status", "")
            )
        console.print(table)
        console.print("\nTo resume a session, run:")
        console.print("[bold green]  omnivax agent chat --session-id <session_id>[/bold green]")
    except httpx.RequestError:
        console.print(f"[bold red]Could not connect to the agent server at {server_url}.[/bold red]")
        console.print("[yellow]Please ensure the server is running with 'omnivax agent start'[/yellow]")

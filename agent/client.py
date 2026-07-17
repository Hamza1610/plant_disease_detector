import asyncio
import sys
import websockets
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.text import Text

console = Console()

from typing import Optional

async def chat_loop(server_url: str = "ws://127.0.0.1:8088/ws", session_id: Optional[str] = None):
    url = server_url
    if session_id:
        url += f"?session_id={session_id}"
        
    console.print(f"[bold green]Connecting to Omnivax Helper Agent Server at {url}...[/bold green]")
    
    try:
        async with websockets.connect(url) as websocket:
            console.print("[bold cyan]Connected![/bold cyan]")
            console.print(Panel(
                Text("Welcome to the Interactive Omnivax Agent Workspace!\n"
                     "You can talk to the agent to scan models, generate configs, run tests, and push them.\n"
                     "Type 'exit' or 'quit' to close the session.", justify="center"),
                title="[bold magenta]Omnivax Self-Agent Console[/bold magenta]",
                border_style="magenta"
            ))
            
            # Initial communication and history loading loop
            active_session_id = session_id
            while True:
                response = await websocket.recv()
                
                # Check for session ID metadata
                if response.startswith("[Session ID]:"):
                    active_session_id = response.replace("[Session ID]:", "").strip()
                    console.print(f"[dim gray]Session ID: {active_session_id}[/dim gray]")
                    continue
                
                # Check for history messages
                if response.startswith("[History user]:"):
                    msg = response.replace("[History user]:", "").strip()
                    console.print(f"\n[bold yellow]You:[/bold yellow] {msg}")
                    continue
                elif response.startswith("[History agent]:"):
                    msg = response.replace("[History agent]:", "").strip()
                    if msg.startswith("[Agent Status]:"):
                        console.print(f"[dim cyan]{msg}[/dim cyan]")
                    else:
                        console.print(f"\n[bold magenta]Agent:[/bold magenta] {msg}")
                    continue
                elif response.startswith("[History system]:"):
                    msg = response.replace("[History system]:", "").strip()
                    # Print tools return logs with dim styling
                    console.print(f"[dim italic gray]{msg}[/dim italic gray]")
                    continue
                elif response == "[History End]":
                    console.print("[dim gray]---- History Restore Complete ----[/dim gray]")
                    continue
                
                # First non-history greeting message
                if response.startswith("[Agent Status]:"):
                    console.print(f"[dim cyan]{response}[/dim cyan]")
                else:
                    console.print(f"\n[bold magenta]Agent:[/bold magenta] {response}")
                break
            
            while True:
                user_input = Prompt.ask("\n[bold yellow]You[/bold yellow]")
                if user_input.strip().lower() in ("exit", "quit"):
                    console.print("[bold yellow]Closing session. Goodbye![/bold yellow]")
                    break
                
                if not user_input.strip():
                    continue
                
                # Send to agent
                await websocket.send(user_input)
                
                # Receive responses (loop to handle status updates before final response)
                while True:
                    response = await websocket.recv()
                    if response.startswith("[Agent Status]:"):
                        console.print(f"[dim cyan]{response}[/dim cyan]")
                    elif response.startswith("Error") or response.startswith("Connection error"):
                        console.print(f"[bold red]{response}[/bold red]")
                        break
                    else:
                        console.print(f"\n[bold magenta]Agent:[/bold magenta] {response}")
                        break
                        
    except ConnectionRefusedError:
        console.print("[bold red]Connection Refused:[/bold red] Could not connect to the agent server.")
        console.print("[yellow]Please ensure the server is running by executing:[/yellow]")
        console.print("  omnivax agent start")
    except Exception as e:
        console.print(f"[bold red]Disconnected due to error:[/bold red] {str(e)}")

if __name__ == "__main__":
    try:
        asyncio.run(chat_loop())
    except KeyboardInterrupt:
        console.print("\n[bold yellow]Session aborted by user. Goodbye![/bold yellow]")

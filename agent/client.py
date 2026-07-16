import asyncio
import sys
import websockets
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.text import Text

console = Console()

async def chat_loop():
    url = "ws://127.0.0.1:8088/ws"
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
            
            # Initial prompt/help from the agent
            initial_msg = await websocket.recv()
            console.print(f"\n[bold magenta]Agent:[/bold magenta] {initial_msg}")
            
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
        console.print("[yellow]Please ensure the server is running on port 8088 by executing:[/yellow]")
        console.print("  python agent/server.py")
    except Exception as e:
        console.print(f"[bold red]Disconnected due to error:[/bold red] {str(e)}")

if __name__ == "__main__":
    try:
        asyncio.run(chat_loop())
    except KeyboardInterrupt:
        console.print("\n[bold yellow]Session aborted by user. Goodbye![/bold yellow]")

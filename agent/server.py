import os
import json
import traceback
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
import uvicorn
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load env variables from root .env file
root_dir = Path(__file__).parent.parent
from datetime import datetime, timezone

load_dotenv(dotenv_path=root_dir / ".env")

app = FastAPI(title="Omnivax Helper Agent Server")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

class SessionManager:
    history_dir = Path(__file__).parent / "history"

    @classmethod
    def ensure_dir(cls):
        cls.history_dir.mkdir(parents=True, exist_ok=True)

    @classmethod
    def create_session(cls, session_id: str, title: str = "New Chat") -> Dict[str, Any]:
        cls.ensure_dir()
        session_data = {
            "session_id": session_id,
            "title": title,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "status": "active",
            "messages": []
        }
        cls.save_session(session_id, session_data)
        return session_data

    @classmethod
    def get_session(cls, session_id: str) -> Optional[Dict[str, Any]]:
        cls.ensure_dir()
        file_path = cls.history_dir / f"{session_id}.json"
        if not file_path.exists():
            return None
        try:
            return json.loads(file_path.read_text(encoding="utf-8"))
        except Exception:
            return None

    @classmethod
    def save_session(cls, session_id: str, data: Dict[str, Any]):
        cls.ensure_dir()
        file_path = cls.history_dir / f"{session_id}.json"
        try:
            data["updated_at"] = datetime.now(timezone.utc).isoformat()
            file_path.write_text(json.dumps(data, indent=2), encoding="utf-8")
        except Exception as e:
            print(f"Error saving session {session_id}: {str(e)}")

    @classmethod
    def list_sessions(cls) -> List[Dict[str, Any]]:
        cls.ensure_dir()
        sessions = []
        for file_path in cls.history_dir.glob("*.json"):
            try:
                data = json.loads(file_path.read_text(encoding="utf-8"))
                sessions.append({
                    "session_id": data.get("session_id"),
                    "title": data.get("title", "Untitled Chat"),
                    "created_at": data.get("created_at"),
                    "updated_at": data.get("updated_at"),
                    "status": data.get("status", "active")
                })
            except Exception:
                pass
        # Sort by updated_at descending
        sessions.sort(key=lambda s: s.get("updated_at", ""), reverse=True)
        return sessions

    @classmethod
    def add_message(cls, session_id: str, sender: str, text: str):
        session_data = cls.get_session(session_id)
        if not session_data:
            session_data = cls.create_session(session_id)
        
        # If this is the first user message, use it to generate the title
        if sender == "user" and (not session_data.get("title") or session_data["title"] == "New Chat"):
            title = text[:30] + "..." if len(text) > 30 else text
            session_data["title"] = title

        session_data["messages"].append({
            "sender": sender,
            "text": text
        })
        cls.save_session(session_id, session_data)


class FilesystemMCP:
    """Standard Filesystem MCP-like operations for local developer workflow."""
    @staticmethod
    def list_directory(relative_path: str = ".") -> List[str]:
        """Lists files and directories in the project workspace."""
        target_dir = root_dir / relative_path
        if not target_dir.exists():
            return [f"Error: Directory '{relative_path}' does not exist."]
        return [str(p.relative_to(root_dir)) for p in target_dir.iterdir()]

    @staticmethod
    def read_file(relative_path: str) -> str:
        """Reads content of a file in the project workspace."""
        target_file = root_dir / relative_path
        if not target_file.exists() or not target_file.is_file():
            return f"Error: File '{relative_path}' not found."
        try:
            return target_file.read_text(encoding="utf-8")
        except Exception as e:
            return f"Error reading file: {str(e)}"

    @staticmethod
    def write_file(relative_path: str, content: str) -> str:
        """Writes content to a file in the project workspace."""
        target_file = root_dir / relative_path
        try:
            target_file.parent.mkdir(parents=True, exist_ok=True)
            target_file.write_text(content, encoding="utf-8")
            return f"Success: Wrote file to '{relative_path}'."
        except Exception as e:
            return f"Error writing file: {str(e)}"

    @staticmethod
    def delete_file(relative_path: str) -> str:
        """Deletes a file in the project workspace."""
        target_file = root_dir / relative_path
        if not target_file.exists() or not target_file.is_file():
            return f"Error: File '{relative_path}' not found."
        try:
            target_file.unlink()
            return f"Success: Deleted file '{relative_path}'."
        except Exception as e:
            return f"Error deleting file: {str(e)}"


# Define local tools to expose to the LLM
def list_directory(relative_path: str = ".") -> str:
    """Lists files and subdirectories in the local workspace directory."""
    return json.dumps(FilesystemMCP.list_directory(relative_path))

def read_file(relative_path: str) -> str:
    """Reads the content of a file from the workspace."""
    return FilesystemMCP.read_file(relative_path)

def write_file(relative_path: str, content: str) -> str:
    """Writes the content to a file in the workspace."""
    return FilesystemMCP.write_file(relative_path, content)

def delete_file(relative_path: str) -> str:
    """Deletes a file in the workspace."""
    return FilesystemMCP.delete_file(relative_path)

def run_local_test(config_path: str) -> str:
    """
    Runs a local validation test of a model using the generated configuration.
    Executes the test runner to simulate pre-processing and model loading.
    """
    test_runner_path = Path(__file__).parent / "test_runner.py"
    try:
        # Run test runner in the workspace venv python executable
        python_exe = str(root_dir / ".venv" / "bin" / "python")
        if not Path(python_exe).exists():
            python_exe = "python" # Fallback

        res = subprocess.run(
            [python_exe, str(test_runner_path), config_path],
            capture_output=True,
            text=True,
            cwd=str(root_dir)
        )
        output = f"Stdout:\n{res.stdout}\nStderr:\n{res.stderr}"
        if res.returncode == 0:
            return f"Validation Passed:\n{output}"
        else:
            return f"Validation Failed (exit code {res.returncode}):\n{output}"
    except Exception as e:
        return f"Error executing local validation run: {str(e)}\n{traceback.format_exc()}"

def push_model_config(config_path: str) -> str:
    """
    Submits a finalized config.json to the local Omnivax backend server to register the model.
    """
    try:
        cfg_content = FilesystemMCP.read_file(config_path)
        if cfg_content.startswith("Error"):
            return cfg_content
        
        cfg_dict = json.loads(cfg_content)
        # Call backend API
        import httpx
        api_url = "http://localhost:8000/models" # standard local domain
        
        # Deploy from Hub
        payload = {
            "source": cfg_dict["model_source"]["hub"],
            "repo_id": cfg_dict["model_source"]["repo_id"],
            "model_id": cfg_dict["model_id"],
            "name": cfg_dict["name"],
            "filename": cfg_dict["model_source"].get("filename"),
            "description": cfg_dict.get("description", ""),
            "class_names": cfg_dict.get("output_schema", {}).get("parameters", {}).get("classification", {}).get("class_names") or [],
            "tags": cfg_dict.get("tags") or [],
            "framework": cfg_dict.get("framework", "pytorch")
        }
        
        response = httpx.post(f"{api_url}/deploy-hub", json=payload, timeout=20.0)
        if response.status_code in (200, 201):
            return f"Success! Model pushed and registered successfully: {response.text}"
        else:
            return f"Failed to push model config (status {response.status_code}): {response.text}"
    except Exception as e:
        return f"Error pushing model config: {str(e)}"

# Combine all tools
mcp_tools = [list_directory, read_file, write_file, delete_file, run_local_test, push_model_config]

@app.get("/", response_class=HTMLResponse)
async def get_index():
    index_path = Path(__file__).parent / "index.html"
    if index_path.exists():
        return index_path.read_text(encoding="utf-8")
    return "<h1>Omnivax Agent Server Active</h1>"

@app.get("/sessions")
def list_sessions():
    return SessionManager.list_sessions()

@app.get("/sessions/{session_id}")
def get_session(session_id: str):
    session_data = SessionManager.get_session(session_id)
    if not session_data:
        return {"error": "Session not found"}, 404
    return session_data

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, session_id: Optional[str] = None):
    await websocket.accept()
    if not GEMINI_API_KEY:
        await websocket.send_text("Error: GEMINI_API_KEY environment variable is not set. Please set it in your .env file.")
        await websocket.close()
        return

    # Initialize or load session
    is_resumed = False
    past_messages = []
    if session_id:
        session_data = SessionManager.get_session(session_id)
        if session_data:
            is_resumed = True
            past_messages = session_data.get("messages", [])
        else:
            session_id = f"session_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
            SessionManager.create_session(session_id)
    else:
        session_id = f"session_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}"
        SessionManager.create_session(session_id)

    # Send session ID to the client first
    await websocket.send_text(f"[Session ID]: {session_id}")

    # Send history to client if resuming
    if is_resumed:
        for msg in past_messages:
            sender = msg["sender"]
            text = msg["text"]
            await websocket.send_text(f"[History {sender}]: {text}")
        await websocket.send_text("[History End]")

    # Build history context for Gemini chat
    history_parts = []
    for msg in past_messages:
        role = "user" if msg["sender"] == "user" else "model"
        # Only pass user and model/agent text, filtering out system results and status updates
        if msg["sender"] in ("user", "agent") and not msg["text"].startswith("[Agent Status]:"):
            history_parts.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=msg["text"])]
                )
            )

    # Initialize Gemini client
    client = genai.Client(api_key=GEMINI_API_KEY)
    chat = client.chats.create(
        model="gemini-2.5-flash",
        history=history_parts,
        config=types.GenerateContentConfig(
            system_instruction="""You are the Omnivax Developer Helper Agent.
Your task is to help the developer inspect files, generate config.json declarations, execute model verification tests locally, and push finalized model configs to the platform.
You have access to filesystem tools and a test runner tool.
When the user requests to configure or inspect a model:
1. Scan the model files and metadata using `list_directory` and `read_file`.
2. Infer the framework, weights file format, input modality, and classes.
3. Automatically generate the standard config.json schema and write it.
4. Run `run_local_test` to verify it passes local loading and preprocessing checks.
5. If it fails, examine the traceback output, fix the config, and retry until validation passes.
6. Present the final configuration structure to the user.
7. Call `push_model_config` to submit it to the backend once final approval is given.
Talk to the developer turn-by-turn to clarify details if any data is missing. Keep responses concise.""",
            tools=[types.Tool(function_declarations=[
                types.FunctionDeclaration(
                    name="list_directory",
                    description="Lists files in a workspace directory.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "relative_path": types.Schema(type=types.Type.STRING, description="Relative path from workspace root.")
                        }
                    )
                ),
                types.FunctionDeclaration(
                    name="read_file",
                    description="Reads file content.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "relative_path": types.Schema(type=types.Type.STRING, description="Relative path of file.")
                        },
                        required=["relative_path"]
                    )
                ),
                types.FunctionDeclaration(
                    name="write_file",
                    description="Creates or overwrites a file with content.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "relative_path": types.Schema(type=types.Type.STRING, description="Relative path of file."),
                            "content": types.Schema(type=types.Type.STRING, description="File content to write.")
                        },
                        required=["relative_path", "content"]
                    )
                ),
                types.FunctionDeclaration(
                    name="delete_file",
                    description="Deletes a file.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "relative_path": types.Schema(type=types.Type.STRING, description="Relative path of file.")
                        },
                        required=["relative_path"]
                    )
                ),
                types.FunctionDeclaration(
                    name="run_local_test",
                    description="Runs local validation run check on the model config.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "config_path": types.Schema(type=types.Type.STRING, description="Relative path to config.json.")
                        },
                        required=["config_path"]
                    )
                ),
                types.FunctionDeclaration(
                    name="push_model_config",
                    description="Pushes/registers model config to backend server.",
                    parameters=types.Schema(
                        type=types.Type.OBJECT,
                        properties={
                            "config_path": types.Schema(type=types.Type.STRING, description="Relative path to config.json.")
                        },
                        required=["config_path"]
                    )
                )
            ])]
        )
    )

    try:
        if is_resumed:
            resumed_msg = f"[Agent Status]: Resumed session {session_id}."
            await websocket.send_text(resumed_msg)
            # Add to memory history
            SessionManager.add_message(session_id, "agent", resumed_msg)
            
            welcome_back = f"Welcome back! Conversation session {session_id} has been restored. How can I help you next?"
            await websocket.send_text(welcome_back)
            SessionManager.add_message(session_id, "agent", welcome_back)
        else:
            greeting = "Hello! I am your offline workspace assistant. I can scan your directories, draft declarative config.json specifications, validate model inputs, and deploy them directly."
            await websocket.send_text(greeting)
            SessionManager.add_message(session_id, "agent", greeting)
        
        while True:
            # Receive user query
            user_message = await websocket.receive_text()
            SessionManager.add_message(session_id, "user", user_message)
            
            # Send message to Gemini chat session
            response = chat.send_message(user_message)
            
            # Handle tool calls loop
            while response.function_calls:
                tool_responses = []
                for call in response.function_calls:
                    name = call.name
                    args = call.args
                    
                    status_msg = f"[Agent Status]: Invoking tool '{name}' with args {args}..."
                    await websocket.send_text(status_msg)
                    SessionManager.add_message(session_id, "agent", status_msg)
                    
                    # Execute corresponding tool function
                    result_str = ""
                    try:
                        if name == "list_directory":
                            result_str = list_directory(**args)
                        elif name == "read_file":
                            result_str = read_file(**args)
                        elif name == "write_file":
                            result_str = write_file(**args)
                        elif name == "delete_file":
                            result_str = delete_file(**args)
                        elif name == "run_local_test":
                            result_str = run_local_test(**args)
                        elif name == "push_model_config":
                            result_str = push_model_config(**args)
                        else:
                            result_str = f"Error: Unknown tool '{name}'"
                    except Exception as err:
                        result_str = f"Error executing tool '{name}': {str(err)}"
                    
                    SessionManager.add_message(session_id, "system", f"Tool '{name}' returned: {result_str}")
                    
                    tool_responses.append(types.Part.from_function_response(
                        name=name,
                        response={"result": result_str}
                    ))
                
                # Send tool executions feedback back to Gemini
                response = chat.send_message(tool_responses)
            
            # Send final text response to the client
            final_text = response.text
            await websocket.send_text(final_text)
            SessionManager.add_message(session_id, "agent", final_text)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(f"Connection error: {str(e)}")
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run("agent.server:app", host="127.0.0.1", port=8088, log_level="info")

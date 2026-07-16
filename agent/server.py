import os
import json
import traceback
import subprocess
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load env variables from root .env file
root_dir = Path(__file__).parent.parent
load_dotenv(dotenv_path=root_dir / ".env")

app = FastAPI(title="Omnivax Helper Agent Server")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

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

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    if not GEMINI_API_KEY:
        await websocket.send_text("Error: GEMINI_API_KEY environment variable is not set. Please set it in your .env file.")
        await websocket.close()
        return

    # Initialize Gemini client
    client = genai.Client(api_key=GEMINI_API_KEY)
    chat = client.chats.create(
        model="gemini-2.5-flash",
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
        while True:
            # Receive user query
            user_message = await websocket.receive_text()
            
            # Send message to Gemini chat session
            response = chat.send_message(user_message)
            
            # Handle tool calls loop
            while response.function_calls:
                tool_responses = []
                for call in response.function_calls:
                    name = call.name
                    args = call.args
                    
                    await websocket.send_text(f"[Agent Status]: Invoking tool '{name}' with args {args}...")
                    
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
                    
                    tool_responses.append(types.Part.from_function_response(
                        name=name,
                        response={"result": result_str}
                    ))
                
                # Send tool executions feedback back to Gemini
                response = chat.send_message(tool_responses)
            
            # Send final text response to the client
            await websocket.send_text(response.text)
            
    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.send_text(f"Connection error: {str(e)}")
        await websocket.close()

if __name__ == "__main__":
    uvicorn.run("server:app", host="127.0.0.1", port=8088, log_level="info")

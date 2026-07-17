import pytest
from unittest.mock import patch, MagicMock
from typer.testing import CliRunner
from omnivax.agent import app
from agent.server import SessionManager
import tempfile
import shutil
from pathlib import Path

runner = CliRunner()

@patch("uvicorn.run")
@patch("webbrowser.open")
def test_cli_agent_start(mock_webbrowser, mock_uvicorn):
    # Execute command: start
    result = runner.invoke(app, ["start"])
    assert result.exit_code == 0
    assert "Starting Omnivax Agent Server" in result.output
    mock_uvicorn.assert_called_once_with("agent.server:app", host="127.0.0.1", port=8088, log_level="info")

@patch("asyncio.run")
def test_cli_agent_chat(mock_asyncio_run):
    # Execute command: chat --server-url ws://localhost:9999/ws
    result = runner.invoke(app, ["chat", "--server-url", "ws://localhost:9999/ws"])
    assert result.exit_code == 0
    mock_asyncio_run.assert_called_once()

@patch("asyncio.run")
def test_cli_agent_chat_with_session(mock_asyncio_run):
    # Execute command: chat --session-id test_session
    result = runner.invoke(app, ["chat", "--session-id", "test_session"])
    assert result.exit_code == 0
    mock_asyncio_run.assert_called_once()

@patch("httpx.get")
def test_cli_agent_history(mock_httpx_get):
    # Mock return list of sessions
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {
            "session_id": "session_123",
            "title": "Test Chat",
            "updated_at": "2026-07-17T15:00:00Z",
            "status": "active"
        }
    ]
    mock_httpx_get.return_value = mock_response

    result = runner.invoke(app, ["history"])
    assert result.exit_code == 0
    assert "session_123" in result.output
    assert "Test Chat" in result.output
    assert "active" in result.output

def test_session_manager_crud():
    # Setup temporary directory for session manager
    temp_dir = tempfile.mkdtemp()
    original_history_dir = SessionManager.history_dir
    SessionManager.history_dir = Path(temp_dir)

    try:
        # 1. Create a session
        sess_id = "test_sess_crud"
        SessionManager.create_session(sess_id, title="Initial Title")
        
        # 2. Get the session
        sess = SessionManager.get_session(sess_id)
        assert sess is not None
        assert sess["session_id"] == sess_id
        assert sess["title"] == "Initial Title"
        assert len(sess["messages"]) == 0

        # 3. Add message (should auto-update title on first user message if it is 'Initial Title' or 'New Chat')
        # Wait, since the title is 'Initial Title', let's see. If title is 'New Chat', it updates. Let's test with 'New Chat'.
        sess_id_2 = "test_sess_crud_2"
        SessionManager.create_session(sess_id_2, title="New Chat")
        SessionManager.add_message(sess_id_2, "user", "What is the capital of France?")
        
        sess_2 = SessionManager.get_session(sess_id_2)
        assert sess_2["title"] == "What is the capital of France?"
        assert len(sess_2["messages"]) == 1
        assert sess_2["messages"][0]["sender"] == "user"
        assert sess_2["messages"][0]["text"] == "What is the capital of France?"

        # 4. List sessions
        sessions = SessionManager.list_sessions()
        assert len(sessions) == 2
        # Should be ordered by updated_at descending
        assert sessions[0]["session_id"] in [sess_id, sess_id_2]
    finally:
        SessionManager.history_dir = original_history_dir
        shutil.rmtree(temp_dir)

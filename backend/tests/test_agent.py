import os
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Mock genai client before importing agent.server
with patch("google.genai.Client") as mock_client:
    from agent.server import app, list_directory, read_file, write_file, delete_file

def test_filesystem_mcp_list_directory(tmp_path):
    with patch("agent.server.root_dir", tmp_path):
        # Create some dummy files in tmp_path
        (tmp_path / "model.safetensors").touch()
        (tmp_path / "config.json").touch()
        (tmp_path / "subdir").mkdir()
        (tmp_path / "subdir" / "nested.txt").touch()

        res = json.loads(list_directory("."))
        assert "model.safetensors" in res
        assert "config.json" in res
        assert "subdir" in res

        # List nested directory
        res_sub = json.loads(list_directory("subdir"))
        assert "subdir/nested.txt" in res_sub

def test_filesystem_mcp_read_write_delete(tmp_path):
    with patch("agent.server.root_dir", tmp_path):
        # Write file
        write_res = write_file("test.txt", "hello agent")
        assert "Success" in write_res
        assert (tmp_path / "test.txt").read_text() == "hello agent"

        # Read file
        read_res = read_file("test.txt")
        assert read_res == "hello agent"

        # Delete file
        delete_res = delete_file("test.txt")
        assert "Success" in delete_res
        assert not (tmp_path / "test.txt").exists()

def test_websocket_missing_api_key():
    client = TestClient(app)
    with patch("agent.server.GEMINI_API_KEY", None):
        with client.websocket_connect("/ws") as websocket:
            data = websocket.receive_text()
            assert "Error" in data

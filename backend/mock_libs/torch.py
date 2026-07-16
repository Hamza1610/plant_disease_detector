import sys
from unittest.mock import MagicMock

class Tensor:
    pass

class Module:
    def __init__(self, *args, **kwargs):
        pass
    def __call__(self, *args, **kwargs):
        return MagicMock()
    def to(self, *args, **kwargs):
        return self
    def eval(self, *args, **kwargs):
        return self
    def load_state_dict(self, *args, **kwargs):
        pass

class MockLinear:
    def __init__(self, in_features, out_features):
        self.in_features = in_features
        self.out_features = out_features

class NNMock:
    Module = Module
    Linear = MockLinear

nn = NNMock()

class DeviceMock:
    def __init__(self, device_type):
        self.device_type = device_type

def device(device_type):
    return DeviceMock(device_type)

def load(file_path, map_location=None):
    return MagicMock()

def from_numpy(arr):
    return MagicMock()

def no_grad():
    class NoGradContext:
        def __enter__(self): pass
        def __exit__(self, exc_type, exc_val, exc_tb): pass
    return NoGradContext()

def softmax(logits, dim=1):
    mock_val = MagicMock()
    mock_val.__getitem__.return_value.cpu.return_value = MagicMock()
    return mock_val

def topk(probs, k=3):
    mock_values = MagicMock()
    mock_values.tolist.return_value = [0.95, 0.04, 0.01][:k]
    mock_indices = MagicMock()
    mock_indices.tolist.return_value = [0, 1, 2][:k]
    return mock_values, mock_indices

class CudaMock:
    def is_available(self):
        return False
    def empty_cache(self):
        pass

cuda = CudaMock()

from unittest.mock import MagicMock

class MockModels:
    def efficientnet_b0(self, weights=None):
        model = MagicMock()
        model.classifier = [None, MagicMock()]
        model.classifier[1].in_features = 1280
        return model

models = MockModels()

class MockTransforms:
    def Compose(self, transforms_list):
        return lambda x: MagicMock()
    def Resize(self, *args, **kwargs):
        return MagicMock()
    def ToTensor(self, *args, **kwargs):
        return MagicMock()
    def Normalize(self, *args, **kwargs):
        return MagicMock()

transforms = MockTransforms()

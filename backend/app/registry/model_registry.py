import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any


class ModelRegistry:
    def __init__(self, metadata_dir: Path) -> None:
        self.metadata_dir = metadata_dir
        self.models_index_path = metadata_dir / "models.json"
        self.tags_path = metadata_dir / "tags.json"
        self.benchmarks_path = metadata_dir / "benchmarks.json"
        self.pricing_path = metadata_dir / "pricing_tiers.json"
        self.usage_path = metadata_dir / "usage.json"
        self._models_index: list[dict[str, Any]] = []
        self._tags: list[str] = []
        self._benchmarks: list[dict[str, Any]] = []
        self._pricing_tiers: list[dict[str, Any]] = []
        self._usage: dict[str, dict[str, int]] = {}

    def load(self) -> None:
        if not self.models_index_path.exists():
            raise FileNotFoundError(f"Missing models index: {self.models_index_path}")
        self._models_index = json.loads(self.models_index_path.read_text(encoding="utf-8"))
        if self.tags_path.exists():
            self._tags = json.loads(self.tags_path.read_text(encoding="utf-8"))
        if self.benchmarks_path.exists():
            self._benchmarks = json.loads(self.benchmarks_path.read_text(encoding="utf-8"))
        if self.pricing_path.exists():
            self._pricing_tiers = json.loads(self.pricing_path.read_text(encoding="utf-8"))
        if self.usage_path.exists():
            self._usage = json.loads(self.usage_path.read_text(encoding="utf-8"))

    def list_models(self) -> list[dict[str, Any]]:
        return self._models_index

    def list_tags(self) -> list[str]:
        return sorted(set(self._tags))

    def get_model_summary(self, model_id: str) -> dict[str, Any]:
        for model in self._models_index:
            if model["model_id"] == model_id:
                return model
        raise KeyError(f"Model '{model_id}' not found")

    def get_model_detail(self, model_id: str) -> dict[str, Any]:
        summary = self.get_model_summary(model_id)
        metadata_file = self.metadata_dir / summary["metadata_file"]
        if not metadata_file.exists():
            raise FileNotFoundError(f"Missing metadata file: {metadata_file}")
        return json.loads(metadata_file.read_text(encoding="utf-8"))

    def search(self, query: str) -> list[dict[str, Any]]:
        q = query.strip().lower()
        if not q:
            return self._models_index
        matches: list[dict[str, Any]] = []
        for model in self._models_index:
            haystack = " ".join(
                [
                    model["name"],
                    model["description"],
                    " ".join(model["tags"]),
                    " ".join(model["supported_plants"]),
                    " ".join(model["supported_diseases"]),
                ]
            ).lower()
            if q in haystack:
                matches.append(model)
        return matches

    def filter_models(
        self,
        tags: list[str] | None = None,
        plant: str | None = None,
        disease: str | None = None,
        tier: str | None = None,
        status: str | None = None,
    ) -> list[dict[str, Any]]:
        filtered = self._models_index

        if tags:
            wanted = {tag.lower() for tag in tags}
            filtered = [
                m
                for m in filtered
                if wanted.issubset({tag.lower() for tag in m.get("tags", [])})
            ]
        if plant:
            p = plant.lower()
            filtered = [
                m for m in filtered if p in {sp.lower() for sp in m.get("supported_plants", [])}
            ]
        if disease:
            d = disease.lower()
            filtered = [
                m
                for m in filtered
                if any(d in item.lower() for item in m.get("supported_diseases", []))
            ]
        if tier:
            t = tier.lower()
            filtered = [m for m in filtered if m.get("pricing_tier", "").lower() == t]
        if status:
            s = status.lower()
            filtered = [m for m in filtered if m.get("status", "").lower() == s]

        return filtered

    def list_benchmarks(self, model_id: str | None = None) -> list[dict[str, Any]]:
        if not model_id:
            return self._benchmarks
        return [run for run in self._benchmarks if run.get("model_id") == model_id]

    def add_benchmark(self, run: dict[str, Any]) -> dict[str, Any]:
        run_copy = dict(run)
        run_copy.setdefault("created_at", datetime.now(UTC).isoformat())
        self._benchmarks.append(run_copy)
        self.benchmarks_path.write_text(
            json.dumps(self._benchmarks, indent=2),
            encoding="utf-8",
        )
        return run_copy

    def save_models_index(self) -> None:
        self.models_index_path.write_text(
            json.dumps(self._models_index, indent=2),
            encoding="utf-8",
        )

    def register_model(self, model_summary: dict[str, Any]) -> dict[str, Any]:
        model_id = model_summary["model_id"]
        for item in self._models_index:
            if item["model_id"] == model_id:
                raise ValueError(f"Model '{model_id}' already exists")
        self._models_index.append(model_summary)
        self.save_models_index()
        return model_summary

    def set_model_status(self, model_id: str, status: str) -> dict[str, Any]:
        for model in self._models_index:
            if model["model_id"] == model_id:
                model["status"] = status
                self.save_models_index()
                return model
        raise KeyError(f"Model '{model_id}' not found")

    def update_model_metadata(self, model_id: str, patch_data: dict[str, Any]) -> dict[str, Any]:
        detail = self.get_model_detail(model_id)
        detail.update(patch_data)
        summary_fields = [
            "name",
            "version",
            "status",
            "description",
            "tags",
            "supported_plants",
            "supported_diseases",
            "pricing_tier",
            "benchmark_summary",
        ]
        for model in self._models_index:
            if model["model_id"] == model_id:
                for field in summary_fields:
                    if field in detail:
                        model[field] = detail[field]
                break
        else:
            raise KeyError(f"Model '{model_id}' not found")

        metadata_file = self.metadata_dir / self.get_model_summary(model_id)["metadata_file"]
        metadata_file.write_text(json.dumps(detail, indent=2), encoding="utf-8")
        self.save_models_index()
        return detail

    def list_pricing_tiers(self) -> list[dict[str, Any]]:
        return self._pricing_tiers

    def _get_daily_quota(self, tier: str) -> int:
        for item in self._pricing_tiers:
            if item["tier"] == tier:
                return int(item["daily_quota"])
        return 0

    def check_access(self, model_id: str, user_id: str) -> dict[str, Any]:
        model = self.get_model_summary(model_id)
        tier = model.get("pricing_tier", "free")
        quota = self._get_daily_quota(tier)
        used = self._usage.get(user_id, {}).get(model_id, 0)
        allowed = quota < 0 or used < quota
        return {
            "model_id": model_id,
            "user_id": user_id,
            "pricing_tier": tier,
            "daily_quota": quota,
            "used_today": used,
            "allowed": allowed,
            "remaining": -1 if quota < 0 else max(quota - used, 0),
        }

    def record_usage(self, model_id: str, user_id: str, count: int = 1) -> dict[str, Any]:
        self._usage.setdefault(user_id, {})
        self._usage[user_id].setdefault(model_id, 0)
        self._usage[user_id][model_id] += max(1, count)
        self.usage_path.write_text(json.dumps(self._usage, indent=2), encoding="utf-8")
        return self.check_access(model_id=model_id, user_id=user_id)

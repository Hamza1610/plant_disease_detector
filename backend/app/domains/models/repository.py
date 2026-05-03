import json
from typing import List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.models import Model

class ModelRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, model_id: str) -> Optional[Model]:
        return self.db.query(Model).filter(Model.id == model_id).first()

    def list_all(self, skip: int = 0, limit: int = 100) -> List[Model]:
        return self.db.query(Model).offset(skip).limit(limit).all()

    def search(self, query: str) -> List[Model]:
        q = f"%{query}%"
        return self.db.query(Model).filter(
            or_(
                Model.name.ilike(q),
                Model.description.ilike(q),
                Model.tags.ilike(q),
                Model.supported_plants.ilike(q),
                Model.supported_diseases.ilike(q)
            )
        ).all()

    def filter(
        self,
        tags: Optional[List[str]] = None,
        plant: Optional[str] = None,
        disease: Optional[str] = None,
        tier: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Model]:
        query = self.db.query(Model)
        
        if tags:
            for tag in tags:
                query = query.filter(Model.tags.ilike(f"%{tag}%"))
        if plant:
            query = query.filter(Model.supported_plants.ilike(f"%{plant}%"))
        if disease:
            query = query.filter(Model.supported_diseases.ilike(f"%{disease}%"))
        if tier:
            query = query.filter(Model.pricing_tier == tier)
        if status:
            query = query.filter(Model.status == status)
            
        return query.all()

    def create(self, model_data: dict) -> Model:
        # Convert dict/list fields to JSON strings
        json_fields = [
            "input_spec", "output_classes", "supported_plants", 
            "supported_diseases", "tags", "benchmark_summary", "metadata_json"
        ]
        for field in json_fields:
            if field in model_data and not isinstance(model_data[field], str):
                model_data[field] = json.dumps(model_data[field])
        
        db_model = Model(**model_data)
        self.db.add(db_model)
        self.db.commit()
        self.db.refresh(db_model)
        return db_model

    def update(self, model_id: str, patch_data: dict) -> Optional[Model]:
        db_model = self.get_by_id(model_id)
        if not db_model:
            return None
            
        json_fields = [
            "input_spec", "output_classes", "supported_plants", 
            "supported_diseases", "tags", "benchmark_summary", "metadata_json"
        ]
        
        for key, value in patch_data.items():
            if key in json_fields and not isinstance(value, str):
                setattr(db_model, key, json.dumps(value))
            else:
                setattr(db_model, key, value)
                
        self.db.commit()
        self.db.refresh(db_model)
        return db_model

    def delete(self, model_id: str) -> bool:
        db_model = self.get_by_id(model_id)
        if not db_model:
            return False
        self.db.delete(db_model)
        self.db.commit()
        return True

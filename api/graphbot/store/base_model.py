from dataclasses import dataclass, field
from uuid import UUID, uuid4


@dataclass
class BaseModel:
    uuid: UUID = field(default_factory=uuid4)
from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Callable
from uuid import UUID

from .base_model import BaseModel

T = TypeVar('T', bound=BaseModel)

class ObjectNotFoundError(ValueError):
    pass


class BaseStore(ABC, Generic[T]):

    @abstractmethod
    def create(self, obj: T) -> bool:
        pass

    @abstractmethod
    def get(self, uuid: UUID) -> T | None:
        pass

    @abstractmethod
    def require(self, uuid: UUID) -> T:
        pass

    @abstractmethod
    def update(self, uuid: UUID, obj: T) -> bool:
        pass
    
    @abstractmethod
    def mutate(self, uuid: UUID, fn: Callable[[T], None]) -> T:
        pass

    @abstractmethod
    def delete(self, uuid: UUID) -> bool:
        pass

    @abstractmethod
    def count(self) -> int:
        pass
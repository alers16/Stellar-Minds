import threading

from typing import Generic, Callable
from uuid import UUID

from .base_store import BaseStore, ObjectNotFoundError, T


class MemoryStore(BaseStore[T], Generic[T]):

    def __init__(self) -> None:
        self._objs: dict[UUID, T] = {}
        self._lock = threading.RLock()

    def create(self, obj: T) -> bool:
        with self._lock:
            if obj.uuid in self._objs:
                return False
            
            self._objs[obj.uuid] = obj
            return True

    def get(self, uuid: UUID) -> T | None:
        with self._lock:
            return self._objs.get(uuid)
    
    def require(self, uuid: UUID) -> T:
        obj = self.get(uuid)
        if obj is None:
            raise ObjectNotFoundError(f"UUID not found: {uuid}")
        
        return obj
    
    def update(self, uuid: UUID, obj: T) -> bool:
        if obj.uuid != uuid:
            raise ValueError(f"Object's UUID ({obj.uuid}) does not match the UUID argument ({uuid})")
    
        with self._lock:
            if uuid not in self._objs:
                return False
            
            self._objs[uuid] = obj
            return True

    def mutate(self, uuid: UUID, fn: Callable[[T], None]) -> T:
        with self._lock:
            obj = self.require(uuid)
            fn(obj)

            return obj

    def delete(self, uuid: UUID) -> bool:
        with self._lock:
            return self._objs.pop(uuid, None) is not None
        
    def count(self) -> int:
        with self._lock:
            return len(self._objs)
        
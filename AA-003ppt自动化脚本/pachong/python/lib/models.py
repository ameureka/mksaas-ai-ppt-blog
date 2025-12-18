"""数据模型定义"""
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


class Status(Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    ARCHIVED = "ARCHIVED"


@dataclass
class ProcessStatus:
    aid: str
    channel: str
    status: Status
    slide_count: Optional[int] = None
    preview_paths: Optional[List[str]] = None
    error_msg: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@dataclass
class ProcessorConfig:
    downloads_dir: str
    archive_dir: str
    db_path: str
    min_slides: int = 6
    webp_quality: int = 85
    cover_size: tuple = (640, 360)
    preview_size: tuple = (1920, 1080)
    max_preview_width: int = 1920


@dataclass
class ExtractResult:
    success: bool
    extracted_dir: Optional[str] = None
    error_msg: Optional[str] = None


@dataclass
class SingleResult:
    aid: str
    success: bool
    status: Status
    slide_count: Optional[int] = None
    error_msg: Optional[str] = None


@dataclass
class ProcessResult:
    total: int = 0
    completed: int = 0
    archived: int = 0
    failed: int = 0
    skipped: int = 0

# 【示例7.2】 第七章 第7.2节 schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# 响应模型-令牌
class Token(BaseModel):
    access_token: str
    token_type: str


# 数据模型基类-用户信息
class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None


# 数据模型，创建用户，继承自UserBase
class UserCreate(UserBase):
    password: str


# 数据模型，用户，继承自UserBase
class User(UserBase):
    class Config:
        orm_mode = True


class Abnormals(BaseModel):
    id: int
    device_id: int
    state: str
    time: datetime
    msg: str
    charge: Optional[str] = None
    worker: Optional[str] = None
    repair_time: Optional[datetime] = None


class Devices(BaseModel):
    id: int
    code: int
    ranshaodaiwen: int
    shangbuwen: int
    rongrongdaiwen: int
    xiabuwen: int
    lengfengya: float
    refengya: float
    ludingya: float
    clienttoken: str
    mqtimestamp: int
    dttime: datetime

class Devices_dataView(BaseModel):
    code: int
    dttime: datetime
    ranshaodaiwen: int
    shangbuwen: int
    rongrongdaiwen: int
    xiabuwen: int
    lengfengya: float
    refengya: float
    ludingya: float
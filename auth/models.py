# 【示例7.2】 第七章 第7.2节 models.py
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from .database import Base

class UserInDB(Base):  # 定义用户表，继承自Base
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    username = Column('username', String(50))
    full_name = Column('full_name', String(50))
    email = Column('email', String(100))
    hashed_password = Column('hashed_password', String(64))


class Devices(Base):
    # 指定数据库中对应的表名
    __tablename__ = "device"
    id = Column(Integer, primary_key=True, index=True)
    code = Column(Integer)
    ranshaodaiwen = Column(Integer)
    shangbuwen = Column(Integer)
    rongrongdaiwen = Column(Integer)
    xiabuwen = Column(Integer)
    lengfengya = Column(Float)
    refengya = Column(Float)
    ludingya = Column(Float)
    clienttoken = Column(String(8))
    mqtimestamp= Column(Integer)
    dttime = Column(DateTime)
    abnormalities = relationship("Abnormals", back_populates="device_back")   # 一对多


class Abnormals(Base):
    __tablename__ = "abnormals"  # 异常-维修工单表

    id = Column(Integer, primary_key=True, index=True)
    device_id = Column(Integer, ForeignKey("device.id"))
    device_back = relationship("Devices", back_populates="abnormalities")

    state = Column(String(8))   # 状态
    time = Column(DateTime)     # 时间
    msg = Column(String(255))      # 异常内容
    charge = Column(String(16))  # 主管
    worker = Column(String(16))   # 工作人员
    repair_time = Column(DateTime, default=None)  # 维修时间

# 【示例7.2】 第七章 第7.2节 database.py
# 第一步，导入SQLAlchemy库
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# 第二步，创建数据连接引擎
engine = create_engine("mysql+pymysql://root:123456@localhost/produce")        # c211教室的数据库地址
# engine = create_engine("mysql+pymysql://admin:123456@localhost:54321/test1")

# 第三步，创建本地会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 第四步，创建数据模型基类
Base = declarative_base()

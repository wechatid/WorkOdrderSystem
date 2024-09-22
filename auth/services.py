# 【示例7.2】 第七章 第7.2节 services.py
from sqlalchemy.orm import Session
from . import models
from . import schemas
from .utils import get_password_hash, verify_password
from datetime import datetime, timedelta
from jose import jwt
import pandas as pd

# 更新数据的返回接口
def r_json(code: int, msg: str, result: str):
    result = {
        "code": code,
        "msg": msg,
        "return": f'{result}'
    }
    return result

# 获取单个用户
def get_user(db: Session, username: str):
    return db.query(models.UserInDB).filter(models.UserInDB.username == username).first()


# 创建一个用户
def create_user(db: Session, user: schemas.UserCreate):
    # 计算密码的哈希值
    hashed_password = get_password_hash(user.password)
    db_user = models.UserInDB(username=user.username,
                              hashed_password=hashed_password,
                              email=user.email,
                              full_name=user.full_name
                              )
    # 第二步，将实例添加到会话
    db.add(db_user)
    # 第三步，提交会话
    db.commit()
    # 第四步，刷新实例，用于获取数据或者生成数据库中的ID
    db.refresh(db_user)
    return db_user


# 验证用户和密码
def authenticate_user(db, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# 使用命令获取SECRET_KEY:
# openssl rand -hex 32
# 密钥
SECRET_KEY = "0bb93eb8c00be764e8dc60b001091987bd50c41f18bd2fee1c6d8239f0b23048"
ALGORITHM = "HS256"  # 算法
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 令牌有效期 5分钟


# 创建令牌，将用户名放进令牌
def create_token(data: dict):
    to_encode = data.copy()
    expires_delta = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.now() + expires_delta
    expire = int(expire.timestamp())
    to_encode.update({"exp": f'{str(expire)}'})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# 解析令牌，返回用户名
def extract_token(token: str):
    """
    如果签名过期了会报错
    :param token:
    :return:
    """
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return payload


# 获取工单
def get_abnormal(db: Session, abnormal_id: int):
    return db.query(models.Abnormals).filter(models.Abnormals.id == abnormal_id).first()


def get_abnormals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Abnormals).offset(skip).limit(limit).all()


def get_device(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Devices).with_entities(
        models.Devices.code,
        models.Devices.dttime,
        models.Devices.ranshaodaiwen,
        models.Devices.shangbuwen,
        models.Devices.rongrongdaiwen,
        models.Devices.xiabuwen,
        models.Devices.lengfengya,
        models.Devices.refengya,
        models.Devices.ludingya
    ).order_by(models.Devices.id.desc()).offset(skip).limit(limit).all()

def RunTimeGet(db: Session):
    code_1 = db.query(models.Devices).filter(models.Devices.code == 1).count()
    code_0 = db.query(models.Devices).filter(models.Devices.code == 0).count()
    total_count = code_1 + code_0
    if total_count > 0:
        percent_1 = (code_1 / total_count) * 100
        percent_0 = (code_0 / total_count) * 100
    else:
        percent_1 = 0.0
        percent_0 = 0.0

    return percent_0,percent_1

# 工单处理
# 改，改某个值
# 可以增加一个column参数，实现功能弹性
# def update_clienttoken(db: Session, abnormal: schemas.Abnormals):
#     column = 'state'
#     db.query(models.Abnormals).filter(models.Abnormals.id == abnormal.id).update({column: abnormal.clienttoken})
#     db.commit()
#     return r_json(code=200, msg="success", result=str(abnormal))

def update_abnormal(db: Session, abnormal: schemas.Abnormals):
    # 从 abnormal 对象中获取所有字段和值，排除 id 字段
    update_data = {column: value for column, value in vars(abnormal).items() if column != 'id'}

    # 将字段名转换为模型的列属性
    update_data = {getattr(models.Abnormals, column): value for column, value in update_data.items()}

    # 执行更新操作
    db.query(models.Abnormals).filter(models.Abnormals.id == abnormal.id).update(update_data)
    db.commit()

    return r_json(code=1, msg="success", result=str(abnormal))


def calculate_average_values(db_session):
    try:
        # 读取数据到Pandas DataFrame
        query = db_session.query(models.Devices)  # 假设MyTable是你的ORM映射类
        df = pd.read_sql(query.statement, query.session.bind)

        # 选择数值类型的列进行处理
        numeric_columns = df.select_dtypes(include=['number']).columns
        df_numeric = df[numeric_columns]

        # 计算所有数值字段的平均数
        mean_values = df_numeric.mean().to_dict()
        pro_data = {
            "temperature": {
                "ranshaodaiwen": mean_values["ranshaodaiwen"],
                "shangbuwen": mean_values["shangbuwen"],
                "rongrongdaiwen": mean_values["rongrongdaiwen"],
                "xiabuwen": mean_values["xiabuwen"]
            },
            "pressure": {
                "lengfengya":mean_values["lengfengya"],
                "refengya":mean_values["refengya"],
                "ludingya":mean_values["ludingya"]
            }
        }
        print(pro_data)
        # 返回平均数
        return pro_data

    except Exception as err:
        raise TypeError(f"Could not calculate average values: {err}")


def create_device(db: Session, device: schemas.Devices):
    db_device = models.Devices(
        code=device.code,
        ranshaodaiwen=device.ranshaodaiwen,
        shangbuwen=device.shangbuwen,
        rongrongdaiwen=device.rongrongdaiwen,
        xiabuwen=device.xiabuwen,
        lengfengya=device.lengfengya,
        refengya=device.refengya,
        ludingya=device.ludingya,
        clienttoken=device.clienttoken,
        mqtimestamp=device.mqtimestamp,
        dttime=device.dttime
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    return db_device

# 创建异常
def create_abnormal(db: Session, device: schemas.Devices, abnormal: schemas.Abnormals):
    db_abnormal = models.Abnormals(
        device_id=device.id,
        state=abnormal.state,
        time=device.dttime,
        msg=abnormal.msg,
        charge=abnormal.charge,
        worker=abnormal.worker,
        repair_time=abnormal.repair_time
    )
    db.add(db_abnormal)
    db.commit()
    db.refresh(db_abnormal)
    return db_abnormal


def get_time(db: Session):
    # 获取数据库中第一条数据的 dttime 字段内容
    first_device = db.query(models.Devices).first()
    return first_device.dttime

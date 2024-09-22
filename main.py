# 【示例7.2】 第七章 第7.2节 main.py
import uvicorn
from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError
from sqlalchemy.orm import Session
from fastapi import Response
from fastapi.responses import JSONResponse
from datetime import datetime
import pytz
from typing import List
# ↓是auth目录下的py文件
from auth import schemas, services, database
# ↓web页面所需的库
from fastapi import Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

# 创建安全模式-密码模式
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
# 创建应用实例
app = FastAPI()



# 创建依赖项
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 获取当前用户信息的依赖函数
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    invalid_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的用户任据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        username: str = services.extract_token(token)
        if username is None:
            raise invalid_exception
    except JWTError:
        raise invalid_exception
    user = services.get_user(db, username=username)
    if user is None:
        raise invalid_exception
    return user


# 登录的请求接口
@app.post("/user-login", response_model=schemas.Token)
async def login(
        form: OAuth2PasswordRequestForm = Depends(),  # 依赖项，登录表单
        db: Session = Depends(get_db),  # 依赖项，数据库会话
):
    user = services.authenticate_user(db, form.username, form.password)  # 验证用户有效性
    print(user)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="用户名或密码无效",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = services.create_token(data={"username": user.username})  # 发放令牌
    # # 将访问令牌存储在 Cookie 中
    response = Response()
    response.set_cookie(key="access_token", value=access_token, httponly=True, max_age=3600)  # 设置过期时间为 1 小时
    return {"access_token": access_token, "token_type": "bearer"}  # 返回令牌


# 创建新用的接口
@app.post("/user/create/", response_model=schemas.User)  # 创建用户
async def create_user(user: schemas.UserCreate,
                      db: Session = Depends(get_db)):
    dbuser = services.get_user(db, user.username)
    if dbuser:  # 判断用户名是否存在
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="用户名已存在",
            # headers={"WWW-Authenticate": "Bearer"},                          # 非Auth2，无需添加
        )
    return services.create_user(db, user)  # 在数据库中创建用户


# ***写一个登录之后检查登录状态的依赖函数***
async def check_status(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    invalid_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的用户凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    expired_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="登录状态已过期",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        username: str = services.extract_token(token)['username']
        exp = services.extract_token(token)['exp']
        if username is None:
            raise invalid_exception

        if exp is not None:
            """
            校验token是否过期
            """
            beijing_timezone = pytz.timezone('Asia/Shanghai')
            exp_datetime = datetime.fromtimestamp(float(exp), beijing_timezone)
            current_time = datetime.now(beijing_timezone)
            if exp_datetime < current_time:
                raise expired_exception

    except JWTError:
        raise invalid_exception

    user = services.get_user(db, username=username)
    if user is None:
        raise invalid_exception
    else:
        return user


@app.get('/verify_cookie', response_model=schemas.UserBase)
async def check_cookie(response: schemas.UserBase = Depends(check_status)):
    return response


@app.get('/check/', response_model=schemas.User)
async def check(current_user: schemas.User = Depends(check_status)):
    return current_user


# 获取用户当前信息，安全模式
@app.get("/user/", response_model=schemas.User)
async def read_current_user(current_user: schemas.User = Depends(get_current_user)):
    return current_user


# 获取其他信息， 安全模式
@app.get("/items/")
async def read_items(token: str = Depends(oauth2_scheme)):
    return {"item_id": "cool"}


@app.get("/abnormals/", response_model=List[schemas.Abnormals])
def read_abnormals(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), abnormals=Depends(check_status)):
    abnormals = services.get_abnormals(db, skip=skip, limit=limit)
    return abnormals


@app.put("/updata/")
async def updata(abnormal: schemas.Abnormals, db: Session = Depends(get_db), user=Depends(check_status)):
    if user is None:
        return {"code": 0, "msg": "参数错误"}
    else:
        return services.update_abnormal(db, abnormal)


# 实时数据折线图  只返回七条数据
@app.get("/device_view/", response_model=List[schemas.Devices_dataView])
def read_device(skip: int = 0, limit: int = 7, db: Session = Depends(get_db), device_view_data=Depends(check_status)):
    device_view_data = services.get_device(db, skip=skip, limit=limit)
    return device_view_data

#设备运行效率的统计
@app.get("/runtime/")
async def runtimeGet(db: Session = Depends(get_db), runtime=Depends(check_status)):
    percent_0,percent_1 = services.RunTimeGet(db)
    run_data = [
        {"value": float(percent_1), "name": "运行率", "itemStyle": {"color": "#99ff99"}},
        {"value": float(percent_0), "name": "警告率", "itemStyle": {"color": "#ff9900"}}
    ]

    return run_data

#数据统计
@app.get("/dataproduce")
async def dec_data_pro(db: Session = Depends(get_db), mean_data=Depends(check_status)):
    mean_data = services.calculate_average_values(db)
    return mean_data

@app.get("/shucaiOpen")
async def shucaikaiguan(run_state_zhiling, run_state1=Depends(check_status)):
    with open("checkshucai.txt", 'w') as file:
        # 将变量的值写入文件
        file.write(run_state_zhiling)
        file.close()
    return run_state_zhiling
@app.get("/checkshucai")
async def  checkshucai():
    with open("checkshucai.txt", 'r') as file:
        run_state = file.read()
        file.close()
    return {"value": run_state}

@app.get("/gettime/")
async def getTime(db: Session = Depends(get_db), mean_data=Depends(check_status)):
    time_data =services.get_time(db)
    return {"first":time_data}


# ↓前端页面
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory='templates')


@app.get('/', response_class=HTMLResponse)
async def index(request: Request, page: str = 'login'):
    return templates.TemplateResponse('index.html', {"request": request})


@app.get("/{page}", response_class=HTMLResponse)
async def index(request: Request, page: str = 'login'):
    # 检查路由路径，返回对应的HTML页面
    if page == 'register':
        return templates.TemplateResponse('register.html', {"request": request})
    elif page == 'work':
        return templates.TemplateResponse('work.html', {"request": request})
    elif page == "dataview":
        return templates.TemplateResponse('dataview.html', {"request": request})
    else:
        return '兄弟你越界了这里没有你想要的东西'


if __name__ == '__main__':
    # 生成数据库中的表
    database.Base.metadata.create_all(bind=database.engine)
    uvicorn.run(app=app, port=8000)
    # uvicorn.run(app=app)



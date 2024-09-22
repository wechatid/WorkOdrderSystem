---
title: 模拟采集炼铁高炉数据可视化与工单系统
date: 2024-09-22 13:02:38
tags: [python,html,sql,mqtt]
categories: [python,html,sql,mqtt]
index_img: https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewCover.png
banner_img: https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewCover.png
---

# 数据采集与可视化监控工单处理系统——炼铁高炉

## 项目概述

随着工业自动化和数字化的不断发展，对炼铁高炉的生产状态进行实时监控变得尤为重要。本项目旨在通过高效的数据采集与可视化监控工单处理系统，实时监测高炉内的温度、压力和运行状态。该系统能够及时生成工单，快速反馈给维保人员，确保对异常情况的快速响应和处理。通过精确的数据分析与可视化展示，提升生产效率，降低故障率，最终实现炼铁高炉的安全、稳定与高效运行。

## 项目截图

![img](https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewpicter2.jpg)

![img](https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewpicter3.jpg)

![img](https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewpicter4.png)

## 项目框架

![炼铁高炉数据采集与可视化监控工单处理系统](https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewFramework.png)

## 项目文件

![项目框架](https://gcore.jsdelivr.net/gh/wechatid/image/blog/dataviewFile.png)

## 项目前准备

1. python3.8以上环境
2. pycharm编辑器
3. mysql数据库
4. 导入所需的库[^所需库]

### 数据库准备

成功安装mysql数据库之后，导入SQLAlchemy库，并对数据库创建连接。

```python
# 第一步，导入SQLAlchemy库
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
# 第二步，创建数据连接引擎
engine = create_engine("mysql+pymysql://root:123456@localhost/produce")        # 数据库地址
# engine = create_engine("mysql+pymysql://admin:123456@localhost:54321/test1")

# 第三步，创建本地会话
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# 第四步，创建数据模型基类
Base = declarative_base()
```

随后在`main.py`里创建一个依赖项

```python
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 数据模型

高炉数据模型

```python
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
```

工单数据模型

```python
class Abnormals(BaseModel):
    id: int
    device_id: int
    state: str
    time: datetime
    msg: str
    charge: Optional[str] = None
    worker: Optional[str] = None
    repair_time: Optional[datetime] = None
```

用户信息模型

```python
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
```

响应模型-令牌

```python
class Token(BaseModel):
    access_token: str
    token_type: str
```

可视化数据模型

```python
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
```

### 数据库数据模型

用户表

```python
class UserInDB(Base):  # 定义用户表，继承自Base
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    username = Column('username', String(50))
    full_name = Column('full_name', String(50))
    email = Column('email', String(100))
    hashed_password = Column('hashed_password', String(64))
```

设备数据表

```python
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
```

工单表

```python
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
```

## 项目功能

### 数据采集

使用mqtt传输协议获取实时数据。

存储方法：

```python
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
```



### 创建工单

**存储数据时对数据进行检查，异常时应该建立对应的工单**，

```python
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
```

### 用户注册

注册方法

```python
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
```

> 密码加密方法放在`serices.py`里面

fastapi接口

```python
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
```

### 用户登录接口

```python
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
```

#### 登录状态依赖函数


```python
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
```

## 数据查询

数据查询可以孪生可视化的各种功能，以下是查询工单的一个例子，就不一一例举了。

```python
def get_abnormals(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Abnormals).offset(skip).limit(limit).all()
```

## 前端

前端使用了element ui vue[^element ui]框架，弹窗使用了国外的一个弹窗组件，统计图使用了Apache Echarts[^Apache]



### 下面是前端几个主要的js代码，更多请下载项目研究

登录js

```javascript
document.getElementById('loginForm').addEventListener('submit', function(event) {
             event.preventDefault();

             var username = document.getElementById('username').value;
             var password = document.getElementById('password').value;

             fetch('/user-login', {
                     method: 'POST',
                     headers: {
                         'Content-Type': 'application/x-www-form-urlencoded'
                     },
                     body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
                 })
                 .then(response => {
                     if (!response.ok) {
                         if (response.status === 401) {
                             return response.json().then(data => {
                                 loginno(data.detail);
                                 throw new Error('Unauthorized');
                             });
                         } else {
                             throw new Error('Network response was not ok');
                         }
                     }
                     return response.json();
                 })
                 .then(data => {
                     document.cookie = `access_token=${data.access_token}; max-age=3600; path=/`;
                     loginok();
                 })
                 .catch(error => {
                     console.error('Error:', error);
                 });
         });

         function loginok() {
             let timerInterval;
             Swal.fire({
                 title: "登录成功!",
                 timer: 1000,
                 timerProgressBar: true,
                 didOpen: () => {
                     Swal.showLoading();
                     const timer = Swal.getPopup().querySelector("b");
                     timerInterval = setInterval(() => {
                         timer.textContent = `${Swal.getTimerLeft()}`;
                     }, 100);
                 },
                 willClose: () => {
                     clearInterval(timerInterval);
                 }
             }).then((result) => {
                 /* Read more about handling dismissals below */
                 if (result.dismiss === Swal.DismissReason.timer) {
                     window.location.href = '/work';
                 }
             });
         }

         function loginno(message) {
             let timerInterval;
             Swal.fire({
                 title: message,
                 timer: 1000,
                 timerProgressBar: false,
                 showConfirmButton: false,
                 didOpen: () => {
                     const timer = Swal.getPopup().querySelector("b");
                     timerInterval = setInterval(() => {
                         timer.textContent = `${Swal.getTimerLeft()}`;
                     }, 100);
                 },
                 willClose: () => {
                     clearInterval(timerInterval);
                 }
             }).then((result) => {
                 /* Read more about handling dismissals below */
                 if (result.dismiss === Swal.DismissReason.timer) {
                 }
             });
            
```

检查登录状态

```javascript
// 检查是否存在 cookie
function checkCookie() {
    var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    // 如果存在 cookie
    if (cookieValue) {
        setTimeout(function() {
            checkToken(cookieValue).then(isValid => {
                if (isValid) {
                    // 验证通过，显示欢迎信息
                    console.log('验证通过，显示欢迎信息');
                    redirectToWorkPage();
                    // 在这里添加你的逻辑，例如显示欢迎信息
                } else {
                    // 验证失败，跳转至登录页面
                    console.log('验证失败');
                }
            });
        }, 2000); // 模拟向服务器验证需要的时间
    } else {
        // 如果不存在 cookie，跳转至登录页面
    }
}

// 模拟向服务器验证 cookie 的函数
function checkToken(token) {
    return fetch('/verify_cookie', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('status is not ok');
        }
        return true; // 验证通过
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        return false; // 验证失败
    });
}
```

处理工单js代码

```javascript
var Main = {
  data() {
    return {
      tableData: [],
      loading: true
    }
  },
  methods: {
    tableRowClassName({row, rowIndex}) {
      if (row.state=== "异常") {
        return 'warning-row';
      } else if (row.state === "已完成") {
        return 'success-row';
      }
      return '';
    },

    async loadData() {
      const abnormals = await fetchAbnormals();
      this.tableData = abnormals;
      this.loading = false;
    },

<!--    handleCheck(index, row) {-->
<!--      if (confirm(`确定要修改 ${row.name} 的地址吗？`)) {-->
<!--        this.$set(this.tableData, index, { ...row, address: '步行街' });-->
<!--        // 执行编辑操作，这里可以添加异步操作-->
<!--      }-->
<!--    },-->

    async handleEdit(index, row) {
      var upData = {
        "id": row.id,
        "device_id": row.device_id,
        "state": "",
        "time": row.time,
        "msg": row.msg,
        "charge": row.charge,
        "worker": "",
        "repair_time": ""
      };

      try {
        const result = await editPop(upData);
        if(result){
          await this.loadData();
        }
      } catch (error) {
        console.error('编辑操作失败:', error);
      }
    }
  },

  mounted() {
    this.loadData();
  }
}

var Ctor = Vue.extend(Main);
new Ctor().$mount('#app');

async function fetchAbnormals() {
      const url = `./abnormals/`;
      return fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
        }
      }).then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      }).catch(error => {
        console.error('Error fetching abnormals:', error);
        return [];
      });
      }
```



## 总结

以上就是数据采集与可视化监控工单处理系统——炼铁高炉项目的主要内容，还有一些没有写出来的主要是因为重复性较高的，写出来没有什么意义。如果有需要的话，可以去我的github上点个小星星下载到本地运行，谢谢。

## 致谢

最后，非常感谢您的看到最后！

仓库地址：

[^所需库]: https://wechatid.github.io/
[^Apache]: [Apache ECharts](https://echarts.apache.org/zh/index.html)
[^element ui]: [组件 | Element](https://element.eleme.cn/#/zh-CN/component/installation)


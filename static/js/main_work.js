let full_name=''
// 检查是否存在 cookie
function checkCookie() {
    var cookieValue = document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1");

    // 如果存在 cookie
    if (cookieValue) {
        setTimeout(function() {
            checkToken(cookieValue).then(isValid => {
                if (isValid) {
                    // 验证通过，显示欢迎信息
                    console.log(full_name);
                    // 在这里添加你的逻辑，例如显示欢迎信息
                } else {
                    // 验证失败，跳转至登录页面
                    console.log('验证失败');
                    redirectToLoginPage();
                }
            });
        }, 2000); // 模拟向服务器验证需要的时间
    } else {
        // 如果不存在 cookie，跳转至登录页面
        redirectToLoginPage();
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
        return response.json(); // 返回解析后的 JSON 数据
    })
    .then(data => {
        // 在这里处理获取到的数据
        full_name = data.full_name;
        return true; // 验证通过
    })
    .catch(error => {
        console.error('There has been a problem with your fetch operation:', error);
        return false; // 验证失败
    });
}


// 跳转至登录页面
function redirectToLoginPage() {
    // 移除加载状态信息
    var loadingMessage = document.querySelector('div.loading-message'); // 假设加载状态信息有一个特定的类
    if (loadingMessage) {
        loadingMessage.remove();
    }

    // 提示用户跳转
    let timerInterval;
    Swal.fire({
        title: "登录状态过期，请重新登录!",
        html: "<b></b> 后跳转登录页面",
        timer: 1000,
        timerProgressBar: true,
        didOpen: () => {
            Swal.showLoading();
            const timer = Swal.getHtmlContainer().querySelector("b");
            timerInterval = setInterval(() => {
                timer.textContent = `${Swal.getTimerLeft()}`;
            }, 200); // 更新间隔调整为200ms
        },
        willClose: () => {
            clearInterval(timerInterval);
        }
    }).then((result) => {
        if (result.dismiss === Swal.DismissReason.timer) {
            window.location.href = '/'; // 确保这是你想要的登录页面路径
        }
    });
}

// 页面加载时执行检查
window.onload = checkCookie;

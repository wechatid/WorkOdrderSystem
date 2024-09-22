
// 用于显示弹出框的函数
function showPopup1() {
    var overlay = document.getElementById("overlay");
    overlay.style.display = "block";

}

function showPopup() {
    Swal.fire({
        title: "提示",
        text: "是否退出登录？",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "是",
        cancelButtonText: '否'
    }).then((result) => {
        if (result.isConfirmed) {
            clearCookiesAndRefreshPage();
        }
    });
}

// 用于隐藏弹出框的函数
function logoout() {
    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
    clearCookiesAndRefreshPage();
}
function clearCookiesAndRefreshPage() {
    // 获取当前所有的 cookie
    var cookies = document.cookie.split(";");

    // 清除每个 cookie
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }

    // 刷新页面
    location.reload();
}

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




function gettime(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份从0开始，需要+1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function updataAbnormals(data) {  // 添加 data 参数，如果需要发送数据
  const url = `./updata/`;
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`,
      'Content-Type': 'application/json'  // 如果发送 JSON 数据，设置 Content-Type
    },
    body: JSON.stringify(data)  // 将 data 转换为 JSON 字符串
  })
}


function editPop(upData) {
  return Swal.fire({
    title: "请确认维修人员的信息",
    input: "text",
    inputValue: full_name,
    inputAttributes: {
      autocapitalize: "off"
    },
    showCancelButton: true,
    confirmButtonText: "确定",
    showLoaderOnConfirm: true,
    preConfirm: (inputValue) => {
      if(inputValue != ''){
        upData.worker = inputValue;
        upData.repair_time = gettime();
        upData.state = '已完成';
      }else{
        return Swal.showValidationMessage(`工作人员编号必须填写`);
      }

      return updataAbnormals(upData)
        .then(response => {
          if (!response.ok) {
            if (response.status === 401) {
              throw new Error('登录状态错误');
            } else {
              throw new Error('非法请求');
            }
          }
          return response.json();
        })
        .catch(error => {
          Swal.showValidationMessage(`错误提示: ${error}`);
        });
    },
    allowOutsideClick: () => !Swal.isLoading()
  }).then((result) => {
    if (result.isConfirmed) {
      return Swal.fire({
        title: "工单处理完成！",
        icon: "success",
        showCancelButton: true,
        confirmButtonText: "OK"
      }).then((result) => {
        if (result.isConfirmed) {
          return true;
        }
      });
    }
  });
}

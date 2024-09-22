function abnView() {
    var dom = document.getElementById('chart-container');
    var myChart = echarts.init(dom, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });
    var app = {};

    var option;



    option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            bottom: '15%', // 图例位置距离底部5%
            left: 'center', // 图例水平居中
        },
        series: [{
            name: '工单完成率',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '60%'],
            // adjust the start and end angle
            startAngle: 180,
            endAngle: 360,
            label: {
                show: true,
                position: 'bottom' // 标签显示在扇区的底部
            },
            data: []
        }]
    };

    if (option && typeof option === 'object') {
        myChart.setOption(option);
        countStates().then(data => {
            // 更新 series 数据
            option.series[0].data = data;
            // 使用新的配置项重新渲染图表
            myChart.setOption(option);
        });
    }

    window.addEventListener('resize', myChart.resize);

}

//统计次数
async function countStates() {
    const abnormals = await fetchAbnormals();

    // 初始化计数器
    let abnormalCount = 0;
    let completedCount = 0;

    // 遍历列表进行统计
    for (const item of abnormals) {
        if (item.state === '异常') {
            abnormalCount++;
        } else if (item.state === '已完成') {
            completedCount++;
        }
    }

    // 返回统计结果
    return [{
            value: abnormalCount,
            name: '异常工单',
            itemStyle: {
                color: 'red' // 自定义颜色
            }
        },
        {
            value: completedCount,
            name: '完成工单',
            itemStyle: {
                color: '#00ff00' // 自定义颜色
            }
        }
    ];
}


//读取七条数据
async function stackedData(type) {
    const url = `./device_view/`;
    const color = {
        "ranshaodaiwen": "#cccc00",
        "shangbuwen": "#ff33cc",
        "rongrongdaiwen": "#33cc33",
        "xiabuwen": "#663300",
        "lengfengya": "#cc3300",
        "refengya": "#0000cc",
        "ludingya": "#ff0000"
    };
    const name = {
        "ranshaodaiwen": "燃烧带温度",
        "shangbuwen": "上部温度",
        "rongrongdaiwen": "熔融带温度",
        "xiabuwen": "下部温度",
        "lengfengya": "冷风压强",
        "refengya": "热风压强",
        "ludingya": "炉顶压强"
    };
    const name_data = {
        "temperature": {
            "ranshaodaiwen": "燃烧带温度",
            "shangbuwen": "上部温度",
            "rongrongdaiwen": "熔融带温度",
            "xiabuwen": "下部温度"
        },
        "pressure": {
            "lengfengya": "冷风压强",
            "refengya": "热风压强",
            "ludingya": "炉顶压强"
        }
    }
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // 构建 series 数组
        const series = [];

        // 遍历接口返回的数据，每个属性作为一个系列
        for (const key in data[0]) {
            if (Object.hasOwnProperty.call(data[0], key)) {
                if (!name_data[type].hasOwnProperty(key)) {
                    continue;
                  }
                const seriesData = {
                    name: name_data[type][key], // 使用属性名作为系列名称
                    type: 'line', // 根据需要指定图表类型
                    stack: 'Total',
                    itemStyle: {
                        color: color[key] // 指定系列颜色
                    },
                    data: data.map(item => item[key]) // 构建数据点数组
                };
                series.push(seriesData);
            }
        }

        return series;
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}


function stackedViewTemperature() {
    var domTemperature = document.getElementById('stacked');
    var myChartTemperature = echarts.init(domTemperature, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });
    var appTemperature = {};

    var optionTemperature;

    optionTemperature = {
    // color: ['#cccc00', '#ff33cc', '#33cc33', '#663300', '#cc3300', '#0000cc', '#ff0000'], // 设置颜色列表
    title: {
        text: '温度变化趋势',
        textStyle: {
            color: '#333' // 标题颜色
        }
    },
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data: ['燃烧带温度', '上部温度', '熔融带温度', '下部温度']
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    toolbox: {
        feature: {
            saveAsImage: {}
        }
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['1', '2', '3', '4', '5', '6', '7'],
    },
    yAxis: {
        type: 'value',
        axisLabel: {
            textStyle: {
                color: '#b3d9ff' // y 轴文字颜色
            }
        }
    },
    series: []
};


    myChartTemperature.setOption(optionTemperature);
    stackedData("temperature").then(data => {
        // 更新 series 数据
        optionTemperature.series = data;
        // 使用新的配置项重新渲染图表
        myChartTemperature.setOption(optionTemperature);
    });

    window.addEventListener('resize', function() {
        myChartTemperature.resize();
    });
}


function stackedViewPressure() {
    var domPressure = document.getElementById('stackedPressure');
    var myChartPressure = echarts.init(domPressure, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });
    var appPressure = {};

    var optionPressure;

    optionPressure = {
//        color: ['#cccc00', '#ff33cc', '#33cc33', '#663300', '#cc3300', '#0000cc', '#ff0000'], // 设置颜色列表
        title: {
            text: '压强变化趋势'
        },
        tooltip: {
            trigger: 'axis'
        },
        legend: {
            //    data: ['ranshaodaiwen', 'shangbuwen', 'rongrongdaiwen', 'xiabuwen', 'lengfengya','refengya','ludingya']
            data: ['冷风压强', '热风压强', '炉顶压强']
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        toolbox: {
            feature: {
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: ['1', '2', '3', '4', '5', '6', '7']
        },
        yAxis: {
        type: 'value',
        axisLabel: {
            textStyle: {
                color: '#b3d9ff' // y 轴文字颜色
            }
        }
    },
        series: []
    };

    myChartPressure.setOption(optionPressure);
    stackedData("pressure").then(data => {
        // 更新 series 数据
        optionPressure.series = data;
        // 使用新的配置项重新渲染图表
        myChartPressure.setOption(optionPressure);
    });

    window.addEventListener('resize', function() {
        myChartPressure.resize();
    });
}


let status_code = 0
let runState=true;
let lastTimeTemp = 1;
let lastTime;
//实时数据格式化获取
async function RealtimeDataGet() {
    const url = `./device_view/?limit=1`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const tableData = [];
        const tochinese = {
            "ranshaodaiwen": "燃烧带温度(℃)",
            "shangbuwen": "上部温度(℃)",
            "rongrongdaiwen": "熔融带温度(℃)",
            "xiabuwen": "下部温度(℃)",
            "lengfengya": "冷风压强(Pa)",
            "refengya": "热风压强(Pa)",
            "ludingya": "炉顶压强（Pa）"
        }

        // 获取并赋值 status_code
        if (data.length > 0) {
    if (data[0].hasOwnProperty('code')) {
        status_code = data[0].code;
    }
    if (data[0].hasOwnProperty('dttime')) {
        lastTime = data[0].dttime;
        console.log(lastTime)
        if (lastTimeTemp === lastTime) {
            runState = false;
        } else {
            runState = true;
            lastTimeTemp = lastTime;
        }
    }
}

        // 检查是否有数据
        if (data.length > 0) {
            // 遍历第一个对象的键值对
            for (let key in data[0]) {
                if (key === "code") {
                    // 跳过处理 "code" 键
                    continue;
                }else if (key === "dttime"){continue;}
                if (data[0].hasOwnProperty(key)) {
                    let formattedObject = {
                        key: tochinese[key],
                        value: data[0][key]
                    };
                    tableData.push(formattedObject);
                }
            }
            return tableData;
        } else {
            console.log('No data available.');
            return [];
        }
    } catch (error) {
        return [];
    }
}



let firstTime; // 声明一个全局变量用来存储第一条时间

async function firstTimeGet() {
    const url = `./gettime/`; // 假设这是获取时间的接口URL

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        firstTime = data.first; // 假设返回的数据中有一个名为 'first' 的字段存放第一条时间
        console.log(firstTime); // 输出获取的第一条时间
    } catch (error) {
    }
}

// 调用 async 函数需要使用 await 或者 .then() 来等待其执行完成
firstTimeGet();
//下面是指示灯

// JavaScript 根据值切换状态颜色和文字
  function updateStatus(value) {
    const statusLight = document.getElementById('statusLight');
    const statusText = document.getElementById('statusText');

    if (value === 1) {
      statusLight.classList.remove('red');
      statusLight.classList.add('green');
      statusText.innerText = "正常";
      statusText.classList.remove('red-text');
      statusText.classList.add('green-text');
    } else {
      statusLight.classList.remove('green');
      statusLight.classList.add('red');
      statusText.innerText = "警告";
      statusText.classList.remove('green-text');
      statusText.classList.add('red-text');
    }
  }

  // 示例：模拟状态变化
  let currentValue = 0; // 初始状态为红色

  // 定时更新状态
  setInterval(function() {
    updateStatus(status_code);
  }, 1000); // 每隔一秒切换一次状态

//上面是指示灯

//下面是作业时长


function Clock() {
            let startTime = new Date(firstTime);
            console.log("1234")
            console.log(firstTime)
            let endTime = new Date(lastTime);

            // 计算时间差（单位：毫秒）
            timeDiff = endTime - startTime;
        }


function settingRealTime(timeDiff){
            let seconds = Math.floor((timeDiff / 1000) % 60);
            let minutes = Math.floor((timeDiff / (1000 * 60)) % 60);
            let hours = Math.floor((timeDiff / (1000 * 60 * 60)));

            let timeString = `${hours}:${minutes}:${seconds}`;

            document.getElementById('clock').textContent = timeString;
            document.getElementById('dynamicText').textContent = "工作时长";

}
function updateClock(){

        if (runState){
        timeDiff = timeDiff + 1000;
        console.log(timeDiff)
        settingRealTime(timeDiff);
        }else{
        Clock();
        settingRealTime(timeDiff);
        }
}

function delayAndClock() {
    var intervalId = setInterval(function() {
        if (lastTime !=="NaN" && firstTime !=="NaN") {
            Clock(); // 调用你的 Clock 函数
            clearInterval(intervalId); // 当满足条件时停止监控
        }
    }, 100); // 每 100 毫秒检查一次条件
}



  setInterval(function() {
    updateClock();
  }, 1000); // 每隔一秒切换一次状态




//上面是作业时长

//下面是设备运行效率

function RunTimeJs() {
    var dom = document.getElementById('RunTime');
    var myChart = echarts.init(dom, null, {
        renderer: 'canvas',
        useDirtyRect: false
    });

    var option = {
        tooltip: {
            trigger: 'item'
        },
        legend: {
            top: '5%',
            left: 'center'
        },
        series: [{
            name: '运行效率',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            padAngle: 5,
            itemStyle: {
                borderRadius: 10
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: 14, // Adjusted fontSize
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: []
        }]
    };

    // 使用 option 对象设置初始图表配置
    if (option && typeof option === 'object') {
        myChart.setOption(option);
        // 异步获取数据并更新图表
        RunTimeGet().then(data => {
            // 更新 series 数据
            option.series[0].data = data;
            console.log(data)
            // 使用新的配置项重新渲染图表
            myChart.setOption(option);
        }).catch(error => {
            console.error('Failed to fetch runtime data:', error);
        });
    }

    // 监听窗口大小变化，自适应图表大小
    window.addEventListener('resize', function () {
        myChart.resize();
    });
}


//效率数据
async function RunTimeGet() {
    const url = `./runtime/`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;  // 返回从接口获取的数据

    } catch (error) {
        console.error('Error fetching runtime data:', error);
        return [];  // 返回空数组作为默认值
    }
}

//上面是设备运行效率

//异常数据列表滚动

async function processAndFormatData() {
    try {
        // 调用异步函数获取数据
        const data = await fetchAbnormals();

        // 准备用来存放结果的数组
        const resultList = [];

        // 遍历接口数据，提取msg和state字段内容
        data.forEach(item => {
            const { msg, state } = item;
            resultList.push({ msg, state });
        });

        // 返回处理后的结果数组
        return resultList;
    } catch (error) {
        console.error('Error fetching or processing data:', error);
        throw error; // 可以选择抛出异常或者返回空数组或null等
    }
}


async function loadDataIntoScrollList() {
            try {
                const data = await processAndFormatData();
                const scrollList = document.getElementById('scrollList');

                // 清空现有内容
                scrollList.innerHTML = '';

                // 将数据动态生成滚动列表项
                data.forEach(item => {
                    const div = document.createElement('div');
                    div.textContent = item.msg;
                    div.classList.add('scroll-item');

                    // 根据状态设置不同的类名和背景色
                    if (item.state === '异常') {
                        div.classList.add('error');
                    } else {
                        div.classList.add('normal');
                    }


                  div.style.color = 'white';
                  div.style.fontWeight = 'bold';
                  div.style.fontSize = '13px';
                    // 添加状态文本
                    const stateSpan = document.createElement('span');
                    stateSpan.textContent = item.state;
                    stateSpan.style.color = item.state === '已完成' ? '#99ff99' : 'red'; // 状态文字颜色
                    stateSpan.style.paddingRight = '15px';

                    div.appendChild(stateSpan); // 将状态文本添加到div内

                    scrollList.appendChild(div);
                    div.style.marginBottom = '1px';
                });
            } catch (error) {
                console.error('Error loading data into scroll list:', error);
            }
        }


//异常数据列表滚动

//柱状图

function Tick1(){
var dom = document.getElementById('Tick1');
var myChart = echarts.init(dom, null, {
  renderer: 'canvas',
  useDirtyRect: false
});
var app = {};

var option;

option = {
title: {
            text: '温度平均值',
            textStyle: {
            color: '#333', // 标题颜色
            fontSize: 18, // 标题字体大小
            fontWeight: 'bold' // 标题字体粗细
            // 还可以添加其他样式如字体系列 fontFamily 等
        }
        },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
   xAxis: [
        {
            type: 'category',
            data: [],
            axisTick: {
                alignWithLabel: true
            },
            axisLabel: {
                textStyle: {
                    color: '#ffcc80' // x 轴文字颜色
                }
            }
        }
    ],
  yAxis: [
        {
            type: 'value',
            axisLabel: {
                textStyle: {
                    color: '#b3d9ff' // y 轴文字颜色
                }
            }
        }
    ],
  series: [
    {
      name: 'Direct',
      type: 'bar',
      barWidth: '60%',
      data: []
    }
  ]
};

if (option && typeof option === 'object') {
        myChart.setOption(option);
        // 异步获取数据并更新图表
        decDataMean("temperature").then(data => {
            // 更新 series 数据
            const tochinese = {
            "ranshaodaiwen": "燃烧带温度(℃)",
            "shangbuwen": "上部温度(℃)",
            "rongrongdaiwen": "熔融带温度(℃)",
            "xiabuwen": "下部温度(℃)",
            "lengfengya": "冷风压强(Pa)",
            "refengya": "热风压强(Pa)",
            "ludingya": "炉顶压强（Pa）"
        }
               const keyName = [];
               const value_data = [];
               for (let key in data) {
                    if (data.hasOwnProperty(key)) { // 确保是对象自身的属性
                        keyName.push(tochinese[key]); // 将键存入 keys 列表
                        value_data.push(data[key]); // 将值存入 values 列表
                }
               }
            //对数据进行处理
            option.xAxis[0].data = keyName;
            option.series[0].data = value_data;
            console.log(keyName)
            // 使用新的配置项重新渲染图表
            myChart.setOption(option);
        }).catch(error => {
            console.error('Failed to fetch runtime data:', error);
        });
    }

    // 监听窗口大小变化，自适应图表大小
    window.addEventListener('resize', function () {
        myChart.resize();
    });

}


function Tick2(){
var dom = document.getElementById('Tick2');
var myChart = echarts.init(dom, null, {
  renderer: 'canvas',
  useDirtyRect: false
});
var app = {};

var option;

option = {
title: {
            text: '温度平均值',
            textStyle: {
            color: '#333', // 标题颜色
            fontSize: 18, // 标题字体大小
            fontWeight: 'bold' // 标题字体粗细
            // 还可以添加其他样式如字体系列 fontFamily 等
        }
        },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
   xAxis: [
        {
            type: 'category',
            data: [],
            axisTick: {
                alignWithLabel: true
            },
            axisLabel: {
                textStyle: {
                    color: '#ffcc80' // x 轴文字颜色
                }
            }
        }
    ],
  yAxis: [
        {
            type: 'value',
            axisLabel: {
                textStyle: {
                    color: '#b3d9ff' // y 轴文字颜色
                }
            }
        }
    ],
  series: [
    {
      name: 'Direct',
      type: 'bar',
      barWidth: '60%',
      data: []
    }
  ]
};

if (option && typeof option === 'object') {
        myChart.setOption(option);
        // 异步获取数据并更新图表
        decDataMean("pressure").then(data => {
            // 更新 series 数据
            const tochinese = {
            "ranshaodaiwen": "燃烧带温度(℃)",
            "shangbuwen": "上部温度(℃)",
            "rongrongdaiwen": "熔融带温度(℃)",
            "xiabuwen": "下部温度(℃)",
            "lengfengya": "冷风压强(Pa)",
            "refengya": "热风压强(Pa)",
            "ludingya": "炉顶压强（Pa）"
        }
               const keyName = [];
               const value_data = [];
               for (let key in data) {
                    if (data.hasOwnProperty(key)) { // 确保是对象自身的属性
                        keyName.push(tochinese[key]); // 将键存入 keys 列表
                        value_data.push(data[key]); // 将值存入 values 列表
                }
               }
            //对数据进行处理
            option.xAxis[0].data = keyName;
            option.series[0].data = value_data;
            console.log(keyName)
            // 使用新的配置项重新渲染图表
            myChart.setOption(option);
        }).catch(error => {
            console.error('Failed to fetch runtime data:', error);
        });
    }

    // 监听窗口大小变化，自适应图表大小
    window.addEventListener('resize', function () {
        myChart.resize();
    });

}

async function decDataMean(type) {
    const url = `./dataproduce`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (type === "temperature"){
            return data.temperature;
        }else{
        return data.pressure;
        }
        console.log(data)
          // 返回从接口获取的数据

    } catch (error) {
        console.error('Error fetching runtime data:', error);
        return [];  // 返回空数组作为默认值
    }
}


//数据采集开关
async function shucaiOpen(buouzhi) {
    url = `./shucaiOpen?run_state_zhiling=${buouzhi}`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${document.cookie.replace(/(?:(?:^|.*;\s*)access_token\s*\=\s*([^;]*).*$)|^.*$/, "$1")}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(data)
          // 返回从接口获取的数据

    } catch (error) {
    }
}
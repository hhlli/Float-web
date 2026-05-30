import * as echarts from 'echarts'

const matrixTheme = {
  textStyle: {
    fontFamily: 'Courier New, monospace'
  },
  tooltip: {
    backgroundColor: 'rgba(2, 14, 26, 0.95)',
    borderColor: '#00ff8833',
    textStyle: {
      fontFamily: 'Courier New, monospace'
    }
  },
  legend: {
    textStyle: {
      fontFamily: 'Courier New, monospace'
    }
  }
}

// 注册名为 'matrix' 的全局主题
echarts.registerTheme('matrix', matrixTheme)
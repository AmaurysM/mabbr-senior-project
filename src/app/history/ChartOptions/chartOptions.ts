// Helper function to calculate MACD with proper error handling
function calculateMACD(data) {
    // First ensure we have valid data
    if (!data || data.length === 0) {
      console.warn('Invalid or empty data provided to calculateMACD');
      return { barData: [] };
    }
  
    const fastPeriod = 12;
    const slowPeriod = 26;
    const signalPeriod = 9;
    
    // Calculate EMA with proper validation
    function getEMA(period, data, valueKey) {
      // Check if we have enough data points
      if (data.length < period) {
        console.warn(`Not enough data points for EMA calculation. Need ${period}, got ${data.length}`);
        return Array(data.length).fill(0);
      }
      
      const k = 2 / (period + 1);
      let emaData = [];
      let sum = 0;
      
      // Initialize with SMA - with validation
      for (let i = 0; i < period; i++) {
        // Ensure data[i] exists and has the valueKey property
        if (data[i] && typeof data[i][valueKey] === 'number') {
          sum += data[i][valueKey];
        } else {
          console.warn(`Invalid data point at index ${i} for EMA calculation`);
          // Use a fallback value or previous valid value
          if (i > 0 && data[i-1] && typeof data[i-1][valueKey] === 'number') {
            sum += data[i-1][valueKey];
          }
        }
      }
      
      emaData.push(sum / period);
      
      // Calculate EMA - with validation
      for (let i = period; i < data.length; i++) {
        // Ensure current value exists
        const currentValue = (data[i] && typeof data[i][valueKey] === 'number') 
          ? data[i][valueKey] 
          : (emaData.length > 0 ? emaData[emaData.length - 1] : 0);
        
        emaData.push(currentValue * k + emaData[emaData.length - 1] * (1 - k));
      }
      
      return emaData;
    }
    
    // Filter out invalid data points before calculations
    const validData = data.filter(item => item && typeof item.close === 'number');
    
    // If we don't have enough valid data points, return empty results
    if (validData.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
      console.warn('Not enough valid data points for MACD calculation');
      return { barData: Array(data.length).fill(0) };
    }
    
    // Get fast and slow EMAs
    let fastEMA = getEMA(fastPeriod, validData, 'close');
    let slowEMA = getEMA(slowPeriod, validData, 'close');
    
    // Calculate MACD line
    let macdLine = [];
    for (let i = 0; i < slowEMA.length; i++) {
      if (i < (slowPeriod - fastPeriod)) {
        macdLine.push(0);
      } else {
        macdLine.push(fastEMA[i - (slowPeriod - fastPeriod)] - slowEMA[i]);
      }
    }
    
    // Calculate signal line (EMA of MACD line)
    let signalLine = [];
    let macdSum = 0;
    
    for (let i = 0; i < signalPeriod && i < macdLine.length; i++) {
      macdSum += macdLine[i];
    }
    
    signalLine.push(macdSum / signalPeriod);
    
    for (let i = signalPeriod; i < macdLine.length; i++) {
      signalLine.push(macdLine[i] * (2 / (signalPeriod + 1)) + signalLine[signalLine.length - 1] * (1 - 2 / (signalPeriod + 1)));
    }
    
    // Calculate histogram
    let histogram = [];
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[i] - signalLine[i]);
    }
    
    // Prepare data for chart with proper padding
    let barData = [];
    for (let i = 0; i < data.length; i++) {
      if (i < slowPeriod - 1 + signalPeriod - 1) {
        barData.push(0);
      } else {
        const histIndex = i - (slowPeriod - 1);
        barData.push(histIndex < histogram.length ? histogram[histIndex] : 0);
      }
    }
    
    return {
      barData: barData
    };
  }
  
  // Fixed calculateMA function with proper validation
  function calculateMA(dayCount, data) {
    if (!data || data.length === 0) {
      console.warn('Invalid or empty data provided to calculateMA');
      return [];
    }
  
    const result = [];
    for (let i = 0; i < data.length; i++) {
      if (i < dayCount - 1) {
        result.push('-');
        continue;
      }
      
      let sum = 0;
      let validPoints = 0;
      
      for (let j = 0; j < dayCount; j++) {
        if (data[i - j] && typeof data[i - j].close === 'number') {
          sum += data[i - j].close;
          validPoints++;
        }
      }
      
      if (validPoints > 0) {
        result.push((sum / validPoints).toFixed(2));
      } else {
        result.push('-');
      }
    }
    return result;
  }
  
  // Modified getChartOptions function to handle data validation
  const getChartOptions = ({chartData}) => {
    // Ensure chartData is valid
    if (!chartData || !Array.isArray(chartData) || chartData.length === 0) {
      console.warn('Invalid or empty chart data provided');
      return {
        backgroundColor: '#1a1a1a',
        title: {
          text: 'No data available',
          textStyle: {
            color: '#eee'
          }
        }
      };
    }
  
    // Filter out any invalid data points
    const validChartData = chartData.filter(item => 
      item && 
      typeof item.open === 'number' && 
      typeof item.close === 'number' && 
      typeof item.high === 'number' && 
      typeof item.low === 'number'
    );
  
    if (validChartData.length === 0) {
      console.warn('No valid data points found in chartData');
      return {
        backgroundColor: '#1a1a1a',
        title: {
          text: 'No valid data points available',
          textStyle: {
            color: '#eee'
          }
        }
      };
    }
  
    // Calculate statistics safely
    const minLow = Math.min(...validChartData.map(item => item.low));
    const maxHigh = Math.max(...validChartData.map(item => item.high));
    
    // Now proceed with the original chart options using validChartData
    return {
      backgroundColor: '#1a1a1a',
      tooltip: {
        trigger: 'axis',
        // Rest of tooltip configuration remains the same...
        formatter: function (params) {
          // Customize tooltip content
          const candlestickData = params.filter(param => param.seriesName === 'K-line')[0];
          const volumeData = params.filter(param => param.seriesName === 'Volume')[0];
          
          if (!candlestickData) return '';
          
          const date = candlestickData.axisValue;
          const [open, close, low, high] = candlestickData.data;
          const volume = volumeData ? volumeData.data : 0;
          const color = close >= open ? '#ef5350' : '#26a69a';
          const change = close - open;
          const changePercent = (change / open * 100).toFixed(2);
          
          return `
            <div style="font-weight: bold; margin-bottom: 8px; color: #fff;">${date}</div>
            <div>Open: <span style="float: right; font-weight: bold;">${open.toFixed(2)}</span></div>
            <div>High: <span style="float: right; font-weight: bold;">${high.toFixed(2)}</span></div>
            <div>Low: <span style="float: right; font-weight: bold;">${low.toFixed(2)}</span></div>
            <div>Close: <span style="float: right; font-weight: bold;">${close.toFixed(2)}</span></div>
            <div>Change: <span style="float: right; font-weight: bold; color: ${color};">${change.toFixed(2)} (${changePercent}%)</span></div>
            <div style="margin-top: 8px;">Volume: <span style="float: right; font-weight: bold;">${volume.toLocaleString()}</span></div>
          `;
        }
      },
      // Rest of the original configuration...
      series: [
        {
          name: 'K-line',
          type: 'candlestick',
          data: validChartData.map(item => [item.open, item.close, item.low, item.high]),
          itemStyle: {
            color: '#ef5350',
            color0: '#26a69a',
            borderColor: '#ef5350',
            borderColor0: '#26a69a'
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 40,
            data: [
              {
                name: 'Highest',
                type: 'max',
                valueDim: 'highest',
                symbolOffset: [0, -20],
                itemStyle: {
                  color: '#FFD700'
                },
                label: {
                  formatter: '{c}',
                  position: 'top'
                }
              },
              {
                name: 'Lowest',
                type: 'min',
                valueDim: 'lowest',
                symbolOffset: [0, 20],
                itemStyle: {
                  color: '#4169E1'
                },
                label: {
                  formatter: '{c}',
                  position: 'bottom'
                }
              }
            ]
          },
          markLine: {
            symbol: ['none', 'none'],
            label: {
              show: true,
              position: 'end',
              formatter: '{b}: {c}'
            },
            lineStyle: {
              color: '#f5f5f5',
              width: 1,
              type: 'dashed'
            },
            data: [
              {
                name: 'Average',
                type: 'average',
                valueDim: 'close',
                lineStyle: {
                  color: '#f5f5f5'
                }
              },
              {
                name: 'Support',
                yAxis: minLow * 1.02,
                lineStyle: {
                  color: '#26a69a'
                }
              },
              {
                name: 'Resistance',
                yAxis: maxHigh * 0.98,
                lineStyle: {
                  color: '#ef5350'
                }
              }
            ]
          },
          markArea: {
            itemStyle: {
              color: 'rgba(255, 255, 0, 0.15)'
            },
            data: [
              [
                {
                  name: 'Breakout Zone',
                  coord: [Math.floor(validChartData.length * 0.7), maxHigh]
                },
                {
                  coord: [Math.floor(validChartData.length * 0.85), maxHigh * 1.05]
                }
              ]
            ]
          }
        },
        {
          name: 'Volume',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: validChartData.map(item => ({
            value: item.volume || 0,
            itemStyle: {
              color: item.close > item.open ? '#ef5350' : '#26a69a',
              opacity: 0.8
            }
          }))
        },
        {
          name: 'MA5',
          type: 'line',
          data: calculateMA(5, validChartData),
          smooth: true,
          lineStyle: {
            opacity: 0.8,
            color: '#FF9900',
            width: 2
          }
        },
        {
          name: 'MA20',
          type: 'line',
          data: calculateMA(20, validChartData),
          smooth: true,
          lineStyle: {
            opacity: 0.8,
            color: '#4169E1',
            width: 2
          }
        },
        {
          name: 'MACD',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          z: 1,
          data: calculateMACD(validChartData).barData,
          showSymbol: false,
          animation: false,
          itemStyle: {
            normal: {
              color: function(params) {
                return params.data >= 0 ? '#ef5350' : '#26a69a';
              }
            }
          }
        }
      ]
    };
  };
  
  export default getChartOptions;
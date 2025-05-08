const chartOptions: any = {
  chart: {
    type: "line",
    height: 500,
    background: "#1E293B",
    toolbar: {
      show: true,
      tools: {
        download: false,
        selection: true,
        zoom: true,
        zoomin: true,
        zoomout: true,
        pan: true,
        reset: true,
      },
    },
    zoom: {
      enabled: true,
      type: "x",
      autoScaleYaxis: true,
    },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 800,
    },
  },
  stroke: {
    curve: "smooth",
    width: [3, 1],
  },
  xaxis: {
    type: "datetime",
    labels: {
      style: {
        colors: "#CBD5E1",
      },
    },
  },
  yaxis: {
    tooltip: {
      enabled: true,
    },
    labels: {
      style: {
        colors: "#CBD5E1",
      },
      formatter: (value: number) => `$${value.toFixed(2)}`,
    },
  },
  plotOptions: {
    candlestick: {
      colors: {
        upward: "#10B981",
        downward: "#EF4444",
      },
    },
  },
  grid: {
    borderColor: "#334155",
  },
  tooltip: {
    theme: "dark",
    followCursor: true,
    x: {
      format: "MMM dd, HH:mm",
    },
  },
};

export default chartOptions;
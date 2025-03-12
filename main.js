/**
 * Main JavaScript file for the mouse data analyzer
 * This file contains all functionality consolidated from separate modules
 */

// Configuration settings
const CONFIG = {
  CHART_COLORS: {
    AXES: "#666",
    GRID: "#ccc",
    MALE: "#4e79a7",
    FEMALE: "#e15759",
    TEMPERATURE: "rgba(255, 165, 0, 0.7)",
    ACTIVITY: "rgba(0, 255, 0, 0.7)",
    DISTRIBUTION: "rgba(75, 192, 192, 0.7)",
    VARIATION: "rgba(153, 102, 255, 0.7)",
  },
  TEMPERATURE_RANGE: {
    MIN: 10,
    MAX: 40,
  },
  ACTIVITY_RANGE: {
    MIN: 0,
    MAX: 100,
  },
  DEFAULTS: {
    MOUSE: "all",
    GENDER: "all",
    TIME_RANGE: "24h",
    DATA_TYPE: "both",
    NORMALIZE: false,
  },
}

/**
 * Class to handle mouse data operations
 */
class DataHandler {
  constructor() {
    this.rawData = null
    this.processedData = null
    this.isLoaded = false
    this.stats = {
      temperature: {
        min: 0,
        max: 0,
        avg: 0,
      },
      activity: {
        min: 0,
        max: 0,
        avg: 0,
      },
    }
  }

  async loadData() {
    try {
      // Load all four CSV files
      const femaleActivity = await d3.csv("Mouse_Data_Student_Copy.xlsx - Fem Act.csv");
      const femaleTemp = await d3.csv("Mouse_Data_Student_Copy.xlsx - Fem Temp.csv");
      const maleActivity = await d3.csv("Mouse_Data_Student_Copy.xlsx - Male Act.csv");
      const maleTemp = await d3.csv("Mouse_Data_Student_Copy.xlsx - Male Temp.csv");

      // Create unified dataset
      const processedData = [];

      // For performance reasons, we'll sample the data (every 60 minutes)
      // This reduces the dataset size while still showing patterns
      const samplingInterval = 60;

      // Process female data
      for (let minute = 0; minute < femaleActivity.length; minute += samplingInterval) {
        const day = Math.floor(minute / 1440) + 1; // 1440 minutes per day
        const minuteOfDay = minute % 1440;
        const lightStatus = Math.floor(minuteOfDay / 720) === 0 ? "off" : "on"; // Light switches every 720 minutes

        // Check estrus status (every 4 days starting from day 2)
        const estrusStatus = ((day - 2) % 4 === 0);

        // For each female mouse
        for (let i = 1; i <= 13; i++) {
          const mouseId = `f${i}`;
          if (femaleActivity[minute] && femaleTemp[minute]) {
            const activity = parseFloat(femaleActivity[minute][mouseId]) || 0;
            const temperature = parseFloat(femaleTemp[minute][mouseId]) || 0;

            // Only add valid data points
            if (!isNaN(activity) && !isNaN(temperature) && temperature > 0) {
              processedData.push({
                id: mouseId,
                sex: "female",
                activity: activity,
                temperature: temperature,
                minute: minute,
                day: day,
                minuteOfDay: minuteOfDay,
                lightStatus: lightStatus,
                estrusStatus: estrusStatus
              });
            }
          }
        }
      }

      // Process male data (similar to female but without estrus)
      for (let minute = 0; minute < maleActivity.length; minute += samplingInterval) {
        const day = Math.floor(minute / 1440) + 1;
        const minuteOfDay = minute % 1440;
        const lightStatus = Math.floor(minuteOfDay / 720) === 0 ? "off" : "on";

        for (let i = 1; i <= 13; i++) {
          const mouseId = `m${i}`;
          if (maleActivity[minute] && maleTemp[minute]) {
            const activity = parseFloat(maleActivity[minute][mouseId]) || 0;
            const temperature = parseFloat(maleTemp[minute][mouseId]) || 0;

            // Only add valid data points
            if (!isNaN(activity) && !isNaN(temperature) && temperature > 0) {
              processedData.push({
                id: mouseId,
                sex: "male",
                activity: activity,
                temperature: temperature,
                minute: minute,
                day: day,
                minuteOfDay: minuteOfDay,
                lightStatus: lightStatus,
                estrusStatus: false // Males don't have estrus
              });
            }
          }
        }
      }

      this.rawData = processedData;
      this.processedData = processedData;
      this.isLoaded = true;
      this.calculateStats();
      return true;
    } catch (error) {
      console.error("Error loading data:", error);
      return false;
    }
  }

  calculateStats() {
    if (!this.processedData) return;

    const allTemps = [];
    const allActivities = [];

    for (const dataPoint of this.processedData) {
      allTemps.push(dataPoint.temperature);
      allActivities.push(dataPoint.activity);
    }

    this.stats.temperature.min = Math.min(...allTemps);
    this.stats.temperature.max = Math.max(...allTemps);
    this.stats.temperature.avg = allTemps.reduce((sum, val) => sum + val, 0) / allTemps.length;

    this.stats.activity.min = Math.min(...allActivities);
    this.stats.activity.max = Math.max(...allActivities);
    this.stats.activity.avg = allActivities.reduce((sum, val) => sum + val, 0) / allActivities.length;
  }

  getStats() {
    return this.stats;
  }
}

/**
 * Class to handle chart creation and updates
 */
class ChartUtils {
  constructor() {
    this.charts = {
      overview: null,
      main: null,
      heatmap: null,
      pattern: null,
      gender: null,
      individual: null,
      scatter: null,
      line: null,
    }
    this.tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background-color", "white")
      .style("border", "1px solid #ddd")
      .style("padding", "10px")
      .style("pointer-events", "none");
  }

  initOverviewChart(canvas) {
    // Create SVG element if it doesn't exist
    const container = d3.select(canvas);
    container.selectAll("*").remove(); // Clear any existing content
    
    const svg = container
      .append("svg")
      .style("width", "100%")
      .style("height", "100%");

    this.charts.overview = {
      svg,
      draw: (data, options) => this.drawOverviewChart(svg, data, options)
    };

    return this.charts.overview;
  }

  initMainChart(canvas) {
    // Create SVG element if it doesn't exist
    const container = d3.select(canvas);
    container.selectAll("*").remove(); // Clear any existing content
    
    const svg = container
      .append("svg")
      .style("width", "100%")
      .style("height", "100%");

    this.charts.main = {
      svg,
      draw: (data, options) => this.drawMainChart(svg, data, options)
    };

    return this.charts.main;
  }

  initScatterPlot(canvas) {
    // Create SVG element if it doesn't exist
    const container = d3.select(canvas);
    container.selectAll("*").remove(); // Clear any existing content
    
    const svg = container
      .append("svg")
      .style("width", "100%")
      .style("height", "100%");

    this.charts.scatter = {
      svg,
      draw: (data, options) => this.drawScatterPlot(svg, data, options)
    };

    return this.charts.scatter;
  }

  initLinePlot(canvas) {
    // Create SVG element if it doesn't exist
    const container = d3.select(canvas);
    container.selectAll("*").remove(); // Clear any existing content
    
    const svg = container
      .append("svg")
      .style("width", "100%")
      .style("height", "100%");

    this.charts.line = {
      svg,
      draw: (data, options) => this.drawLinePlot(svg, data, options)
    };

    return this.charts.line;
  }

  initHeatmapChart(canvas) {
    console.log("Initializing heatmap chart with element:", canvas);
    
    // Check if the element is a canvas or a div (for SVG)
    if (canvas && canvas.tagName && canvas.tagName.toLowerCase() === 'canvas') {
      const ctx = canvas.getContext("2d");
      if (this.charts.heatmap) {
        this.charts.heatmap.destroy();
      }
      this.charts.heatmap = {
        ctx,
        draw: (data, options) => this.drawHeatmapChart(ctx, data, options),
      };
    } else {
      // For SVG-based visualization
      const container = d3.select(canvas);
      container.selectAll("*").remove(); // Clear any existing content
      
      const svg = container
        .append("svg")
        .style("width", "100%")
        .style("height", "100%");

      this.charts.heatmap = {
        svg,
        draw: (data, options) => this.drawHeatmapChart(svg, data, options)
      };
    }
    return this.charts.heatmap;
  }

  initPatternChart(canvas) {
    console.log("Initializing pattern chart with element:", canvas);
    
    // Check if the element is a canvas or a div (for SVG)
    if (canvas && canvas.tagName && canvas.tagName.toLowerCase() === 'canvas') {
      const ctx = canvas.getContext("2d");
      if (this.charts.pattern) {
        this.charts.pattern.destroy();
      }
      this.charts.pattern = {
        ctx,
        draw: (data, options) => this.drawPatternChart(ctx, data, options),
      };
    } else {
      // For SVG-based visualization
      const container = d3.select(canvas);
      container.selectAll("*").remove(); // Clear any existing content
      
      const svg = container
        .append("svg")
        .style("width", "100%")
        .style("height", "100%");

      this.charts.pattern = {
        svg,
        draw: (data, options) => this.drawPatternChart(svg, data, options)
      };
    }
    return this.charts.pattern;
  }

  initGenderChart(canvas) {
    console.log("Initializing gender chart with element:", canvas);
    
    // Check if the element is a canvas or a div (for SVG)
    if (canvas && canvas.tagName && canvas.tagName.toLowerCase() === 'canvas') {
      const ctx = canvas.getContext("2d");
      if (this.charts.gender) {
        this.charts.gender.destroy();
      }
      this.charts.gender = {
        ctx,
        draw: (data, options) => this.drawGenderChart(ctx, data, options),
      };
    } else {
      // For SVG-based visualization
      const container = d3.select(canvas);
      container.selectAll("*").remove(); // Clear any existing content
      
      const svg = container
        .append("svg")
        .style("width", "100%")
        .style("height", "100%");

      this.charts.gender = {
        svg,
        draw: (data, options) => this.drawGenderChart(svg, data, options)
      };
    }
    return this.charts.gender;
  }

  initIndividualChart(canvas) {
    console.log("Initializing individual chart with element:", canvas);
    
    // Check if the element is a canvas or a div (for SVG)
    if (canvas && canvas.tagName && canvas.tagName.toLowerCase() === 'canvas') {
      const ctx = canvas.getContext("2d");
      if (this.charts.individual) {
        this.charts.individual.destroy();
      }
      this.charts.individual = {
        ctx,
        draw: (data, options) => this.drawIndividualChart(ctx, data, options),
      };
    } else {
      // For SVG-based visualization
      const container = d3.select(canvas);
      container.selectAll("*").remove(); // Clear any existing content
      
      const svg = container
        .append("svg")
        .style("width", "100%")
        .style("height", "100%");

      this.charts.individual = {
        svg,
        draw: (data, options) => this.drawIndividualChart(svg, data, options)
      };
    }
    return this.charts.individual;
  }

  drawOverviewChart(svg, data, options) {
    if (!data || Object.keys(data).length === 0) {
      this.drawNoDataMessage(svg);
      return;
    }

    // Get the container dimensions
    const container = d3.select(svg.node().parentNode);
    const width = parseInt(container.style('width'));
    const height = parseInt(container.style('height'));
    const margin = { top: 50, right: 50, bottom: 70, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous content and set dimensions
    svg.attr('width', width)
       .attr('height', height)
       .html('');

    // Create main group element
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Process data into the format needed for line plot
    const processedData = this.processDataForLinePlot(data);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.minute)])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(processedData, d => d.temperature) - 0.5,
        d3.max(processedData, d => d.temperature) + 0.5
      ])
      .range([chartHeight, 0]);

    // Create color scale for gender
    const colorScale = d3.scaleOrdinal()
      .domain(['male', 'female'])
      .range([CONFIG.CHART_COLORS.MALE, CONFIG.CHART_COLORS.FEMALE]);

    // Add X and Y axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(10)
        .tickFormat(d => `${Math.floor(d / 60)}h`))
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Time (hours)');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Temperature (°C)');

    // Group data by mouse ID
    const groupedData = d3.group(processedData, d => d.id);

    // Add lines for each mouse
    g.selectAll('.line')
      .data(Array.from(groupedData))
      .join('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d[0].startsWith('m') ? 'male' : 'female'))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('d', d => d3.line()
        .x(d => xScale(d.minute))
        .y(d => yScale(d.temperature))
        (d[1])
      )
      .on('mouseover', (event, d) => {
        this.tooltip
          .style('opacity', 0.9)
          .html(`
            <strong>Mouse:</strong> ${d[0]}<br>
            <strong>Sex:</strong> ${d[0].startsWith('m') ? 'Male' : 'Female'}
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        this.tooltip.style('opacity', 0);
      });

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth - 100}, 20)`);

    legend.selectAll('rect')
      .data(['male', 'female'])
      .join('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => colorScale(d));

    legend.selectAll('text')
      .data(['male', 'female'])
      .join('text')
      .attr('x', 15)
      .attr('y', (d, i) => i * 20 + 9)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
      .attr('font-size', '12px')
      .attr('fill', CONFIG.CHART_COLORS.AXES);

    // Add title
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .text('Temperature Patterns Over Time');
  }

  drawMainChart(svg, data, options) {
    if (!data || Object.keys(data).length === 0) {
      this.drawNoDataMessage(svg);
      return;
    }

    // Get the container dimensions
    const container = d3.select(svg.node().parentNode);
    const width = parseInt(container.style('width'));
    const height = parseInt(container.style('height'));
    const margin = { top: 50, right: 50, bottom: 70, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous content and set dimensions
    svg.attr('width', width)
       .attr('height', height)
       .html('');

    // Create main group element
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data based on sex selection if provided
    let filteredData = data;
    if (options && options.sex && options.sex !== "all") {
      filteredData = data.filter(d => d.sex === options.sex);
    }

    // Group data by mouse ID
    const groupedData = d3.group(filteredData, d => d.id);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.minute)])
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.temperature) - 0.5,
        d3.max(data, d => d.temperature) + 0.5
      ])
      .range([chartHeight, 0]);

    // Create color scale for gender
    const colorScale = d3.scaleOrdinal()
      .domain(['male', 'female'])
      .range([CONFIG.CHART_COLORS.MALE, CONFIG.CHART_COLORS.FEMALE]);

    // Add X and Y axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(10)
        .tickFormat(d => `${Math.floor(d / 60)}h`))
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Time (hours)');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Temperature (°C)');

    // Add lines for each mouse
    g.selectAll('.line')
      .data(Array.from(groupedData))
      .join('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d[0].startsWith('m') ? 'male' : 'female'))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('d', d => d3.line()
        .x(d => xScale(d.minute))
        .y(d => yScale(d.temperature))
        (d[1])
      )
      .on('mouseover', (event, d) => {
        // Find the closest data point to the mouse position
        const mouseX = d3.pointer(event, this)[0];
        const x0 = xScale.invert(mouseX);
        const bisect = d3.bisector(d => d.minute).left;
        const index = bisect(d[1], x0);
        const closestData = d[1][index];

        this.tooltip
          .style('opacity', 0.9)
          .html(`
            <strong>Mouse:</strong> ${d[0]}<br>
            <strong>Temperature:</strong> ${closestData.temperature.toFixed(2)}°C<br>
            <strong>Day:</strong> ${closestData.day}<br>
            <strong>Light:</strong> ${closestData.lightStatus}<br>
            ${closestData.sex === "female" ? `<strong>Estrus:</strong> ${closestData.estrusStatus ? "Yes" : "No"}<br>` : ""}
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        this.tooltip.style('opacity', 0);
      });

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth - 100}, 20)`);

    legend.selectAll('rect')
      .data(['male', 'female'])
      .join('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => colorScale(d));

    legend.selectAll('text')
      .data(['male', 'female'])
      .join('text')
      .attr('x', 15)
      .attr('y', (d, i) => i * 20 + 9)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
      .attr('font-size', '12px')
      .attr('fill', CONFIG.CHART_COLORS.AXES);

    // Add title
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .text(`Temperature Over Time${options?.sex !== "all" ? ` (${options.sex.charAt(0).toUpperCase() + options.sex.slice(1)}s)` : ""}`);
  }

  drawScatterPlot(svg, data, options) {
    if (!data || Object.keys(data).length === 0) {
      this.drawNoDataMessage(svg);
      return;
    }

    console.log("Drawing scatter plot with data:", data.length, "points");
    console.log("SVG element:", svg.node());

    // Get the container dimensions
    const container = d3.select(svg.node().parentNode);
    const width = parseInt(container.style('width'));
    const height = parseInt(container.style('height'));
    console.log("Container dimensions:", width, "x", height);
    
    const margin = { top: 50, right: 50, bottom: 70, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous content and set dimensions
    svg.attr('width', width)
       .attr('height', height)
       .html('');

    // Create main group element
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data based on sex selection if provided
    let filteredData = data;
    if (options && options.sex && options.sex !== "all") {
      filteredData = data.filter(d => d.sex === options.sex);
    }

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.activity) * 1.05]) // Add 5% padding
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.temperature) * 0.98, 
        d3.max(data, d => d.temperature) * 1.02
      ]) // Add padding
      .range([chartHeight, 0]);

    // Create color scale for gender
    const colorScale = d3.scaleOrdinal()
      .domain(['male', 'female'])
      .range([CONFIG.CHART_COLORS.MALE, CONFIG.CHART_COLORS.FEMALE]);

    // Add X and Y axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Activity Level');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Temperature (°C)');

    // Add scatter points with transition
    g.selectAll('circle')
      .data(filteredData)
      .join('circle')
      .attr('cx', d => xScale(d.activity))
      .attr('cy', d => yScale(d.temperature))
      .attr('r', 0) // Start with radius 0 for transition
      .attr('fill', d => colorScale(d.sex))
      .attr('opacity', 0.6)
      .on('mouseover', (event, d) => {
        // Show tooltip
        this.tooltip
          .style('opacity', 0.9)
          .html(`
            <strong>Mouse:</strong> ${d.id}<br>
            <strong>Activity:</strong> ${d.activity}<br>
            <strong>Temperature:</strong> ${d.temperature.toFixed(2)}°C<br>
            <strong>Day:</strong> ${d.day}<br>
            <strong>Light:</strong> ${d.lightStatus}<br>
            ${d.sex === "female" ? `<strong>Estrus:</strong> ${d.estrusStatus ? "Yes" : "No"}<br>` : ""}
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        // Hide tooltip
        this.tooltip.style('opacity', 0);
      })
      .transition() // Add transition for points appearing
      .duration(800)
      .attr('r', 3);

    // Add legend
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth - 100}, 20)`);

    legend.selectAll('rect')
      .data(['male', 'female'])
      .join('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => colorScale(d));

    legend.selectAll('text')
      .data(['male', 'female'])
      .join('text')
      .attr('x', 15)
      .attr('y', (d, i) => i * 20 + 9)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
      .attr('font-size', '12px')
      .attr('fill', CONFIG.CHART_COLORS.AXES);

    // Add title
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .text(`Mouse Activity vs. Temperature${options?.sex !== "all" ? ` (${options.sex.charAt(0).toUpperCase() + options.sex.slice(1)}s)` : ""}`);
  }

  drawLinePlot(svg, data, options) {
    if (!data || Object.keys(data).length === 0) {
      this.drawNoDataMessage(svg);
      return;
    }

    console.log("Drawing line plot with data:", data.length, "points");
    console.log("SVG element:", svg.node());

    // Get the container dimensions
    const container = d3.select(svg.node().parentNode);
    const width = parseInt(container.style('width'));
    const height = parseInt(container.style('height'));
    console.log("Container dimensions:", width, "x", height);
    
    const margin = { top: 50, right: 50, bottom: 70, left: 70 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous content and set dimensions
    svg.attr('width', width)
       .attr('height', height)
       .html('');

    // Create main group element
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data based on sex selection if provided
    let filteredData = data;
    if (options && options.sex && options.sex !== "all") {
      filteredData = data.filter(d => d.sex === options.sex);
    }

    // Group data by mouse ID
    const groupedData = d3.group(filteredData, d => d.id);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.minute)]) 
      .range([0, chartWidth]);

    const yScale = d3.scaleLinear()
      .domain([
        d3.min(data, d => d.temperature) * 0.98, 
        d3.max(data, d => d.temperature) * 1.02
      ]) 
      .range([chartHeight, 0]);

    // Create color scale for individual mice
    const colorScale = d3.scaleOrdinal()
      .domain([
        "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "f13", // Female mice
        "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13"  // Male mice
      ])
      .range([
        "#FF0000", "#E50000", "#CC0000", "#B20000", "#990000", "#800000", "#660000", "#4D0000", "#330000", "#1A0000", "#FF1A1A", "#FF3333", "#FF4D4D",  // Shades of red for females
        "#0000FF", "#1A1AFF", "#3333FF", "#4D4DFF", "#6666FF", "#8080FF", "#9999FF", "#B2B2FF", "#CCCCFF", "#E5E5FF", "#B3B3FF", "#80B3FF", "#4D80FF"   // Shades of blue for males
      ]);

    // Add X and Y axes
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale)
        .ticks(10)
        .tickFormat(d => `${Math.floor(d / 1440) + 1}d`)) // Convert minutes to days
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', chartWidth / 2)
      .attr('y', 40)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Day');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .attr('text-anchor', 'middle')
      .text('Temperature (°C)');

    // Add lines for each mouse
    g.selectAll('.line')
      .data(Array.from(groupedData))
      .join('path')
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', d => colorScale(d[0]))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.6)
      .attr('d', d => d3.line()
        .x(d => xScale(d.minute))
        .y(d => yScale(d.temperature))
        (d[1])
      )
      .on('mouseover', (event, d) => {
        // Find the closest data point to the mouse position
        const mouseX = d3.pointer(event)[0];
        const x0 = xScale.invert(mouseX);
        const bisect = d3.bisector(d => d.minute).left;
        const index = bisect(d[1], x0);
        const closestData = d[1][index];

        this.tooltip
          .style('opacity', 0.9)
          .html(`
            <strong>Mouse:</strong> ${d[0]}<br>
            <strong>Temperature:</strong> ${closestData.temperature.toFixed(2)}°C<br>
            <strong>Day:</strong> ${closestData.day}<br>
            <strong>Light:</strong> ${closestData.lightStatus}<br>
            ${closestData.sex === "female" ? `<strong>Estrus:</strong> ${closestData.estrusStatus ? "Yes" : "No"}<br>` : ""}
          `)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        this.tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        // Filter data to show only the selected line
        const selectedMouseId = d[0];
        const filteredMouseData = data.filter(dataPoint => dataPoint.id === selectedMouseId);
        const groupedMouseData = d3.group(filteredMouseData, d => d.id);

        // Transition to the new data
        g.selectAll('.line')
          .data(Array.from(groupedMouseData))
          .join(
            enter => enter.append('path')
              .attr('class', 'line')
              .attr('fill', 'none')
              .attr('stroke', d => d[1][0].sex === 'male' ? '#0000FF' : '#FF0000')
              .attr('stroke-width', 1.5)
              .attr('opacity', 0.6)
              .attr('d', d => d3.line()
                .x(d => xScale(d.minute))
                .y(d => yScale(d.temperature))
                (d[1])
              ),
            update => update.transition()
              .duration(1000)
              .attr('stroke', d => d[1][0].sex === 'male' ? '#0000FF' : '#FF0000')
              .attr('d', d => d3.line()
                .x(d => xScale(d.minute))
                .y(d => yScale(d.temperature))
                (d[1])
              ),
            exit => exit.transition()
              .duration(1000)
              .attr('opacity', 0)
              .remove()
          );
      });

    // Add legend for male/female
    const legend = g.append('g')
      .attr('transform', `translate(${chartWidth - 100}, 20)`);
    
    const genderScale = d3.scaleOrdinal()
      .domain(['male', 'female'])
      .range(['#0000FF', '#FF0000']);

    legend.selectAll('rect')
      .data(['male', 'female'])
      .join('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', d => genderScale(d));

    legend.selectAll('text')
      .data(['male', 'female'])
      .join('text')
      .attr('x', 15)
      .attr('y', (d, i) => i * 20 + 9)
      .text(d => d.charAt(0).toUpperCase() + d.slice(1))
      .attr('font-size', '12px')
      .attr('fill', CONFIG.CHART_COLORS.AXES);

    // Add title
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .attr('fill', CONFIG.CHART_COLORS.AXES)
      .text(`Temperature of Mice Over Time${options?.sex !== "all" ? ` (${options.sex.charAt(0).toUpperCase() + options.sex.slice(1)}s)` : ""}`);
  }

  drawHeatmapChart(ctx, data, options) {
    // Check if ctx is a canvas context or an SVG element
    if (ctx.canvas) {
      // Canvas implementation
      console.log("Drawing heatmap chart on canvas");
      this.clearAndSetBackground(ctx);
      ctx.fillText("Heatmap chart not implemented yet", ctx.canvas.width / 2, ctx.canvas.height / 2);
    } else {
      // SVG implementation
      console.log("Drawing heatmap chart on SVG");
      const svg = ctx;
      const container = d3.select(svg.node().parentNode);
      const width = parseInt(container.style('width'));
      const height = parseInt(container.style('height'));
      
      // Clear previous content
      svg.selectAll("*").remove();
      
      // Add a message
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("Heatmap chart not implemented yet");
    }
  }

  drawPatternChart(ctx, data, options) {
    // Check if ctx is a canvas context or an SVG element
    if (ctx.canvas) {
      // Canvas implementation
      console.log("Drawing pattern chart on canvas");
      this.clearAndSetBackground(ctx);
      ctx.fillText("Pattern chart not implemented yet", ctx.canvas.width / 2, ctx.canvas.height / 2);
    } else {
      // SVG implementation
      console.log("Drawing pattern chart on SVG");
      const svg = ctx;
      const container = d3.select(svg.node().parentNode);
      const width = parseInt(container.style('width'));
      const height = parseInt(container.style('height'));
      
      // Clear previous content
      svg.selectAll("*").remove();
      
      // Add a message
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("Pattern chart not implemented yet");
    }
  }

  drawGenderChart(ctx, data, options) {
    // Check if ctx is a canvas context or an SVG element
    if (ctx.canvas) {
      // Canvas implementation
      console.log("Drawing gender chart on canvas");
      this.clearAndSetBackground(ctx);
      ctx.fillText("Gender chart not implemented yet", ctx.canvas.width / 2, ctx.canvas.height / 2);
    } else {
      // SVG implementation
      console.log("Drawing gender chart on SVG");
      const svg = ctx;
      const container = d3.select(svg.node().parentNode);
      const width = parseInt(container.style('width'));
      const height = parseInt(container.style('height'));
      
      // Clear previous content
      svg.selectAll("*").remove();
      
      // Add a message
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("Gender chart not implemented yet");
    }
  }

  drawIndividualChart(ctx, data, options) {
    // Check if ctx is a canvas context or an SVG element
    if (ctx.canvas) {
      // Canvas implementation
      console.log("Drawing individual chart on canvas");
      this.clearAndSetBackground(ctx);
      ctx.fillText("Individual chart not implemented yet", ctx.canvas.width / 2, ctx.canvas.height / 2);
    } else {
      // SVG implementation
      console.log("Drawing individual chart on SVG");
      const svg = ctx;
      const container = d3.select(svg.node().parentNode);
      const width = parseInt(container.style('width'));
      const height = parseInt(container.style('height'));
      
      // Clear previous content
      svg.selectAll("*").remove();
      
      // Add a message
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text("Individual chart not implemented yet");
    }
  }

  processDataForLinePlot(data) {
    const processedData = [];
    
    // Process both male and female data
    for (const dataPoint of data) {
      processedData.push({
        id: dataPoint.id,
        minute: dataPoint.minute,
        temperature: dataPoint.temperature,
        activity: dataPoint.activity,
        sex: dataPoint.sex
      });
    }
    
    return processedData;
  }

  clearAndSetBackground(ctx) {
    const { width, height } = ctx.canvas;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--color-chart-bg").trim();
    ctx.fillRect(0, 0, width, height);
  }

  drawNoDataMessage(ctx) {
    // Check if ctx is a canvas context or a DOM element (for SVG)
    if (ctx.canvas) {
      // Canvas element
      const { width, height } = ctx.canvas;
      const textColor = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();
      ctx.fillStyle = textColor;
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("No data available", width / 2, height / 2);
    } else {
      // Assume it's a DOM element for SVG
      const element = ctx.node();
      if (!element) return;
      
      const width = parseInt(d3.select(element).style('width'));
      const height = parseInt(d3.select(element).style('height'));
      const textColor = getComputedStyle(document.documentElement).getPropertyValue("--color-text").trim();
      
      d3.select(element).selectAll("*").remove();
      d3.select(element)
        .append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("fill", textColor)
        .attr("font-size", "16px")
        .text("No data available");
    }
  }
}

/**
 * Class to handle visualization state and updates
 */
class Visualization {
  constructor(dataHandler, chartUtils) {
    this.dataHandler = dataHandler;
    this.chartUtils = chartUtils;
    this.charts = {};
  }

  async init(canvases) {
    // First load the data
    const dataLoaded = await this.dataHandler.loadData();
    if (!dataLoaded) {
      throw new Error("Failed to load data");
    }

    console.log("Initializing visualizations with canvases:", canvases);

    // Initialize charts
    const { 
      overviewCanvas, 
      linePlotCanvas,
      scatterCanvas,
      heatmapCanvas, 
      patternCanvas, 
      genderCanvas, 
      individualCanvas 
    } = canvases;

    console.log("Scatter canvas element:", scatterCanvas);
    console.log("Line plot canvas element:", linePlotCanvas);

    this.charts.overview = this.chartUtils.initOverviewChart(overviewCanvas);
    this.charts.line = this.chartUtils.initLinePlot(linePlotCanvas);
    this.charts.scatter = this.chartUtils.initScatterPlot(scatterCanvas);
    console.log("Initialized scatter plot:", this.charts.scatter);
    console.log("Initialized line plot:", this.charts.line);
    
    this.charts.heatmap = this.chartUtils.initHeatmapChart(heatmapCanvas);
    this.charts.pattern = this.chartUtils.initPatternChart(patternCanvas);
    this.charts.gender = this.chartUtils.initGenderChart(genderCanvas);
    this.charts.individual = this.chartUtils.initIndividualChart(individualCanvas);
  }

  updateVisualization(options) {
    try {
      if (!this.dataHandler.isLoaded) {
        console.warn("Data not loaded yet");
        return false;
      }

      const data = this.dataHandler.rawData;
      console.log("Updating visualizations with data:", data.length, "points and options:", options);
      
      Object.entries(this.charts).forEach(([name, chart]) => {
        console.log(`Attempting to draw chart: ${name}`);
        if (chart && typeof chart.draw === 'function') {
          chart.draw(data, options);
          console.log(`Successfully drew chart: ${name}`);
        } else {
          console.warn(`Chart ${name} is not properly initialized or doesn't have a draw function`);
        }
      });

      return true;
    } catch (error) {
      console.error("Error updating visualization:", error);
      return false;
    }
  }
}

/**
 * Class to handle UI interactions
 */
class UI {
  constructor(visualization) {
    this.visualization = visualization;
    this.initUI();
    this.setupEventListeners();
  }

  initUI() {
    this.setupFilters();
  }

  setupEventListeners() {
    window.addEventListener("resize", () => this.handleResize());
  }

  setupFilters() {
    // Set up filters for each visualization
    this.setupOverviewFilters();
    this.setupLinePlotFilters();
    this.setupScatterFilters();
    this.setupHeatmapFilters();
    this.setupPatternFilters();
    this.setupGenderFilters();
    this.setupIndividualFilters();
  }

  setupOverviewFilters() {
    const container = d3.select("#filter-container-overview");
    if (!container.empty()) {
      this.createSexFilter(container, "overview");
    }
  }

  setupMainFilters() {
    // This method is no longer needed as we've removed the main chart
  }

  setupScatterFilters() {
    const container = d3.select("#scatter-chart").insert("div", ":first-child")
      .attr("id", "filter-container-scatter")
      .attr("class", "filter-container")
      .style("margin-bottom", "10px")
      .style("text-align", "right");
    
    this.createSexFilter(container, "scatter");
  }

  setupLinePlotFilters() {
    const container = d3.select("#line-plot-chart").insert("div", ":first-child")
      .attr("id", "filter-container-line")
      .attr("class", "filter-container")
      .style("margin-bottom", "10px")
      .style("text-align", "right");
    
    this.createSexFilter(container, "line");
  }

  setupHeatmapFilters() {
    // Implementation for heatmap filters
  }

  setupPatternFilters() {
    // Implementation for pattern filters
  }

  setupGenderFilters() {
    // Implementation for gender comparison filters
  }

  setupIndividualFilters() {
    // Implementation for individual variation filters
  }

  createSexFilter(container, chartId) {
    const select = container
      .append("select")
      .attr("id", `sex-filter-${chartId}`)
      .attr("class", "form-select")
      .on("change", (event) => {
        const selectedSex = event.target.value;
        this.visualization.updateVisualization({ ...CONFIG.DEFAULTS, sex: selectedSex });
      });

    select.selectAll("option")
      .data(["all", "male", "female"])
      .enter()
      .append("option")
      .attr("value", d => d)
      .text(d => d === "all" ? "All Mice" : d.charAt(0).toUpperCase() + d.slice(1) + "s");
  }

  handleResize() {
    this.visualization.updateVisualization(CONFIG.DEFAULTS);
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  const overviewContainer = document.getElementById("overview-chart");
  const scatterCanvas = document.getElementById("scatter-chart");
  const linePlotCanvas = document.getElementById("line-plot-chart");
  const heatmapCanvas = document.getElementById("heatmap-chart");
  const patternCanvas = document.getElementById("pattern-chart");
  const genderCanvas = document.getElementById("gender-chart");
  const individualCanvas = document.getElementById("individual-chart");

  const dataHandler = new DataHandler();
  const chartUtils = new ChartUtils();
  
  const visualization = new Visualization(dataHandler, chartUtils);
  
  // Initialize visualization after ensuring data is loaded
  try {
    await visualization.init({
      overviewCanvas: overviewContainer,
      linePlotCanvas,
      scatterCanvas,
      heatmapCanvas,
      patternCanvas,
      genderCanvas,
      individualCanvas
    });

    // Force an initial update with default options
    visualization.updateVisualization(CONFIG.DEFAULTS);

    const ui = new UI(visualization);
  } catch (error) {
    console.error("Failed to initialize visualization:", error);
  }
}); 
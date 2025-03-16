// Global variables
let globalData = [];
let tooltip;

// Initialize the visualization
document.addEventListener('DOMContentLoaded', async function () {
  // Show loading indicator
  d3.select("#visualization1").html('<div class="loading">Loading data, please wait...</div>');
  d3.select("#line-plot-chart").html('<div class="loading">Loading data, please wait...</div>');
  d3.select("#heatmap-chart").html('<div class="loading">Loading data, please wait...</div>');
  
  // Initialize tooltip
  tooltip = d3.select("#tooltip");

  try {
    // Load and process data
    const data = await loadData();
    globalData = data;
    console.log(data[0]);

    // Set up filters
    setupFiltersScatterPlot();
    setupFiltersTemperatureLinePlot();
    setupHeatmapFilters();

    // Create initial visualization
    createScatterPlot(data, "all");
    createTemperatureLinePlot(data, "all");
    createActivityHeatmap(data, "all", "all");
    
    // Ensure estrus filter is properly disabled initially
    const sexFilter = d3.select("#sex-filter3").node();
    if (sexFilter && sexFilter.value !== "female") {
      d3.select("#estrus-filter3").property("disabled", true);
    }
  } catch (error) {
    console.error("Error loading or processing data:", error);
    d3.select("#visualization1").html('<div class="alert alert-danger">Error loading data. Please try again later.</div>');
    d3.select("#line-plot-chart").html('<div class="alert alert-danger">Error loading data. Please try again later.</div>');
    d3.select("#heatmap-chart").html('<div class="alert alert-danger">Error loading data. Please try again later.</div>');
  }
});

// Load and process data from CSV files
async function loadData() {
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

    console.log(`Processed ${processedData.length} data points`);
    return processedData;
  } catch (error) {
    console.error("Error in data loading:", error);
    throw error;
  }
}

function setupFiltersScatterPlot() {
  // Create dropdown for sex filter
  const sexDropdownScatter = d3.select("#filter-container1")
    .append("select")
    .attr("id", "sex-filter1")
    .attr("class", "form-select")
    .on("change", function () {
      const selectedSex = this.value;
      createScatterPlot(globalData, selectedSex);
    });

  // Add options to dropdown
  sexDropdownScatter.selectAll("option")
    .data(["all", "male", "female"])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d === "all" ? "All Mice" : d.charAt(0).toUpperCase() + d.slice(1) + "s");
}

// Create scatter plot visualization
function createScatterPlot(data, filteredSex = "all") {
  // Filter data based on sex selection
  let filteredDataScatter = data;
  if (filteredSex !== "all") {
    filteredDataScatter = data.filter(d => d.sex === filteredSex);
  }

  // Set up dimensions and margins
  const margin = { top: 50, right: 50, bottom: 70, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Clear previous SVG
  d3.select("#visualization1").html("");

  // Create SVG container with responsive design
  const svg = d3.select("#visualization1")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.activity) * 1.05]) // Add 5% padding
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.temperature) * 0.98, d3.max(data, d => d.temperature) * 1.02]) // Add padding
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain(["male", "female"])
    .range(["#4e79a7", "#e15759"]); // Colorblind-friendly colors

  // Add X and Y axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Activity Level");

  svg.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Temperature (°C)");

  // Add scatter points with transition
  svg.selectAll("circle")
    .data(filteredDataScatter)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.activity))
    .attr("cy", d => yScale(d.temperature))
    .attr("r", 0) // Start with radius 0 for transition
    .attr("fill", d => colorScale(d.sex))
    .attr("opacity", 0.6)
    .on("mouseover", function (event, d) {
      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`
        <strong>Mouse:</strong> ${d.id}<br>
        <strong>Activity:</strong> ${d.activity}<br>
        <strong>Temperature:</strong> ${d.temperature.toFixed(2)}°C<br>
        <strong>Day:</strong> ${d.day}<br>
        <strong>Light:</strong> ${d.lightStatus}<br>
        ${d.sex === "female" ? `<strong>Estrus:</strong> ${d.estrusStatus ? "Yes" : "No"}<br>` : ""}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .transition() // Add transition for points appearing
    .duration(800)
    .attr("r", 3);

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 100}, 20)`);

  legend.selectAll("rect")
    .data(["male", "female"])
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => colorScale(d));

  legend.selectAll("text")
    .data(["male", "female"])
    .enter()
    .append("text")
    .attr("x", 15)
    .attr("y", (d, i) => i * 20 + 9)
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))
    .attr("font-size", "12px");

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`Mouse Activity vs. Temperature${filteredSex !== "all" ? ` (${filteredSex.charAt(0).toUpperCase() + filteredSex.slice(1)}s)` : ""}`);
}

// Error handling function
function handleError(message) {
  console.error('Error:', message);
  d3.select("#heatmap-chart").html(`<p class="error-message">Error: ${message}</p>`);
  d3.select("#line-plot-chart").html(`<p class="error-message">Error: ${message}</p>`);
  d3.select("#visualization1").html(`<p class="error-message">Error: ${message}</p>`);
}

// TODO: Fix filters, or maybe just add an instruction box on how to operate graph
function setupFiltersTemperatureLinePlot() {
  // Remove previous filter
  d3.select("#filter-container2").html("");
  
  // Add label
  d3.select("#filter-container2")
    .append("label")
    .attr("for", "sex-filter2")
    .text("Select Sex:");
  
  // Create dropdown for sex filter
  const sexDropdownLine = d3.select("#filter-container2")
    .append("select")
    .attr("id", "sex-filter2")
    .attr("class", "form-select")
    .on("change", function () {
      const selectedSex = this.value;
      createTemperatureLinePlot(globalData, selectedSex);
    });

  // Add options to dropdown
  sexDropdownLine.selectAll("option")
    .data(["all", "male", "female"])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d === "all" ? "All Mice" : d.charAt(0).toUpperCase() + d.slice(1) + "s");
}

function setupFiltersActivityLinePlot() {
  // Remove previous filter
  d3.select("#filter-container2").html("");
  
  // Add label
  d3.select("#filter-container2")
    .append("label")
    .attr("for", "sex-filter2")
    .text("Select Sex:");

  // Create dropdown for sex filter
  const sexDropdownLine = d3.select("#filter-container2")
    .append("select")
    .attr("id", "sex-filter2")
    .attr("class", "form-select")
    .on("change", function () {
      const selectedSex = this.value;
      createActivityLinePlot(globalData, selectedSex);
    });

  // Add options to dropdown
  sexDropdownLine.selectAll("option")
    .data(["all", "male", "female"])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d === "all" ? "All Mice" : d.charAt(0).toUpperCase() + d.slice(1) + "s");
}

// Create scatter plot visualization
function createTemperatureLinePlot(data, filteredSex = "all") {
  // Filter data based on sex selection
  let filteredDataLine = data;
  if (filteredSex !== "all") {
    filteredDataLine = data.filter(d => d.sex === filteredSex);
  }
  let sumstat = d3.group(filteredDataLine, d => d.id)
  console.log(sumstat)
  // Set up dimensions and margins
  const margin = { top: 50, right: 50, bottom: 70, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Clear previous SVG
  d3.select("#line-plot-chart").html("");

  // Create SVG container with responsive design
  const svg = d3.select("#line-plot-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.minute)]) // Add 5% padding
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.temperature), d3.max(data, d => d.temperature)]) // Add padding
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain([
      "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "f13", // Female mice
      "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13"  // Male mice
    ])
    .range([
      "#FF0000", "#E50000", "#CC0000", "#B20000", "#990000", "#800000", "#660000", "#4D0000", "#330000", "#1A0000", "#FF1A1A", "#FF3333", "#FF4D4D",  // Shades of red
      "#0000FF", "#1A1AFF", "#3333FF", "#4D4DFF", "#6666FF", "#8080FF", "#9999FF", "#B2B2FF", "#CCCCFF", "#E5E5FF", "#B3B3FF", "#80B3FF", "#4D80FF"   // Shades of blue
    ]); // Colorblind-friendly colors

  // Add X and Y axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Day");

  svg.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Temperature (°C)");

  // Add scatter points with transition
  svg.selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", d => colorScale(d[0]))
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.6) // Add opacity to the lines
    .attr("d", d => d3.line()
      .x(d => xScale(d.minute))
      .y(d => yScale(d.temperature))
      (d[1])
    )
    .on("mouseover", function (event, d) {
      // Find the closest data point to the mouse position
      const mouseX = d3.pointer(event, this)[0];
      const x0 = xScale.invert(mouseX);
      const bisect = d3.bisector(d => d.minute).left;
      const index = bisect(d[1], x0);
      const closestData = d[1][index];

      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`
        <strong>Mouse:</strong> ${d[0]}<br>
        <strong>Temperature:</strong> ${closestData.temperature.toFixed(2)}°C<br>
        <strong>Day:</strong> ${closestData.day}<br>
        <strong>Light:</strong> ${closestData.lightStatus}<br>
        ${closestData.sex === "female" ? `<strong>Estrus:</strong> ${closestData.estrusStatus ? "Yes" : "No"}<br>` : ""}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("click", function (event, d) {
      // Filter data to show only the selected line
      const selectedMouseId = d[0];
      const filteredData = globalData.filter(dataPoint => dataPoint.id === selectedMouseId);

      // Transition to the new data
      svg.selectAll(".line")
        .data(d3.group(filteredData, d => d.id))
        .join(
          enter => enter.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", d => d[1][0].sex === "male" ? "blue" : "red")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.6)
            .attr("d", d => d3.line()
              .x(d => xScale(d.minute))
              .y(d => yScale(d.temperature))
              (d[1])
            ),
          update => update.transition()
            .duration(1000)
            .attr("stroke", d => d[1][0].sex === "male" ? "blue" : "red")
            .attr("d", d => d3.line()
              .x(d => xScale(d.minute))
              .y(d => yScale(d.temperature))
              (d[1])
            ),
          exit => exit.transition()
            .duration(1000)
            .attr("opacity", 0)
            .remove()
        );
    });

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 100}, 20)`);
  const genderScale = d3.scaleOrdinal()
    .domain([
      "male", "female"
    ])
    .range([
      "#0000FF",
      "#FF0000"
    ]); // Colorblind-friendly colors

  legend.selectAll("rect")
    .data(["male", "female"])
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => genderScale(d));

  legend.selectAll("text")
    .data(["male", "female"])
    .enter()
    .append("text")
    .attr("x", 15)
    .attr("y", (d, i) => i * 20 + 9)
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))
    .attr("font-size", "12px");

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`Temperature of Mice Over Time${filteredSex !== "all" ? ` (${filteredSex.charAt(0).toUpperCase() + filteredSex.slice(1)}s)` : ""}`);
}

// Create activity line plot visualization
function createActivityLinePlot(data, filteredSex = "all") {
  // Filter data based on sex selection
  let filteredDataLine = data;
  if (filteredSex !== "all") {
    filteredDataLine = data.filter(d => d.sex === filteredSex);
  }
  let sumstat = d3.group(filteredDataLine, d => d.id)
  console.log(sumstat)
  // Set up dimensions and margins
  const margin = { top: 50, right: 50, bottom: 70, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Clear previous SVG
  d3.select("#line-plot-chart").html("");

  // Create SVG container with responsive design
  const svg = d3.select("#line-plot-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.minute)]) // Add 5% padding
    .range([0, width]);

  const yScale = d3.scaleLinear()
    .domain([d3.min(data, d => d.activity), d3.max(data, d => d.activity)]) // Add padding
    .range([height, 0]);

  const colorScale = d3.scaleOrdinal()
    .domain([
      "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "f13", // Female mice
      "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13"  // Male mice
    ])
    .range([
      "#FF0000", "#E50000", "#CC0000", "#B20000", "#990000", "#800000", "#660000", "#4D0000", "#330000", "#1A0000", "#FF1A1A", "#FF3333", "#FF4D4D",  // Shades of red
      "#0000FF", "#1A1AFF", "#3333FF", "#4D4DFF", "#6666FF", "#8080FF", "#9999FF", "#B2B2FF", "#CCCCFF", "#E5E5FF", "#B3B3FF", "#80B3FF", "#4D80FF"   // Shades of blue
    ]); // Colorblind-friendly colors

  // Add X and Y axes
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width / 2)
    .attr("y", 40)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Day");

  svg.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -height / 2)
    .attr("fill", "#000")
    .attr("text-anchor", "middle")
    .text("Activity Level");

  // Add scatter points with transition
  svg.selectAll(".line")
    .data(sumstat)
    .enter()
    .append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", d => colorScale(d[0]))
    .attr("stroke-width", 1.5)
    .attr("opacity", 0.6) // Add opacity to the lines
    .attr("d", d => d3.line()
      .x(d => xScale(d.minute))
      .y(d => yScale(d.activity))
      (d[1])
    )
    .on("mouseover", function (event, d) {
      // Find the closest data point to the mouse position
      const mouseX = d3.pointer(event, this)[0];
      const x0 = xScale.invert(mouseX);
      const bisect = d3.bisector(d => d.minute).left;
      const index = bisect(d[1], x0);
      const closestData = d[1][index];

      // Show tooltip
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`
        <strong>Mouse:</strong> ${d[0]}<br>
        <strong>Activity Level:</strong> ${closestData.activity}<br>
        <strong>Day:</strong> ${closestData.day}<br>
        <strong>Light:</strong> ${closestData.lightStatus}<br>
        ${closestData.sex === "female" ? `<strong>Estrus:</strong> ${closestData.estrusStatus ? "Yes" : "No"}<br>` : ""}
      `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("click", function (event, d) {
      // Filter data to show only the selected line
      const selectedMouseId = d[0];
      const filteredData = globalData.filter(dataPoint => dataPoint.id === selectedMouseId);

      // Transition to the new data
      svg.selectAll(".line")
        .data(d3.group(filteredData, d => d.id))
        .join(
          enter => enter.append("path")
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", d => d[1][0].sex === "male" ? "blue" : "red")
            .attr("stroke-width", 1.5)
            .attr("opacity", 0.6)
            .attr("d", d => d3.line()
              .x(d => xScale(d.minute))
              .y(d => yScale(d.activity))
              (d[1])
            ),
          update => update.transition()
            .duration(1000)
            .attr("stroke", d => d[1][0].sex === "male" ? "blue" : "red")
            .attr("d", d => d3.line()
              .x(d => xScale(d.minute))
              .y(d => yScale(d.activity))
              (d[1])
            ),
          exit => exit.transition()
            .duration(1000)
            .attr("opacity", 0)
            .remove()
        );
    });

  // Add legend
  const legend = svg.append("g")
    .attr("transform", `translate(${width - 100}, 20)`);
  const genderScale = d3.scaleOrdinal()
    .domain([
      "male", "female"
    ])
    .range([
      "#0000FF",
      "#FF0000"
    ]); // Colorblind-friendly colors

  legend.selectAll("rect")
    .data(["male", "female"])
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", (d, i) => i * 20)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => genderScale(d));

  legend.selectAll("text")
    .data(["male", "female"])
    .enter()
    .append("text")
    .attr("x", 15)
    .attr("y", (d, i) => i * 20 + 9)
    .text(d => d.charAt(0).toUpperCase() + d.slice(1))
    .attr("font-size", "12px");

  // Add title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(`Activity Level of Mice Over Time${filteredSex !== "all" ? ` (${filteredSex.charAt(0).toUpperCase() + filteredSex.slice(1)}s)` : ""}`);
}

d3.select('#temp-toggle').on('click', function() {
  setupFiltersTemperatureLinePlot();
  createTemperatureLinePlot(globalData, "all");
});
d3.select('#activity-toggle').on('click', function() {
  setupFiltersActivityLinePlot();
  createActivityLinePlot(globalData, "all");
});

// Function to create circular heatmap visualization
function createActivityHeatmap(data, filteredSex = "all", filteredEstrus = "all") {
  // Filter data based on sex selection
  let filteredData = data;
  if (filteredSex !== "all") {
    filteredData = data.filter(d => d.sex === filteredSex);
  }
  
  // Further filter based on estrus status (only if female is selected)
  if (filteredSex === "female" && filteredEstrus !== "all") {
    const isEstrus = filteredEstrus === "estrus";
    filteredData = filteredData.filter(d => d.estrusStatus === isEstrus);
  }

  // Process data for the heatmap - group by hour of day and day
  const hourlyActivity = processDataForHeatmap(filteredData);
  
  // Create a map of which days are estrus days (for filtering visualization)
  const estrusMap = new Map();
  if (filteredSex === "female" && filteredEstrus !== "all") {
    const isEstrus = filteredEstrus === "estrus";
    for (let day = 1; day <= 14; day++) {
      // Day is estrus if it's (day-2) % 4 === 0
      const dayIsEstrus = ((day - 2) % 4 === 0);
      // Day should be shown if its estrus status matches the filter
      estrusMap.set(day, dayIsEstrus === isEstrus);
    }
  } else {
    // If no estrus filtering, all days are shown
    for (let day = 1; day <= 14; day++) {
      estrusMap.set(day, true);
    }
  }
  
  // Set up dimensions and margins - INCREASED TOP MARGIN for better text spacing
  const margin = { top: 80, right: 50, bottom: 50, left: 50 };
  const width = 700 - margin.left - margin.right;
  const height = 700 - margin.top - margin.bottom;
  const innerRadius = 100;
  const outerRadius = Math.min(width, height) / 2 - 40; // Reduced outer radius slightly
  
  // Clear previous SVG
  d3.select("#heatmap-chart").html("");
  
  // Create SVG container with responsive design
  const svg = d3.select("#heatmap-chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .attr("width", "100%")
    .attr("height", "100%")
    .append("g")
    .attr("transform", `translate(${(width + margin.left + margin.right) / 2},${(height + margin.top + margin.bottom) / 2})`);
  
  // Add arrowhead marker definition
  svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 8)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .append("path")
    .attr("d", "M0,-5L10,0L0,5")
    .attr("fill", "#333");
  
  // Create scales
  // 24 hours in a day
  const hours = Array.from({length: 24}, (_, i) => i);
  
  // Days - we'll use first 14 days for visualization
  const days = Array.from({length: 14}, (_, i) => i + 1);
  
  // Angle scale for hours (around the circle)
  const angleScale = d3.scaleLinear()
    .domain([0, 24])
    .range([0, 2 * Math.PI]);
  
  // Radius scale for days (from center outward)
  const radiusScale = d3.scaleLinear()
    .domain([1, days.length + 1])
    .range([innerRadius, outerRadius]);
  
  // Color scale for activity levels
  const colorScale = d3.scaleSequential()
    .domain([0, d3.max(hourlyActivity, d => d.avgActivity) * 0.8])
    .interpolator(d3.interpolateYlOrRd);

  // Reference to the clock hand that we'll update on hover
  const clockHand = svg.append("line")
    .attr("id", "clock-hand")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", 0)
    .attr("y2", -innerRadius + 20)
    .attr("stroke", "#333")
    .attr("stroke-width", 2)
    .attr("marker-end", "url(#arrowhead)");
  
  // Add hour sectors (radial divisions)
  hours.forEach(hour => {
    const angle = angleScale(hour);
    const nextAngle = angleScale(hour + 1);
    
    days.forEach(day => {
      const innerR = radiusScale(day);
      const outerR = radiusScale(day + 1);
      
      // Find activity data for this hour and day
      const activityData = hourlyActivity.find(d => d.hour === hour && d.day === day);
      const activityValue = activityData ? activityData.avgActivity : 0;
      
      // Create a path for the sector
      const arc = d3.arc()
        .innerRadius(innerR)
        .outerRadius(outerR)
        .startAngle(angle)
        .endAngle(nextAngle);
      
      // Check if this day should be shown based on estrus filtering
      const isDayShown = estrusMap.get(day);
      
      svg.append("path")
        .attr("d", arc)
        .attr("fill", isDayShown ? colorScale(activityValue) : "#ffffff") // Use white for filtered out days
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("class", "hour-sector")
        .attr("data-hour", hour) // Store hour for easy reference
        .attr("data-day", day)   // Store day for easy reference
        .attr("data-shown", isDayShown) // Store whether day is shown
        .on("mouseover", function(event) {
          // Only show tooltip and update clock hand if the day is shown
          if (isDayShown) {
            // Show tooltip
            tooltip.transition()
              .duration(200)
              .style("opacity", .9);
            
            const periodOfDay = hour < 12 ? 
              (hour < 6 ? "Early Morning" : "Morning") : 
              (hour < 18 ? "Afternoon" : "Evening");
            
            const lightStatus = (hour >= 6 && hour < 18) ? "Light On" : "Light Off";
            
            const estrusStatus = ((day - 2) % 4 === 0) ? "Estrus" : "Non-Estrus";
            
            tooltip.html(`
              <strong>Day:</strong> ${day}<br>
              <strong>Hour:</strong> ${hour}:00<br>
              <strong>Period:</strong> ${periodOfDay}<br>
              <strong>Light:</strong> ${lightStatus}<br>
              ${filteredSex === "female" ? `<strong>Estrus Status:</strong> ${estrusStatus}<br>` : ''}
              <strong>Avg Activity:</strong> ${activityValue.toFixed(2)}<br>
              <strong>Sex:</strong> ${filteredSex === "all" ? "All Mice" : filteredSex.charAt(0).toUpperCase() + filteredSex.slice(1) + "s"}
            `)
              .style("left", (event.pageX + 10) + "px")
              .style("top", (event.pageY - 28) + "px");
            
            // Update clock hand angle to point to this hour
            // Adjust to start at 12 o'clock position
            const hourAngle = angleScale(hour) - Math.PI/2;
            
            // Calculate end point of the clock hand
            const handLength = innerRadius - 20;
            const endX = handLength * Math.cos(hourAngle);
            const endY = handLength * Math.sin(hourAngle);
            
            // Animate the clock hand to point to this hour
            clockHand
              .transition()
              .duration(200)
              .attr("x2", endX)
              .attr("y2", endY);
          }
        })
        .on("mouseout", function() {
          // We don't hide the tooltip here anymore - it's handled by the overlay
        });
    });
  });
  
  // Add period dividers (for Early Morning, Morning, Afternoon, Evening)
  const periodHours = [0, 6, 12, 18]; // Hours that divide the periods
  const periodNames = ["Early Morning", "Morning", "Afternoon", "Evening"];
  
  // Add divider lines
  periodHours.forEach((hour, index) => {
    const angle = angleScale(hour) - Math.PI/2; // Adjust to start at 12 o'clock position
    const startX = innerRadius * Math.cos(angle);
    const startY = innerRadius * Math.sin(angle);
    const endX = outerRadius * Math.cos(angle);
    const endY = outerRadius * Math.sin(angle);
    
    // Add divider line
    svg.append("line")
      .attr("x1", startX)
      .attr("y1", startY)
      .attr("x2", endX)
      .attr("y2", endY)
      .attr("stroke", "#555")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4")
      .attr("class", "period-divider");
    
    // Calculate position for period label
    const midRadius = innerRadius - 30; // Position inside the inner circle
    const labelAngle = angleScale(hour + 3) - Math.PI/2; // Center of each period (hour + 3)
    const labelX = midRadius * Math.cos(labelAngle);
    const labelY = midRadius * Math.sin(labelAngle);
    
    // Add period label
    svg.append("text")
      .attr("x", labelX)
      .attr("y", labelY)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#555")
      .attr("class", "period-label")
      .text(periodNames[index]);
  });
  
  // Add clock hour labels (outside the circle)
  hours.forEach(hour => {
    const angle = angleScale(hour) - Math.PI / 2; // Adjust to start at 12 o'clock position
    const labelRadius = outerRadius + 20;
    const x = labelRadius * Math.cos(angle);
    const y = labelRadius * Math.sin(angle);
    
    svg.append("text")
      .attr("x", x)
      .attr("y", y)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "12px")
      .text(hour === 0 ? "12am" : hour === 12 ? "12pm" : hour > 12 ? `${hour-12}pm` : `${hour}am`);
  });
  
  // Add color legend
  const legendWidth = 200;
  const legendHeight = 15;
  const legendX = -legendWidth / 2;
  const legendY = outerRadius + 60; // Moved down further
  
  const legendScale = d3.scaleLinear()
    .domain([0, d3.max(hourlyActivity, d => d.avgActivity) * 0.8])
    .range([0, legendWidth]);
  
  const defs = svg.append("defs");
  
  const legendGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");
  
  const gradientStops = [0, 0.2, 0.4, 0.6, 0.8, 1.0];
  
  gradientStops.forEach(stop => {
    legendGradient.append("stop")
      .attr("offset", `${stop * 100}%`)
      .attr("stop-color", colorScale(stop * d3.max(hourlyActivity, d => d.avgActivity) * 0.8));
  });
  
  svg.append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");
  
  svg.append("text")
    .attr("x", legendX)
    .attr("y", legendY - 5)
    .attr("text-anchor", "start")
    .attr("font-size", "10px")
    .text("Low Activity");
  
  svg.append("text")
    .attr("x", legendX + legendWidth)
    .attr("y", legendY - 5)
    .attr("text-anchor", "end")
    .attr("font-size", "10px")
    .text("High Activity");
  
  // Update title to include estrus status if filtered
  let titleText = `24-Hour Activity Patterns`;
  
  if (filteredSex !== "all") {
    titleText += ` (${filteredSex.charAt(0).toUpperCase() + filteredSex.slice(1)}s)`;
  }
  
  if (filteredEstrus !== "all") {
    titleText += ` - ${filteredEstrus.charAt(0).toUpperCase() + filteredEstrus.slice(1)} Days`;
  }
  
  // Add title - moved up further from the visualization
  svg.append("text")
    .attr("x", 0)
    .attr("y", -outerRadius - 50) // Increased distance
    .attr("text-anchor", "middle")
    .attr("font-size", "16px")
    .attr("font-weight", "bold")
    .text(titleText);
  
  // Add explanation text - positioned properly below the title with space
  svg.append("text")
    .attr("x", 0)
    .attr("y", -outerRadius - 30) // Increased distance from the title
    .attr("text-anchor", "middle")
    .attr("font-size", "12px")
    .text("Hours of day are shown around the circle, days extend outward from center");
  
  // Initialize the clock hand to point to 12 o'clock
  const defaultHour = 0; // 12 AM
  const defaultAngle = angleScale(defaultHour) - Math.PI/2;
  const handLength = innerRadius - 20;
  const defaultEndX = handLength * Math.cos(defaultAngle);
  const defaultEndY = handLength * Math.sin(defaultAngle);
  
  clockHand
    .attr("x2", defaultEndX)
    .attr("y2", defaultEndY);
    
  // Circle overlay to capture mouse movement for the whole clock
  svg.append("circle")
    .attr("cx", 0)
    .attr("cy", 0)
    .attr("r", outerRadius)
    .attr("fill", "transparent")
    .style("pointer-events", "all")
    .on("mousemove", function(event) {
      // Get mouse coordinates relative to the center of the circle
      const [mouseX, mouseY] = d3.pointer(event, this);
      
      // Calculate angle from center to mouse position
      let angle = Math.atan2(mouseY, mouseX);
      
      // Convert to positive angle in radians (0 to 2π)
      if (angle < 0) angle += 2 * Math.PI;
      
      // Adjust to have 0 at the top (12 o'clock position)
      angle = (angle + Math.PI/2) % (2 * Math.PI);
      
      // Convert angle to hour (0-23)
      const hour = Math.floor((angle / (2 * Math.PI)) * 24);
      
      // Calculate radius from center to determine which day
      const radius = Math.sqrt(mouseX * mouseX + mouseY * mouseY);
      
      // Determine which day (ring) the mouse is over
      let day = 1;
      for (let i = 1; i <= days.length; i++) {
        if (radius >= radiusScale(i) && radius < radiusScale(i+1)) {
          day = i;
          break;
        }
      }
      
      // Check if this day should be shown based on estrus filtering
      const isDayShown = estrusMap.get(day);
      
      // Only update tooltip and highlight if the day is shown
      if (isDayShown) {
        // Find activity data for this hour and day
        const activityData = hourlyActivity.find(d => d.hour === hour && d.day === day);
        const activityValue = activityData ? activityData.avgActivity : 0;
        
        // Calculate end point for the clock hand
        const endX = handLength * Math.cos(angle - Math.PI/2);
        const endY = handLength * Math.sin(angle - Math.PI/2);
        
        // Update the clock hand
        clockHand
          .attr("x2", endX)
          .attr("y2", endY);
        
        // Show tooltip with proper information
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        
        const periodOfDay = hour < 12 ? 
          (hour < 6 ? "Early Morning" : "Morning") : 
          (hour < 18 ? "Afternoon" : "Evening");
        
        const lightStatus = (hour >= 6 && hour < 18) ? "Light On" : "Light Off";
        
        const estrusStatus = ((day - 2) % 4 === 0) ? "Estrus" : "Non-Estrus";
        
        tooltip.html(`
          <strong>Day:</strong> ${day}<br>
          <strong>Hour:</strong> ${hour}:00<br>
          <strong>Period:</strong> ${periodOfDay}<br>
          <strong>Light:</strong> ${lightStatus}<br>
          ${filteredSex === "female" ? `<strong>Estrus Status:</strong> ${estrusStatus}<br>` : ''}
          <strong>Avg Activity:</strong> ${activityValue.toFixed(2)}<br>
          <strong>Sex:</strong> ${filteredSex === "all" ? "All Mice" : filteredSex.charAt(0).toUpperCase() + filteredSex.slice(1) + "s"}
        `)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 28) + "px");
        
        // Highlight the sector being pointed to
        svg.selectAll(".hour-sector")
          .attr("opacity", function() {
            return d3.select(this).attr("data-hour") == hour && 
                  d3.select(this).attr("data-shown") === "true" ? 1 : 0.7;
          })
          .attr("stroke-width", function() {
            return d3.select(this).attr("data-hour") == hour && 
                  d3.select(this).attr("data-shown") === "true" ? 2 : 1;
          });
      }
    })
    .on("mouseout", function() {
      // Hide tooltip
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
      
      // Reset all sectors to normal appearance
      svg.selectAll(".hour-sector")
        .attr("opacity", 1)
        .attr("stroke-width", 1);
      
      // Reset clock hand to 12 o'clock position
      clockHand
        .transition()
        .duration(500)
        .attr("x2", defaultEndX)
        .attr("y2", defaultEndY);
    });
}

// Process data for the heatmap
function processDataForHeatmap(data) {
  // Group data by day and hour
  const hourlyData = [];
  
  // Iterate through days 1-14
  for (let day = 1; day <= 14; day++) {
    // Iterate through hours 0-23
    for (let hour = 0; hour < 24; hour++) {
      // Filter data for this day and hour range
      const startMinute = (day - 1) * 1440 + hour * 60;
      const endMinute = startMinute + 60;
      
      const hourData = data.filter(d => 
        d.minute >= startMinute && d.minute < endMinute
      );
      
      // Calculate average activity for this hour
      const avgActivity = hourData.length > 0 
        ? d3.mean(hourData, d => d.activity)
        : 0;
      
      hourlyData.push({
        day: day,
        hour: hour,
        avgActivity: avgActivity
      });
    }
  }
  
  return hourlyData;
}

// Add filter setup for the heatmap
function setupHeatmapFilters() {
  // Clear the filter container
  d3.select("#filter-container3").html("");
  
  // Create a div for sex filter
  const sexFilterDiv = d3.select("#filter-container3")
    .append("div")
    .attr("class", "filter-item")
    .style("margin-right", "20px")
    .style("display", "inline-block");
  
  // Add label for sex filter
  sexFilterDiv.append("label")
    .attr("for", "sex-filter3")
    .style("margin-right", "5px")
    .text("Select Sex:");
  
  // Create dropdown for sex filter
  const sexDropdown = sexFilterDiv
    .append("select")
    .attr("id", "sex-filter3")
    .attr("class", "form-select")
    .on("change", function() {
      const selectedSex = this.value;
      // Reset estrus filter to "all" when sex is not "female"
      const estrusDropdown = d3.select("#estrus-filter3");
      if (selectedSex !== "female") {
        estrusDropdown.property("value", "all");
        estrusDropdown.property("disabled", true);
      } else {
        estrusDropdown.property("disabled", false);
      }
      
      const selectedEstrus = selectedSex === "female" ? estrusDropdown.node().value : "all";
      createActivityHeatmap(globalData, selectedSex, selectedEstrus);
    });
  
  // Add options to sex dropdown
  sexDropdown.selectAll("option")
    .data(["all", "male", "female"])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d === "all" ? "All Mice" : d.charAt(0).toUpperCase() + d.slice(1) + "s");
  
  // Create a div for estrus filter
  const estrusFilterDiv = d3.select("#filter-container3")
    .append("div")
    .attr("class", "filter-item")
    .style("display", "inline-block");
  
  // Add label for estrus filter
  estrusFilterDiv.append("label")
    .attr("for", "estrus-filter3")
    .style("margin-right", "5px")
    .text("Estrus Status (Female Only):");
  
  // Create dropdown for estrus filter
  const estrusDropdown = estrusFilterDiv
    .append("select")
    .attr("id", "estrus-filter3")
    .attr("class", "form-select")
    .property("disabled", true) // Initially disabled
    .on("change", function() {
      const selectedEstrus = this.value;
      const selectedSex = d3.select("#sex-filter3").node().value;
      createActivityHeatmap(globalData, selectedSex, selectedEstrus);
    });
  
  // Add options to estrus dropdown
  estrusDropdown.selectAll("option")
    .data(["all", "estrus", "non-estrus"])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => {
      if (d === "all") return "All Days";
      if (d === "estrus") return "Estrus Days";
      if (d === "non-estrus") return "Non-Estrus Days";
    });
}
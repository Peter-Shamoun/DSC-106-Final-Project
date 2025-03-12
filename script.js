// Global variables
let globalData = [];
let tooltip;

// Initialize the visualization
document.addEventListener('DOMContentLoaded', async function () {
  // Show loading indicator
  d3.select("#visualization1").html('<div class="loading">Loading data, please wait...</div>');
  d3.select("#line-plot-chart").html('<div class="loading">Loading data, please wait...</div>');
  
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

    // Create initial visualization
    createScatterPlot(data, "all");
    createTemperatureLinePlot(data, "all");
  } catch (error) {
    console.error("Error loading or processing data:", error);
    d3.select("#visualization1").html('<div class="alert alert-danger">Error loading data. Please try again later.</div>');
    d3.select("#line-plot-chart").html('<div class="alert alert-danger">Error loading data. Please try again later.</div>');
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
  console.error(message);
  d3.select("#visualization1").html(`<div class="alert alert-danger">${message}</div>`);
}

// TODO: Fix filters, or maybe just add an instruction box on how to operate graph
function setupFiltersTemperatureLinePlot() {
  // Remove previous filter
  d3.select("#filter-container2").html("");
  
  // Add label
  d3.select("filter-container2")
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
  d3.select("filter-container2")
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
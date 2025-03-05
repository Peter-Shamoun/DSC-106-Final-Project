// Global variables
let globalData = [];
let tooltip;

// Initialize the visualization
document.addEventListener('DOMContentLoaded', async function() {
  // Show loading indicator
  d3.select("#visualization").html('<div class="loading">Loading data, please wait...</div>');
  
  // Initialize tooltip
  tooltip = d3.select("#tooltip");
  
  try {
    // Load and process data
    const data = await loadData();
    globalData = data;
    
    // Set up filters
    setupFilters();
    
    // Create initial visualization
    createScatterPlot(data, "all");
  } catch (error) {
    console.error("Error loading or processing data:", error);
    d3.select("#visualization").html('<div class="alert alert-danger">Error loading data. Please try again later.</div>');
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

// Set up filter dropdowns
function setupFilters() {
  // Create dropdown for sex filter
  const sexDropdown = d3.select("#filter-container")
    .append("select")
    .attr("id", "sex-filter")
    .attr("class", "form-select")
    .on("change", function() {
      const selectedSex = this.value;
      createScatterPlot(globalData, selectedSex);
    });
  
  // Add options to dropdown
  sexDropdown.selectAll("option")
    .data(["all", "male", "female"])
    .enter()
    .append("option")
    .attr("value", d => d)
    .text(d => d === "all" ? "All Mice" : d.charAt(0).toUpperCase() + d.slice(1) + "s");
}

// Create scatter plot visualization
function createScatterPlot(data, filteredSex = "all") {
  // Filter data based on sex selection
  let filteredData = data;
  if (filteredSex !== "all") {
    filteredData = data.filter(d => d.sex === filteredSex);
  }
  
  // Set up dimensions and margins
  const margin = {top: 50, right: 50, bottom: 70, left: 70};
  const width = 800 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;
  
  // Clear previous SVG
  d3.select("#visualization").html("");
  
  // Create SVG container with responsive design
  const svg = d3.select("#visualization")
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
    .data(filteredData)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.activity))
    .attr("cy", d => yScale(d.temperature))
    .attr("r", 0) // Start with radius 0 for transition
    .attr("fill", d => colorScale(d.sex))
    .attr("opacity", 0.6)
    .on("mouseover", function(event, d) {
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
    .on("mouseout", function() {
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
  d3.select("#visualization").html(`<div class="alert alert-danger">${message}</div>`);
} 
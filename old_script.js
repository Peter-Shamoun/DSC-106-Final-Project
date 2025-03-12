/**
 * DataViz Template JavaScript
 * Handles interactivity and visualizations
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize all components
  initThemeToggle();
  initScrollyTelling();
  initNetworkVisualization();
  initInteractiveChart();
  initExplainerCards();
});

/**
 * Theme Toggle Functionality
 * Switches between light and dark mode
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved theme preference or use system preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && prefersDarkScheme.matches)) {
    document.body.classList.add('dark-mode');
  }
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', currentTheme);
  });
}

/**
 * Scrollytelling Functionality
 * Handles scroll-based animations and transitions
 */
function initScrollyTelling() {
  const steps = document.querySelectorAll('.step');
  if (!steps.length) return;
  
  // Set up Intersection Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add active class to current step
        entry.target.classList.add('active');
        
        // Update visualization based on current step
        const stepIndex = parseInt(entry.target.dataset.step);
        updateVisualization(stepIndex);
      } else {
        // Remove active class when step is not visible
        entry.target.classList.remove('active');
      }
    });
  }, {
    threshold: 0.7, // Trigger when 70% of the step is visible
    rootMargin: '-10% 0px -10% 0px' // Adjust the trigger area
  });
  
  // Observe all steps
  steps.forEach(step => {
    observer.observe(step);
  });
}

/**
 * Network Visualization
 * Creates and manages the interactive network visualization
 */
function initNetworkVisualization() {
  const canvas = document.getElementById('visualization-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const tooltip = document.getElementById('tooltip');
  
  // Set canvas dimensions
  function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
  }
  
  // Call resize on init and window resize
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Network data structure
  let nodes = [];
  let links = [];
  let simulation = null;
  
  // Initialize the network with random data
  function initNetwork(nodeCount = 30) {
    // Create nodes
    nodes = Array.from({ length: nodeCount }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 5 + 5,
      color: getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
      value: Math.floor(Math.random() * 100)
    }));
    
    // Create links between nodes (not all nodes are connected)
    links = [];
    nodes.forEach((node, i) => {
      const linkCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < linkCount; j++) {
        const target = Math.floor(Math.random() * nodeCount);
        if (target !== i) {
          links.push({
            source: i,
            target,
            strength: Math.random() * 0.5 + 0.1
          });
        }
      }
    });
  }
  
  // Update visualization based on current step
  function updateVisualization(stepIndex) {
    switch(stepIndex) {
      case 1:
        // Basic network
        initNetwork(30);
        break;
      case 2:
        // More connections
        initNetwork(40);
        // Add more links
        nodes.forEach((node, i) => {
          const extraLinks = Math.floor(Math.random() * 2) + 2;
          for (let j = 0; j < extraLinks; j++) {
            const target = Math.floor(Math.random() * nodes.length);
            if (target !== i) {
              links.push({
                source: i,
                target,
                strength: Math.random() * 0.3 + 0.2
              });
            }
          }
        });
        break;
      case 3:
        // Critical nodes
        initNetwork(50);
        // Create hub nodes
        const hubCount = 5;
        for (let i = 0; i < hubCount; i++) {
          const hubIndex = Math.floor(Math.random() * nodes.length);
          nodes[hubIndex].radius = 15;
          nodes[hubIndex].color = getComputedStyle(document.documentElement).getPropertyValue('--accent-color');
          
          // Connect hub to many nodes
          const connectionCount = Math.floor(Math.random() * 10) + 10;
          for (let j = 0; j < connectionCount; j++) {
            const target = Math.floor(Math.random() * nodes.length);
            if (target !== hubIndex) {
              links.push({
                source: hubIndex,
                target,
                strength: 0.3
              });
            }
          }
        }
        break;
      default:
        initNetwork();
    }
    
    // Start simulation
    startSimulation();
  }
  
  // Physics simulation for node positioning
  function startSimulation() {
    // Simple force simulation
    simulation = {
      tick: function() {
        // Apply forces
        links.forEach(link => {
          const source = nodes[link.source];
          const target = nodes[link.target];
          
          // Calculate direction
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            // Apply force proportional to distance
            const force = (distance - 100) * link.strength;
            const forceX = (dx / distance) * force;
            const forceY = (dy / distance) * force;
            
            source.x += forceX * 0.5;
            source.y += forceY * 0.5;
            target.x -= forceX * 0.5;
            target.y -= forceY * 0.5;
          }
        });
        
        // Keep nodes within bounds
        nodes.forEach(node => {
          node.x = Math.max(node.radius, Math.min(canvas.width - node.radius, node.x));
          node.y = Math.max(node.radius, Math.min(canvas.height - node.radius, node.y));
        });
        
        // Draw the network
        drawNetwork();
      }
    };
    
    // Start animation loop
    animate();
  }
  
  // Draw the network on canvas
  function drawNetwork() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw links
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
    ctx.lineWidth = 1;
    links.forEach(link => {
      const source = nodes[link.source];
      const target = nodes[link.target];
      
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    });
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }
  
  // Animation loop
  function animate() {
    if (simulation) {
      simulation.tick();
      requestAnimationFrame(animate);
    }
  }
  
  // Handle mouse interactions
  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Check if mouse is over any node
    let hoveredNode = null;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = mouseX - node.x;
      const dy = mouseY - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < node.radius) {
        hoveredNode = node;
        break;
      }
    }
    
    // Show tooltip if hovering over a node
    if (hoveredNode) {
      tooltip.style.display = 'block';
      tooltip.style.left = `${hoveredNode.x + 20}px`;
      tooltip.style.top = `${hoveredNode.y - 40}px`;
      
      const tooltipTitle = tooltip.querySelector('.tooltip-title');
      const tooltipValue = tooltip.querySelector('#tooltip-value');
      
      tooltipTitle.textContent = `Node ${hoveredNode.id}`;
      tooltipValue.textContent = hoveredNode.value;
    } else {
      tooltip.style.display = 'none';
    }
  });
  
  // Initialize with default data
  initNetwork();
  startSimulation();
}

/**
 * Mouse Data Visualization
 * Loads and processes mouse activity and temperature data
 */
async function loadMouseData() {
  try {
    // Load all four CSV files
    const femActData = await d3.csv('Mouse_Data_Student_Copy.xlsx - Fem Act.csv');
    const femTempData = await d3.csv('Mouse_Data_Student_Copy.xlsx - Fem Temp.csv');
    const maleActData = await d3.csv('Mouse_Data_Student_Copy.xlsx - Male Act.csv');
    const maleTempData = await d3.csv('Mouse_Data_Student_Copy.xlsx - Male Temp.csv');
    
    // Process and combine the data
    const processedData = processMouseData(femActData, femTempData, maleActData, maleTempData);
    
    // Return the processed data
    return processedData;
  } catch (error) {
    console.error('Error loading mouse data:', error);
    return [];
  }
}

/**
 * Process and combine mouse data from all four CSV files
 */
function processMouseData(femActData, femTempData, maleActData, maleTempData) {
  const combinedData = [];
  
  // Process female mice data
  processMiceGroup(femActData, femTempData, 'female', combinedData);
  
  // Process male mice data
  processMiceGroup(maleActData, maleTempData, 'male', combinedData);
  
  // Sample the data for better performance (every 60 minutes)
  return sampleData(combinedData, 60);
}

/**
 * Process a group of mice (male or female)
 */
function processMiceGroup(actData, tempData, sex, combinedData) {
  // Get the mouse IDs (column headers)
  const mouseIds = Object.keys(actData[0]).filter(key => key !== '');
  
  // For each mouse
  mouseIds.forEach(mouseId => {
    // For each time point (row in the CSV)
    for (let i = 0; i < actData.length; i++) {
      // Skip if data is missing
      if (!actData[i][mouseId] || !tempData[i][mouseId]) continue;
      
      // Parse activity and temperature values
      const activity = parseFloat(actData[i][mouseId]);
      const temperature = parseFloat(tempData[i][mouseId]);
      
      // Skip invalid data
      if (isNaN(activity) || isNaN(temperature) || temperature <= 0) continue;
      
      // Calculate day and minute
      const minute = i % 1440; // 1440 minutes in a day
      const day = Math.floor(i / 1440) + 1;
      
      // Determine if lights are on (6am-6pm, or minutes 360-1080)
      const lightsOn = minute >= 360 && minute < 1080;
      
      // Add to combined data
      combinedData.push({
        mouseId,
        sex,
        activity,
        temperature,
        minute,
        day,
        minuteOfDay: minute,
        lightsOn,
        // Estrus status would require additional data, set to false for now
        estrus: false
      });
    }
  });
}

/**
 * Sample data at regular intervals to reduce dataset size
 */
function sampleData(data, interval) {
  return data.filter((_, index) => index % interval === 0);
}

/**
 * Interactive Chart
 * Creates and manages the interactive data chart
 */
function initInteractiveChart() {
  const chartContainer = document.getElementById('interactive-chart');
  if (!chartContainer) return;
  
  const chartButtons = document.querySelectorAll('.chart-btn');
  
  // Update button labels for our visualization
  chartButtons.forEach(button => {
    const view = button.dataset.view;
    if (view === 'daily') button.textContent = 'All Mice';
    if (view === 'weekly') button.textContent = 'Female';
    if (view === 'monthly') button.textContent = 'Male';
  });
  
  let mouseData = []; // Will store our processed data
  let currentView = 'daily'; // 'daily' = all, 'weekly' = female, 'monthly' = male
  
  // Load the mouse data
  loadMouseData().then(data => {
    mouseData = data;
    drawChart(currentView);
  });
  
  // Add event listeners to buttons
  chartButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Remove active class from all buttons
      chartButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      // Update current view and redraw chart
      currentView = button.dataset.view;
      drawChart(currentView);
    });
  });
  
  // Set initial active button
  chartButtons[0].classList.add('active');
  
  // Draw the chart
  function drawChart(viewType) {
    if (!mouseData.length) return; // Exit if no data
    
    // Filter data based on view type
    let filteredData = mouseData;
    if (viewType === 'weekly') { // Female only
      filteredData = mouseData.filter(d => d.sex === 'female');
    } else if (viewType === 'monthly') { // Male only
      filteredData = mouseData.filter(d => d.sex === 'male');
    }
    
    // Clear previous chart
    chartContainer.innerHTML = '';
    
    // Create SVG element
    const width = chartContainer.offsetWidth;
    const height = chartContainer.offsetHeight;
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    chartContainer.appendChild(svg);
    
    // Calculate scales
    const padding = 50;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min and max values for scales
    const activityExtent = d3.extent(filteredData, d => d.activity);
    const temperatureExtent = d3.extent(filteredData, d => d.temperature);
    
    // Add a small buffer to the extents
    activityExtent[0] = Math.max(0, activityExtent[0] - 5);
    activityExtent[1] = activityExtent[1] + 5;
    temperatureExtent[0] = Math.max(0, temperatureExtent[0] - 0.5);
    temperatureExtent[1] = temperatureExtent[1] + 0.5;
    
    // Create scales
    const xScale = d3.scaleLinear()
      .domain(activityExtent)
      .range([padding, width - padding]);
    
    const yScale = d3.scaleLinear()
      .domain(temperatureExtent)
      .range([height - padding, padding]);
    
    // Create color scale
    const colorScale = d3.scaleOrdinal()
      .domain(['male', 'female'])
      .range(['#4285F4', '#EA4335']); // Blue for male, Red for female
    
    // Draw axes
    const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(axisGroup);
    
    // X-axis
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', padding);
    xAxis.setAttribute('y1', height - padding);
    xAxis.setAttribute('x2', width - padding);
    xAxis.setAttribute('y2', height - padding);
    xAxis.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--border-color'));
    xAxis.setAttribute('stroke-width', '1');
    axisGroup.appendChild(xAxis);
    
    // Y-axis
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', padding);
    yAxis.setAttribute('y1', padding);
    yAxis.setAttribute('x2', padding);
    yAxis.setAttribute('y2', height - padding);
    yAxis.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--border-color'));
    yAxis.setAttribute('stroke-width', '1');
    axisGroup.appendChild(yAxis);
    
    // X-axis ticks and labels
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const value = activityExtent[0] + (activityExtent[1] - activityExtent[0]) * (i / xTicks);
      const xPos = xScale(value);
      
      // Tick line
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', xPos);
      tick.setAttribute('y1', height - padding);
      tick.setAttribute('x2', xPos);
      tick.setAttribute('y2', height - padding + 5);
      tick.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--border-color'));
      tick.setAttribute('stroke-width', '1');
      axisGroup.appendChild(tick);
      
      // Tick label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', xPos);
      label.setAttribute('y', height - padding + 20);
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '12px');
      label.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
      label.textContent = Math.round(value);
      axisGroup.appendChild(label);
    }
    
    // X-axis label
    const xAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xAxisLabel.setAttribute('x', width / 2);
    xAxisLabel.setAttribute('y', height - 10);
    xAxisLabel.setAttribute('text-anchor', 'middle');
    xAxisLabel.setAttribute('font-size', '14px');
    xAxisLabel.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
    xAxisLabel.textContent = 'Activity Level';
    axisGroup.appendChild(xAxisLabel);
    
    // Y-axis ticks and labels
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const value = temperatureExtent[0] + (temperatureExtent[1] - temperatureExtent[0]) * (i / yTicks);
      const yPos = yScale(value);
      
      // Tick line
      const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      tick.setAttribute('x1', padding);
      tick.setAttribute('y1', yPos);
      tick.setAttribute('x2', padding - 5);
      tick.setAttribute('y2', yPos);
      tick.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--border-color'));
      tick.setAttribute('stroke-width', '1');
      axisGroup.appendChild(tick);
      
      // Tick label
      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', padding - 10);
      label.setAttribute('y', yPos + 4);
      label.setAttribute('text-anchor', 'end');
      label.setAttribute('font-size', '12px');
      label.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
      label.textContent = value.toFixed(1);
      axisGroup.appendChild(label);
    }
    
    // Y-axis label
    const yAxisLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yAxisLabel.setAttribute('x', -height / 2);
    yAxisLabel.setAttribute('y', 15);
    yAxisLabel.setAttribute('text-anchor', 'middle');
    yAxisLabel.setAttribute('font-size', '14px');
    yAxisLabel.setAttribute('transform', 'rotate(-90)');
    yAxisLabel.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
    yAxisLabel.textContent = 'Temperature (°C)';
    axisGroup.appendChild(yAxisLabel);
    
    // Create data points group
    const pointsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(pointsGroup);
    
    // Draw data points
    filteredData.forEach(d => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', xScale(d.activity));
      circle.setAttribute('cy', yScale(d.temperature));
      circle.setAttribute('r', 3);
      circle.setAttribute('fill', colorScale(d.sex));
      circle.setAttribute('opacity', '0.6');
      circle.setAttribute('data-mouse-id', d.mouseId);
      circle.setAttribute('data-activity', d.activity);
      circle.setAttribute('data-temperature', d.temperature);
      circle.setAttribute('data-day', d.day);
      circle.setAttribute('data-lights', d.lightsOn ? 'on' : 'off');
      
      // Add event listeners for tooltip
      circle.addEventListener('mouseenter', showTooltip);
      circle.addEventListener('mouseleave', hideTooltip);
      
      pointsGroup.appendChild(circle);
    });
    
    // Create legend
    const legendGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    legendGroup.setAttribute('transform', `translate(${width - padding - 100}, ${padding})`);
    svg.appendChild(legendGroup);
    
    // Legend background
    const legendBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    legendBg.setAttribute('x', 0);
    legendBg.setAttribute('y', 0);
    legendBg.setAttribute('width', 100);
    legendBg.setAttribute('height', 60);
    legendBg.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--background-color'));
    legendBg.setAttribute('stroke', getComputedStyle(document.documentElement).getPropertyValue('--border-color'));
    legendBg.setAttribute('stroke-width', '1');
    legendBg.setAttribute('rx', '5');
    legendGroup.appendChild(legendBg);
    
    // Legend title
    const legendTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    legendTitle.setAttribute('x', 50);
    legendTitle.setAttribute('y', 20);
    legendTitle.setAttribute('text-anchor', 'middle');
    legendTitle.setAttribute('font-size', '12px');
    legendTitle.setAttribute('font-weight', 'bold');
    legendTitle.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
    legendTitle.textContent = 'Sex';
    legendGroup.appendChild(legendTitle);
    
    // Male legend item
    const maleDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    maleDot.setAttribute('cx', 15);
    maleDot.setAttribute('cy', 35);
    maleDot.setAttribute('r', 5);
    maleDot.setAttribute('fill', colorScale('male'));
    legendGroup.appendChild(maleDot);
    
    const maleLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    maleLabel.setAttribute('x', 25);
    maleLabel.setAttribute('y', 39);
    maleLabel.setAttribute('font-size', '12px');
    maleLabel.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
    maleLabel.textContent = 'Male';
    legendGroup.appendChild(maleLabel);
    
    // Female legend item
    const femaleDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    femaleDot.setAttribute('cx', 15);
    femaleDot.setAttribute('cy', 50);
    femaleDot.setAttribute('r', 5);
    femaleDot.setAttribute('fill', colorScale('female'));
    legendGroup.appendChild(femaleDot);
    
    const femaleLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    femaleLabel.setAttribute('x', 25);
    femaleLabel.setAttribute('y', 54);
    femaleLabel.setAttribute('font-size', '12px');
    femaleLabel.setAttribute('fill', getComputedStyle(document.documentElement).getPropertyValue('--text-color'));
    femaleLabel.textContent = 'Female';
    legendGroup.appendChild(femaleLabel);
  }
  
  // Show tooltip on hover
  function showTooltip(event) {
    const tooltip = document.getElementById('tooltip');
    const tooltipTitle = tooltip.querySelector('.tooltip-title');
    const tooltipValue = tooltip.querySelector('#tooltip-value');
    
    const circle = event.target;
    const mouseId = circle.getAttribute('data-mouse-id');
    const activity = parseFloat(circle.getAttribute('data-activity')).toFixed(1);
    const temperature = parseFloat(circle.getAttribute('data-temperature')).toFixed(2);
    const day = circle.getAttribute('data-day');
    const lights = circle.getAttribute('data-lights');
    
    tooltipTitle.textContent = `Mouse ${mouseId}`;
    tooltipValue.innerHTML = `
      Activity: ${activity}<br>
      Temperature: ${temperature}°C<br>
      Day: ${day}<br>
      Lights: ${lights}
    `;
    
    // Position tooltip near the mouse pointer
      const rect = chartContainer.getBoundingClientRect();
    const circleRect = circle.getBoundingClientRect();
      
      tooltip.style.display = 'block';
    tooltip.style.left = `${circleRect.left - rect.left + 10}px`;
    tooltip.style.top = `${circleRect.top - rect.top - 10}px`;
    }
    
  // Hide tooltip
    function hideTooltip(event) {
    const tooltip = document.getElementById('tooltip');
      tooltip.style.display = 'none';
  }
  
  // Redraw chart on window resize
  window.addEventListener('resize', () => {
    drawChart(currentView);
  });
}

/**
 * Explainer Cards Animation
 * Adds subtle animations to the explainer cards
 */
function initExplainerCards() {
  const cards = document.querySelectorAll('.explainer-card');
  
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-10px)';
      card.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.1)';
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'translateY(0)';
      card.style.boxShadow = '';
    });
  });
}
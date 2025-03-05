# Mouse Activity and Temperature Visualization - Documentation

## Project Overview
This document captures the detailed decisions made during the development of the Mouse Activity and Temperature Visualization prototype, including the reasoning behind these decisions.

## Requirements Analysis

### Primary Objectives
1. Create an interactive web page visualizing mouse activity and core body temperature data
2. Allow users to filter the data by sex (male/female)
3. Establish a foundation for future development of a full "Explorable Explanation"

### Key Features Required
1. Data ingestion and cleaning of CSV files
2. Interactive scatter plot visualization showing activity vs. temperature
3. Sex-based filtering via dropdown menu
4. Clear explanatory text to enhance understanding
5. Deployment on GitHub Pages

### Dataset Analysis
The dataset consists of four CSV files:
- Female activity data (Mouse_Data_Student_Copy.xlsx - Fem Act.csv)
- Female temperature data (Mouse_Data_Student_Copy.xlsx - Fem Temp.csv)
- Male activity data (Mouse_Data_Student_Copy.xlsx - Male Act.csv)
- Male temperature data (Mouse_Data_Student_Copy.xlsx - Male Temp.csv)

Each file contains data for 13 mice over 14 days at minute-level resolution, resulting in approximately 20,160 data points per mouse (1,440 minutes per day × 14 days).

## Technical Decisions

### Technology Stack
- **D3.js (v7)**: Selected for its powerful data visualization capabilities and flexibility. D3.js allows for fine-grained control over the visualization and supports complex interactions.
- **JavaScript (ES6+)**: Used for core programming to leverage modern JavaScript features like async/await, arrow functions, and template literals.
- **HTML5/CSS3**: Employed for webpage structure and styling to ensure compatibility with modern browsers.
- **Bootstrap 5**: Chosen for responsive layout and UI components to simplify the development of a mobile-friendly interface.

### Data Processing Strategy

#### Data Loading
We use D3.js's `d3.csv()` function to load the four CSV files asynchronously. This approach allows for efficient loading and error handling.

#### Data Transformation
We create a unified data structure that combines:
- Mouse ID (e.g., f1, m3)
- Sex (male/female)
- Activity level
- Temperature
- Timestamp (minute)
- Day number (1-14)
- Minute of day (0-1439)
- Light status (on/off)
- Estrus status for females (true/false)

This unified structure simplifies the visualization process and allows for more flexible filtering.

#### Data Sampling
To improve performance, we sample the data at 60-minute intervals. This reduces the dataset size from approximately 524,160 data points (20,160 × 26 mice) to about 8,736 data points while still preserving the overall patterns and trends. This decision was made to ensure smooth rendering and interaction, especially on lower-powered devices.

#### Data Validation
We implement several validation steps:
- Check for missing or NaN values and handle them appropriately
- Validate numeric ranges for activity and temperature
- Filter out invalid data points (e.g., temperature <= 0)

These validation steps ensure data integrity and prevent visualization errors.

### Visualization Design

#### Scatter Plot Selection
We chose a scatter plot for the following reasons:
1. It allows direct visualization of the relationship between two continuous variables (activity and temperature)
2. It can represent individual data points, showing the distribution and potential clusters
3. It supports additional dimensions through color, size, and shape encoding
4. It's effective for identifying patterns, outliers, and correlations

#### Visual Mapping
- **X-axis**: Activity level - This is a key behavioral metric that varies widely
- **Y-axis**: Temperature - Core body temperature is a physiological response that may correlate with activity
- **Color**: Sex (blue for males, red for females) - Using a colorblind-friendly palette to ensure accessibility
- **Opacity**: Set to 0.6 to handle overlapping points and show density
- **Tooltips**: Show detailed information on hover (mouse ID, activity, temperature, day, light status, estrus status)

#### Responsive Design
We implement responsive design using:
- SVG viewBox and preserveAspectRatio attributes
- Percentage-based widths
- Media queries for different screen sizes
- Bootstrap's grid system for layout

This ensures the visualization works well on devices of various sizes, from mobile phones to desktop computers.

### Interaction Design

#### Sex Filter Implementation
We implement a dropdown menu for filtering by sex (all, males only, females only). This simple interaction allows users to compare patterns between sexes and focus on specific subsets of the data.

The filter updates the visualization dynamically using D3.js transitions for a smooth user experience.

#### Performance Optimizations
- **Data Caching**: We store the processed data in a global variable to avoid reprocessing on each filter change
- **Efficient DOM Updates**: We use D3.js's enter/update/exit pattern for efficient DOM manipulation
- **Transitions**: We add smooth transitions when filtering data to provide visual continuity

### Webpage Structure
We organize the webpage into clear sections:
1. **Header**: Title and subtitle
2. **Introduction**: Context and background information
3. **Visualization**: Interactive scatter plot with filters
4. **Explanation**: Observations and key findings
5. **Project Status**: Current progress and future challenges
6. **Footer**: Copyright and attribution

This structure provides a logical flow and clear separation of concerns.

## Risk Management

### Identified Risks and Mitigation Strategies

#### D3.js Complexity
- **Risk**: D3.js has a steep learning curve and complex API
- **Mitigation**: We use established patterns and techniques, start with simpler visualizations, and incrementally add complexity

#### Data Loading Issues
- **Risk**: Large CSV files may cause performance issues or timeout errors
- **Mitigation**: We implement data sampling, robust error handling, and loading indicators

#### Performance with Large Dataset
- **Risk**: Rendering thousands of points may cause performance issues
- **Mitigation**: We sample the data, optimize rendering, and use opacity to handle overlapping points

#### Cross-browser Compatibility
- **Risk**: Different browsers may render SVG elements differently
- **Mitigation**: We use standard features and test on multiple browsers

#### Time Constraints
- **Risk**: Limited time to implement all features
- **Mitigation**: We focus on core requirements first and create a minimal viable product

## Future Enhancements

### Short-term Improvements
1. Add additional filters for day, light status, and estrus status
2. Implement data brushing for selecting specific regions of interest
3. Add summary statistics (e.g., mean, median, correlation coefficient)

### Long-term Vision
1. Add a time series view showing activity and temperature over time
2. Implement comparative analysis features for side-by-side comparison
3. Add machine learning components to identify patterns automatically
4. Create animated transitions to show changes over time

## Conclusion
This prototype establishes a solid foundation for exploring the relationship between mouse activity and temperature. By focusing on core functionality and user experience, we've created a visualization that meets the requirements specified in the PRD while providing a platform for future development.

The scatter plot effectively shows the relationship between activity and temperature, while the sex filter allows users to explore differences between male and female mice. The explanatory text provides context and insights, enhancing the user's understanding of the data.

Moving forward, we'll continue to refine the visualization and add more advanced features to create a comprehensive "Explorable Explanation" that provides deeper insights into mouse behavior and physiology. 
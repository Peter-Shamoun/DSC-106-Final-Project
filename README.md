# Mouse Activity and Temperature Visualization

## Project Overview
This project creates an interactive web visualization that explores the relationship between activity levels and core body temperature in mice. The visualization allows users to filter data by sex (male/female) and provides insights into patterns and correlations between these variables.

## Dataset
The dataset contains mouse activity and core body temperature data collected over two weeks at minute-level resolution:

- **Description**: The data covers 2 weeks of minute-level activity and core body temperature in males and females.
- **Light Cycle**: Light follows a 12-hour on/off controlled pattern (lights off at t=0, then switches every 720 minutes).
- **Estrus Cycle**: Estrus (the day of ovulation) for all females starts on day 2, repeating every 4 days.
- **Data Structure**: 
  - 13 female mice (f1-f13)
  - 13 male mice (m1-m13)
  - Activity and temperature measurements for each minute over 14 days (20,160 data points per mouse)

## Features
- Interactive scatter plot visualization of activity vs. temperature
- Sex-based filtering (all, males only, females only)
- Tooltips showing detailed information for each data point
- Responsive design that works on various screen sizes
- Clear explanatory text to enhance understanding

## Technical Implementation
- **Data Processing**: Loads and processes CSV data using D3.js
- **Visualization**: Creates an interactive scatter plot with D3.js
- **Filtering**: Implements a dropdown menu for filtering by sex
- **Responsiveness**: Uses responsive SVG techniques and Bootstrap for layout

## Project Structure
```
project/
├── index.html           # Main HTML file
├── styles.css           # CSS styles
├── script.js            # Main JavaScript file
├── data/                # Data files
│   ├── Mouse_Data_Student_Copy.xlsx - Fem Act.csv
│   ├── Mouse_Data_Student_Copy.xlsx - Fem Temp.csv
│   ├── Mouse_Data_Student_Copy.xlsx - Male Act.csv
│   └── Mouse_Data_Student_Copy.xlsx - Male Temp.csv
└── README.md            # Project documentation
```

## Development Decisions

### Data Processing
- **Sampling**: To improve performance, the data is sampled at 60-minute intervals, reducing the dataset size while still showing patterns.
- **Data Validation**: Invalid data points (NaN values or temperatures <= 0) are filtered out.
- **Derived Fields**: Additional fields are calculated for each data point:
  - Day number (1-14)
  - Minute of day (0-1439)
  - Light status (on/off)
  - Estrus status for females (true/false)

### Visualization Design
- **Scatter Plot**: Chosen to show the relationship between two continuous variables (activity and temperature).
- **Color Encoding**: Blue for males, red for females (colorblind-friendly palette).
- **Tooltips**: Show detailed information on hover (mouse ID, activity, temperature, day, light status, estrus status).
- **Transitions**: Smooth animations when filtering data or loading the visualization.

### Interaction Design
- **Sex Filter**: Dropdown menu to filter by sex (all, males only, females only).
- **Responsive Design**: Visualization scales appropriately on different screen sizes.

## Future Enhancements
- Additional filters for day, light status, and estrus status
- Time series view showing activity and temperature over time
- Aggregation options (e.g., daily averages)
- Comparative analysis features
- Statistical analysis (correlation coefficients, trend lines)

## How to Run
1. Clone the repository
2. Open index.html in a web browser

## Credits
This project was created as part of the DSC-106 course. 
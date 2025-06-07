// charts.js - SVG chart generation utilities

/**
 * Creates an SVG bar chart for XP earned by project
 * @param {Array} data - Array of { project: string, xp: number }
 * @param {string} containerId - DOM element ID to render the chart
 */
export function createXpByProjectChart(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Calculate dimensions
    const width = 600;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 70, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Find max XP for scaling
    const maxXp = Math.max(...data.map(item => item.xp), 10);

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Add chart title
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.setAttribute("x", width / 2);
    title.setAttribute("y", margin.top / 2);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("class", "chart-title");
    title.textContent = "XP Earned by Project";
    svg.appendChild(title);

    // Create chart group with margins
    const chartGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    chartGroup.setAttribute("transform", `translate(${margin.left}, ${margin.top})`);
    svg.appendChild(chartGroup);

    // Create bars
    const barWidth = chartWidth / data.length;
    data.forEach((item, index) => {
        const barHeight = (item.xp / maxXp) * chartHeight;
        const barX = index * barWidth;
        const barY = chartHeight - barHeight;

        // Create bar
        const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        bar.setAttribute("x", barX);
        bar.setAttribute("y", barY);
        bar.setAttribute("width", barWidth - 5);
        bar.setAttribute("height", barHeight);
        bar.setAttribute("class", "chart-bar");
        bar.setAttribute("data-xp", item.xp);
        chartGroup.appendChild(bar);

        // Add XP value label
        if (item.xp > 0) {
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", barX + barWidth / 2);
            label.setAttribute("y", barY - 5);
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("class", "chart-label");
            label.textContent = item.xp;
            chartGroup.appendChild(label);
        }

        // Add project name label
        const projectLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        projectLabel.setAttribute("x", barX + barWidth / 2);
        projectLabel.setAttribute("y", chartHeight + 20);
        projectLabel.setAttribute("text-anchor", "middle");
        projectLabel.setAttribute("class", "chart-axis-label");
        projectLabel.textContent = item.project.substring(0, 10); // Truncate long names
        chartGroup.appendChild(projectLabel);
    });

    // Add Y-axis
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    yAxis.setAttribute("x1", 0);
    yAxis.setAttribute("y1", 0);
    yAxis.setAttribute("x2", 0);
    yAxis.setAttribute("y2", chartHeight);
    yAxis.setAttribute("class", "chart-axis");
    chartGroup.appendChild(yAxis);

    // Add X-axis
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line");
    xAxis.setAttribute("x1", 0);
    xAxis.setAttribute("y1", chartHeight);
    xAxis.setAttribute("x2", chartWidth);
    xAxis.setAttribute("y2", chartHeight);
    xAxis.setAttribute("class", "chart-axis");
    chartGroup.appendChild(xAxis);

    // Add Y-axis label
    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisLabel.setAttribute("x", -chartHeight / 2);
    yAxisLabel.setAttribute("y", -40);
    yAxisLabel.setAttribute("text-anchor", "middle");
    yAxisLabel.setAttribute("transform", "rotate(-90)");
    yAxisLabel.setAttribute("class", "chart-axis-title");
    yAxisLabel.textContent = "XP Earned";
    chartGroup.appendChild(yAxisLabel);

    // Clear container and append SVG
    container.innerHTML = '';
    container.appendChild(svg);
}

/**
 * Creates an SVG pie chart for audit ratio
 * @param {number} successCount - Number of successful audits
 * @param {number} failCount - Number of failed audits
 * @param {string} containerId - DOM element ID to render the chart
 */
export function createAuditRatioChart(successCount, failCount, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 400;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 20;
    const centerX = width / 2;
    const centerY = height / 2;

    const total = successCount + failCount;
    if (total === 0) {
        container.innerHTML = '<p>No audit data available</p>';
        return;
    }

    const successPercent = (successCount / total) * 100;
    const failPercent = (failCount / total) * 100;

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", width);
    svg.setAttribute("height", height);
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

    // Add chart title
    const title = document.createElementNS("http://www.w3.org/2000/svg", "text");
    title.setAttribute("x", centerX);
    title.setAttribute("y", 30);
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("class", "chart-title");
    title.textContent = "Audit Ratio";
    svg.appendChild(title);

    // Calculate pie slice angles
    const successAngle = (successPercent / 100) * 360;
    const failAngle = 360 - successAngle;

    // Create success slice
    const successSlice = document.createElementNS("http://www.w3.org/2000/svg", "path");
    successSlice.setAttribute("d", describeArc(centerX, centerY, radius, 0, successAngle));
    successSlice.setAttribute("fill", "#4CAF50");
    successSlice.setAttribute("class", "chart-slice");
    successSlice.setAttribute("data-percent", successPercent.toFixed(1));
    svg.appendChild(successSlice);

    // Create fail slice
    const failSlice = document.createElementNS("http://www.w3.org/2000/svg", "path");
    failSlice.setAttribute("d", describeArc(centerX, centerY, radius, successAngle, 360));
    failSlice.setAttribute("fill", "#F44336");
    failSlice.setAttribute("class", "chart-slice");
    failSlice.setAttribute("data-percent", failPercent.toFixed(1));
    svg.appendChild(failSlice);

    // Add center circle for donut effect
    const centerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerCircle.setAttribute("cx", centerX);
    centerCircle.setAttribute("cy", centerY);
    centerCircle.setAttribute("r", radius * 0.5);
    centerCircle.setAttribute("fill", "white");
    svg.appendChild(centerCircle);

    // Add success percentage text
    const successText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    successText.setAttribute("x", centerX);
    successText.setAttribute("y", centerY - 10);
    successText.setAttribute("text-anchor", "middle");
    successText.setAttribute("class", "chart-percent");
    successText.textContent = `${successPercent.toFixed(1)}%`;
    svg.appendChild(successText);

    // Add success label
    const successLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    successLabel.setAttribute("x", centerX);
    successLabel.setAttribute("y", centerY + 20);
    successLabel.setAttribute("text-anchor", "middle");
    successLabel.setAttribute("class", "chart-label");
    successLabel.textContent = "Success";
    svg.appendChild(successLabel);

    // Add legend
    const legendGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    legendGroup.setAttribute("transform", `translate(${centerX - 80}, ${height - 30})`);

    // Success legend item
    const successLegend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    successLegend.setAttribute("transform", "translate(0, 0)");
    
    const successLegendRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    successLegendRect.setAttribute("width", 15);
    successLegendRect.setAttribute("height", 15);
    successLegendRect.setAttribute("fill", "#4CAF50");
    successLegend.appendChild(successLegendRect);
    
    const successLegendText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    successLegendText.setAttribute("x", 25);
    successLegendText.setAttribute("y", 12);
    successLegendText.textContent = `Success (${successCount})`;
    successLegend.appendChild(successLegendText);
    
    legendGroup.appendChild(successLegend);

    // Fail legend item
    const failLegend = document.createElementNS("http://www.w3.org/2000/svg", "g");
    failLegend.setAttribute("transform", "translate(120, 0)");
    
    const failLegendRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    failLegendRect.setAttribute("width", 15);
    failLegendRect.setAttribute("height", 15);
    failLegendRect.setAttribute("fill", "#F44336");
    failLegend.appendChild(failLegendRect);
    
    const failLegendText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    failLegendText.setAttribute("x", 25);
    failLegendText.setAttribute("y", 12);
    failLegendText.textContent = `Fail (${failCount})`;
    failLegend.appendChild(failLegendText);
    
    legendGroup.appendChild(failLegend);

    svg.appendChild(legendGroup);

    // Clear container and append SVG
    container.innerHTML = '';
    container.appendChild(svg);
}

// Helper function to describe an SVG arc
function describeArc(x, y, radius, startAngle, endAngle) {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
        "M", x, y,
        "L", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
        "Z"
    ].join(" ");
}

// Helper function to convert polar to Cartesian coordinates
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}
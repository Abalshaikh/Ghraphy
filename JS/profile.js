    document.addEventListener('DOMContentLoaded', () => {
        fetchAllData(); // Single function to fetch all data
    });

  function logout() {
    console.log('Logout button clicked');
    localStorage.removeItem('jwt');  
    localStorage.removeItem('userData');
    console.log('JWT removed from localStorage. Current JWT:', localStorage.getItem('jwt'));
    window.location.replace('index.html');
}

    async function fetchAllData() {
        const jwt = localStorage.getItem('jwt')?.replace(/^"(.*)"$/, '$1');
        console.log('JWT:', jwt);
        if (!jwt) {
            console.log('No JWT found, redirecting to login...');
            window.location.href = 'index.html';
            return;
        }

        try {
            console.log('Fetching all user data...');
            const query = `
            {
                user {
                    id
                    login
                    firstName
                    lastName
                    email
                    campus
                    githubId
                    auditRatio
                    totalUp
                    totalDown
                    transactions(order_by: {amount: desc}, where: {type: {_eq: "level"}}, limit: 1) {
                        type
                        amount
                        progress {
                            path
                            createdAt
                            updatedAt
                        }
                        object {
                            name
                            type
                        }
                    }
                }
                skills: transaction(where: {type: {_like: "%skill%"}}, order_by: {amount: desc}) {
                    amount
                    type
                    path
                    createdAt
                }
                transactions: transaction(order_by: {createdAt: asc}) {
                    type
                    amount
                    createdAt
                }
            }
            `;

            console.log('GraphQL Query:', query);
            const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${jwt}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            console.log('GraphQL Response Status:', response.status);
            const responseBody = await response.text();
            
            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = JSON.parse(responseBody);
            console.log('Complete Data:', data);

            if (data.errors) {
                console.error('GraphQL Errors:', data.errors);
                throw new Error(data.errors[0].message || 'Failed to fetch data');
            }

            const userData = data.data.user[0];
            const skillsData = data.data.skills;
            const transactionsData = data.data.transactions;

            // Display all data
            displayUserData(userData);
            displayAuditData(userData);
            displaySkillsData(skillsData);
            
            // Draw charts with the transaction data
            drawCharts(transactionsData);

        } catch (error) {
            console.error('Error fetching data:', error);
            document.getElementById('userData').innerHTML = `
                <div class="error">Failed to load data</div>
                <div>${error.message}</div>
            `;
        }
    }

    // Keep these display functions the same
    function displayUserData(user) {
        const userDataDiv = document.getElementById('userData');
        userDataDiv.innerHTML = `
            <div class="profile-header">
                <h2>${user.firstName || ''} ${user.lastName || ''}</h2>
                <p class="username"><strong>Username:</strong> ${user.login}</p>
            </div>
            <div class="profile-details">
                <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                <p><strong>Campus:</strong> ${user.campus || 'N/A'}</p>
                <p><strong>ID:</strong> ${user.id || 'N/A'}</p>
            </div>
        `;
    }

function displayAuditData(auditData) {
    const auditDataDiv = document.getElementById('auditData');
    // Round ratio to nearest 10 (e.g., 1.37 becomes 1.4, 2.83 becomes 2.8)
    const ratio = Math.round((auditData.auditRatio || 0) * 10) / 10;
    
    // Convert to MB
    const totalUp = (auditData.totalUp || 0) / 1000000;
    const totalDown = (auditData.totalDown || 0) / 1000000;

    // Calculate max for normalization
    const max = Math.max(totalUp, totalDown) || 1;
    const upPercent = (totalUp / max) * 100;
    const downPercent = (totalDown / max) * 100;
    
    console.log('Audit Values:', {
        totalUp: totalUp,
        totalDown: totalDown,
        auditRatio: ratio
    });
        
    auditDataDiv.innerHTML = `
        <div class="stat-item" style="margin-bottom: 25px;">
            <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 8px;">Audit Ratio:</div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="stat-value ratio-${getRatioClass(ratio)}" 
                      style="font-size: 2.5rem; font-weight: 700;">
                    ${ratio.toFixed(1)}
                </span>
                <span class="ratio-comment" style="font-size: 1.1rem;">
                    ${getRatioComment(ratio)}
                </span>
            </div>
        </div>
        <div class="stat-item">
            <div style="font-size: 1.2rem; font-weight: 600; margin-bottom: 15px;">Audit XP Comparison:</div>
            <div class="chart-bar-container" style="height: 30px; margin-bottom: 10px;">
                <div class="bar up-bar" style="width: ${upPercent}%; height: 30px;" 
                     title="Up: ${totalUp.toFixed(2)} MB"></div>
                <div class="bar down-bar" style="width: ${downPercent}%; height: 30px;" 
                     title="Down: ${totalDown.toFixed(2)} MB"></div>
            </div>
            <div class="chart-labels" style="display: flex; justify-content: space-between; font-size: 1.1rem;">
                <span class="up-label" style="font-weight: 600;">Up: ${totalUp.toFixed(2)} MB</span>
                <span class="down-label" style="font-weight: 600;">Down: ${totalDown.toFixed(2)} MB</span>
            </div>
        </div>
    `;
}

// Ensure these helper functions exist
function getRatioClass(ratio) {
    if (ratio >= 1.5) return 'excellent';
    if (ratio >= 1.2) return 'good';
    if (ratio >= 1.0) return 'fair';
    return 'poor';
}

function getRatioComment(ratio) {
    if (ratio >= 1.5) return '(Excellent)';
    if (ratio >= 1.2) return '(Good)';
    if (ratio >= 1.0) return '(Fair)';
    return '(Needs improvement)';
}

    function displaySkillsData(skills) {
        const skillsDiv = document.getElementById('xpData'); // Reusing the same div
        if (!skills || skills.length === 0) {
            skillsDiv.innerHTML = '<div class="error">No skills data available</div>';
            return;
        }

        // Group skills by type and sum their amounts
        const skillGroups = skills.reduce((acc, skill) => {
            const skillType = skill.type.replace('_skill', '').replace(/_/g, ' ');
            acc[skillType] = (acc[skillType] || 0) + skill.amount;
            return acc;
        }, {});

        // Convert to array and sort by amount
        const sortedSkills = Object.entries(skillGroups)
            .map(([type, amount]) => ({ type, amount }))
            .sort((a, b) => b.amount - a.amount);

        // Create HTML for skills display
        const skillsHTML = `
            <h3>Skills</h3>
            <div class="skills-container">
                ${sortedSkills.map(skill => `
                    <div class="skill-item">
                        <span class="skill-name">${skill.type}</span>
                        <span class="skill-amount">${skill.amount} XP</span>
                    </div>
                `).join('')}
            </div>
        `;

        skillsDiv.innerHTML = skillsHTML;
    }
//     function displaySkillsData(skills) {
//     const skillsDiv = document.getElementById('xpData');
//     if (!skills || skills.length === 0) {
//         skillsDiv.innerHTML = '<div class="error" style="padding: 1rem; text-align: center;">No skills data available</div>';
//         return;
//     }

//     // Process skills data
//     const skillGroups = skills.reduce((acc, skill) => {
//         const skillType = skill.type.replace('_skill', '').replace(/_/g, ' ');
//         acc[skillType] = (acc[skillType] || 0) + skill.amount;
//         return acc;
//     }, {});

//     const sortedSkills = Object.entries(skillGroups)
//         .map(([type, amount]) => ({ type, amount }))
//         .sort((a, b) => b.amount - a.amount);

//     // Create improved skills display
//     const skillsHTML = `
//         <div style="margin-bottom: 1.5rem;">
//             <h2 style="font-size: 1.5rem; color: #4facfe; border-bottom: 2px solid rgba(79, 172, 254, 0.3); padding-bottom: 0.5rem;">
//                 Skills Overview
//             </h2>
//         </div>
//         <div class="skills-container" style="display: grid; gap: 0.75rem;">
//             ${sortedSkills.map(skill => `
//                 <div class="skill-item" style="
//                     display: flex;
//                     justify-content: space-between;
//                     align-items: center;
//                     background: rgba(255, 255, 255, 0.05);
//                     padding: 1rem;
//                     border-radius: 8px;
//                     transition: all 0.3s ease;
//                     border-left: 4px solid #4facfe;
//                 ">
//                     <span class="skill-name" style="
//                         font-weight: 500;
//                         font-size: 1.1rem;
//                         color: rgba(255, 255, 255, 0.9);
//                     ">
//                         ${skill.type}
//                     </span>
//                     <span class="skill-amount" style="
//                         font-weight: 600;
//                         font-size: 1.1rem;
//                         background: rgba(79, 172, 254, 0.2);
//                         padding: 0.35rem 0.75rem;
//                         border-radius: 20px;
//                         color: #4facfe;
//                     ">
//                         ${skill.amount.toLocaleString()} XP
//                     </span>
//                 </div>
//             `).join('')}
//         </div>
//         <div style="margin-top: 1.5rem; text-align: right; font-size: 0.9rem; color: rgba(255, 255, 255, 0.6);">
//             ${sortedSkills.length} skills displayed
//         </div>
//     `;

//     skillsDiv.innerHTML = skillsHTML;
// }

    // Add the chart drawing functions here (copy them exactly as provided)
    function drawCharts(transactions = [], progress = []) {
        drawXPChart(transactions);
        
        const reviewsGiven = transactions.filter(t => t.type === 'up')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reviewsReceived = transactions.filter(t => t.type === 'down')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        drawProjectChart(reviewsGiven, reviewsReceived);
    }

    function drawXPChart(transactions = []) {
        const svg = document.getElementById('xp-chart');
        svg.innerHTML = '';
        
        const xpTransactions = transactions
            .filter(t => t.type === 'xp')
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        let cumulativeXP = 0;
        const xpData = xpTransactions.map(t => {
            cumulativeXP += (t.amount || 0) / 1024;
            return cumulativeXP;
        });

        if (xpData.length === 0) {
            svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666">No XP data available</text>';
            return;
        }

        const width = svg.clientWidth;
        const height = 250;
        const maxXp = Math.max(...xpData, 1);
        const padding = { top: 20, right: 20, bottom: 40, left: 60 };

        const svgNS = "http://www.w3.org/2000/svg";
        const chartGroup = document.createElementNS(svgNS, "g");
        chartGroup.setAttribute("transform", `translate(${padding.left},${padding.top})`);

        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;

        const area = document.createElementNS(svgNS, "path");
        let areaPath = `M0 ${chartHeight}`;
        
        xpData.forEach((xp, i) => {
            const x = (i * chartWidth) / (xpData.length - 1);
            const y = chartHeight - (xp / maxXp) * chartHeight;
            areaPath += ` L${x} ${y}`;
        });
        
        areaPath += ` L${chartWidth} ${chartHeight} Z`;
        area.setAttribute("d", areaPath);
        area.setAttribute("fill", "rgba(33, 150, 243, 0.2)");
        area.setAttribute("stroke", "none");
        chartGroup.appendChild(area);

        const line = document.createElementNS(svgNS, "path");
        let linePath = `M0 ${chartHeight}`;
        
        xpData.forEach((xp, i) => {
            const x = (i * chartWidth) / (xpData.length - 1);
            const y = chartHeight - (xp / maxXp) * chartHeight;
            linePath += ` L${x} ${y}`;
        });
        
        line.setAttribute("d", linePath);
        line.setAttribute("stroke", "#2196F3");
        line.setAttribute("fill", "none");
        line.setAttribute("stroke-width", "3");
        line.setAttribute("stroke-linejoin", "round");
        chartGroup.appendChild(line);

        const xAxis = document.createElementNS(svgNS, "path");
        xAxis.setAttribute("d", `M0 ${chartHeight} H${chartWidth}`);
        xAxis.setAttribute("stroke", "#666");
        xAxis.setAttribute("stroke-width", "1");
        chartGroup.appendChild(xAxis);

        const yAxis = document.createElementNS(svgNS, "path");
        yAxis.setAttribute("d", `M0 0 V${chartHeight}`);
        yAxis.setAttribute("stroke", "#666");
        yAxis.setAttribute("stroke-width", "1");
        chartGroup.appendChild(yAxis);

        for (let i = 0; i <= 5; i++) {
            const value = (maxXp / 5) * i;
            const y = chartHeight - (value / maxXp) * chartHeight;
            
            const tick = document.createElementNS(svgNS, "path");
            tick.setAttribute("d", `M-5 ${y} H0`);
            tick.setAttribute("stroke", "#666");
            tick.setAttribute("stroke-width", "1");
            chartGroup.appendChild(tick);
            
            const label = document.createElementNS(svgNS, "text");
            label.setAttribute("x", -10);
            label.setAttribute("y", y + 4);
            label.setAttribute("text-anchor", "end");
            label.setAttribute("fill", "#666");
            label.textContent = value.toFixed(1);
            chartGroup.appendChild(label);
        }

        const yTitle = document.createElementNS(svgNS, "text");
        yTitle.setAttribute("x", -150);
        yTitle.setAttribute("y", chartHeight / 9);
        yTitle.setAttribute("transform", "rotate(-90)");
        yTitle.setAttribute("fill", "#666");
        yTitle.textContent = "Cumulative XP (KB)";
        chartGroup.appendChild(yTitle);

        svg.appendChild(chartGroup);
    }

    function drawProjectChart(reviewsGiven = 0, reviewsReceived = 0) {
        const svg = document.getElementById('project-chart');
        svg.innerHTML = '';
        
        // Changed division from /100 to /1000 to show hundreds instead of thousands
        const givenKB = (reviewsGiven || 0) / 1000000;
        const receivedKB = (reviewsReceived || 0) / 1000000;

        if (givenKB === 0 && receivedKB === 0) {
            svg.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#666">No audit data available</text>';
            return;
        }

        const width = svg.clientWidth - 80;
        const height = 250;
        const maxCount = Math.max(givenKB, receivedKB, 1);
        const padding = 40;
        const barWidth = 60;
        const gap = 40;

        const svgNS = "http://www.w3.org/2000/svg";
        const chartGroup = document.createElementNS(svgNS, "g");
        chartGroup.setAttribute("transform", `translate(${padding},20)`);

        // Given Bar (Green)
        const givenBar = document.createElementNS(svgNS, "rect");
        givenBar.setAttribute("x", width/2 - barWidth - gap/2);
        givenBar.setAttribute("y", height - (givenKB / maxCount) * height);
        givenBar.setAttribute("width", barWidth);
        givenBar.setAttribute("height", (givenKB / maxCount) * height);
        givenBar.setAttribute("fill", "#4CAF50");
        givenBar.setAttribute("rx", "4");
        chartGroup.appendChild(givenBar);

        // Received Bar (Red - changed from blue)
        const receivedBar = document.createElementNS(svgNS, "rect");
        receivedBar.setAttribute("x", width/2 + gap/2);
        receivedBar.setAttribute("y", height - (receivedKB / maxCount) * height);
        receivedBar.setAttribute("width", barWidth);
        receivedBar.setAttribute("height", (receivedKB / maxCount) * height);
        receivedBar.setAttribute("fill", "#F44336"); // Changed to red
        receivedBar.setAttribute("rx", "4");
        chartGroup.appendChild(receivedBar);

        // Value labels on top of each bar
        const givenValue = document.createElementNS(svgNS, "text");
        givenValue.setAttribute("x", width/2 - barWidth/2 - gap/2);
        givenValue.setAttribute("y", height - (givenKB / maxCount) * height - 10);
        givenValue.setAttribute("text-anchor", "middle");
        givenValue.setAttribute("fill", "#4CAF50");
        givenValue.setAttribute("font-weight", "bold");
        givenValue.setAttribute("font-size", "14");
        givenValue.textContent = `${givenKB.toFixed(2)} ▲ MB`;
        chartGroup.appendChild(givenValue);

        const receivedValue = document.createElementNS(svgNS, "text");
        receivedValue.setAttribute("x", width/2 + barWidth/2 + gap/2);
        receivedValue.setAttribute("y", height - (receivedKB / maxCount) * height - 10);
        receivedValue.setAttribute("text-anchor", "middle");
        receivedValue.setAttribute("fill", "#F44336"); // Changed to red
        receivedValue.setAttribute("font-weight", "bold");
        receivedValue.setAttribute("font-size", "14");
        receivedValue.textContent = `${receivedKB.toFixed(2)} ▼ MB`;
        chartGroup.appendChild(receivedValue);

        // Bar labels - now placed inside the bars at the bottom
        const givenLabel = document.createElementNS(svgNS, "text");
        givenLabel.setAttribute("x", width/2 - barWidth/2 - gap/2);
        givenLabel.setAttribute("y", height - 5); // Positioned at bottom of bar
        givenLabel.setAttribute("text-anchor", "middle");
        givenLabel.setAttribute("fill", "white"); // White text for better contrast
        givenLabel.setAttribute("font-size", "12");
        givenLabel.textContent = "Given";
        chartGroup.appendChild(givenLabel);

        const receivedLabel = document.createElementNS(svgNS, "text");
        receivedLabel.setAttribute("x", width/2 + barWidth/2 + gap/2);
        receivedLabel.setAttribute("y", height - 5); // Positioned at bottom of bar
        receivedLabel.setAttribute("text-anchor", "middle");
        receivedLabel.setAttribute("fill", "white"); // White text for better contrast
        receivedLabel.setAttribute("font-size", "12");
        receivedLabel.textContent = "Received";
        chartGroup.appendChild(receivedLabel);

        // Axis
        const axis = document.createElementNS(svgNS, "path");
        axis.setAttribute("d", `M0 ${height} H${width}`);
        axis.setAttribute("stroke", "#666");
        axis.setAttribute("stroke-width", "1");
        chartGroup.appendChild(axis);

        svg.appendChild(chartGroup);
    }
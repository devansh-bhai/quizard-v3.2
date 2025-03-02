


function getTestStatus(startTime, endTime) {
    const now = Date.now(); // Now in milliseconds
    const startTimeMs = parseInt(startTime) * 1000; // Convert start time to milliseconds
    const endTimeMs = parseInt(endTime) * 1000; // Convert end time to milliseconds
    
    if (now < startTimeMs) return 'upcoming';
    if (now >= startTimeMs && now <= endTimeMs) return 'live';
    return 'ended';
}

module.exports = { getTestStatus }
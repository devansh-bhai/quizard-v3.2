
const { ObjectId } = require('mongodb');


function formatDateTime(unixTimestampString) {
    // Convert string to number and add 5.5 hours for IST
    const istTime = parseInt(unixTimestampString) * 1000 + (5.5 * 60 * 60 * 1000);
    const date = new Date(istTime);
    
    // Format date
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Format time
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // Convert 0 to 12
    const formattedTime = `${hours}:${minutes} ${ampm}`;
    
    return `${day}/${month}/${year} : ${formattedTime}`;
}



function getTestStatus(startTime, endTime) {
    const now = Date.now(); // Now in milliseconds
    const startTimeMs = parseInt(startTime) * 1000; // Convert start time to milliseconds
    const endTimeMs = parseInt(endTime) * 1000; // Convert end time to milliseconds
    
    if (now < startTimeMs) return 'upcoming';
    if (now >= startTimeMs && now <= endTimeMs) return 'live';
    return 'ended';
}





async function restructureUserRecentTests(usersCollection, userId) {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            console.log(`User not found: ${userId}`);
            return null;
        }

        if (user.recentTests && 'batch_test' in user.recentTests) {
            return user.recentTests; // Already structured
        }

        const currentRecentTests = user.recentTests || [];
        const restructuredTests = {
            batch_test: currentRecentTests.filter(test => test.testType === 'batch_test'),
            batch_dpp: currentRecentTests.filter(test => test.testType === 'batch_dpp'),
            test_series: currentRecentTests.filter(test => test.testType === 'test_series'),
        };

        await usersCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { recentTests: restructuredTests } }
        );

        return restructuredTests;
    } catch (error) {
        console.error('Error restructuring user tests:', error);
        throw error;
    }
}


module.exports = { restructureUserRecentTests , formatDateTime , getTestStatus}
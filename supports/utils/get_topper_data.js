



const getTopperInfo = async (liveTestCollection, testId) => {
    const topperData = await liveTestCollection.aggregate([
        { $match: { test_id: testId } },
        { $unwind: '$user_responses' },
        { $sort: { 'user_responses.totalMarks': -1 } },
        { $limit: 1 },
        { $project: { 
            topperMarks: '$user_responses.totalMarks',
            _id: 0 
        }}
    ]).toArray();

    return topperData[0]?.topperMarks || null;
};

module.exports = { getTopperInfo }
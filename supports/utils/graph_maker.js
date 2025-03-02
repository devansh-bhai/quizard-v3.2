



// function generate_graph (req, res) {
//     try {
//         const { overallReport } = req.parms;
//        // console.log(req.body)
//         if (!overallReport) {
//             return res.status(400).json({error:'Missing overallReport in request body'});
//         }

//         const sectionsArray = Object.values(overallReport.sectionStats || {});
        
//         res.render('graph', { 
//             sections: sectionsArray,
//             overallReport: {
//                 ...overallReport,
//                 sectionStats: undefined
//             }
//         });
//     } catch (error) {
//         console.error('Error processing stats:', error);
//         res.status(400).json({ error: error.message });
//     }
// };

// module.exports = { generate_graph }


function generate_graph(req, res) {
    try {
        // Get the data parameter from the request query params
        const encodedData = req.query.data;

        if (!encodedData) {
            return res.status(400).json({ error: 'Missing data parameter in request query' });
        }

        // Decode the base64 data
        const jsonString = atob(decodeURIComponent(encodedData)); // FIXED: Correct decoding order
        const decodedData = JSON.parse(jsonString);

        const { overallReport } = decodedData;

        if (!overallReport) {
            return res.status(400).json({ error: 'Missing overallReport in decoded data' });
        }

        const sectionsArray = Object.values(overallReport.sectionStats || {});

        // Render the graph template with the decoded data
        res.render('graph', { 
            sections: sectionsArray,
            overallReport: {
                ...overallReport,
                sectionStats: undefined
            }
        });
    } catch (error) {
        console.error('Error processing stats:', error);
        res.status(400).json({ error: error.message });
    }
}


module.exports = { generate_graph };
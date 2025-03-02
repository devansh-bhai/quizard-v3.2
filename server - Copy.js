const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cron = require('node-cron');
const { Buffer } = require('buffer');
const { v4: uuidv4 } = require('uuid'); // UUID for unique IDs



// Configure the MongoDB connection string
// const mongoUri = "mongodb+srv://dodez:LfAlKRvZNuxAYiXO@cluster0.vfuayho.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const mongoUri = "mongodb+srv://temp:GzWuwc9CsGh8v664@cluster0.cn8sezq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; ///change krna yad rakna ! 
let db;
let dpp_quiz;
let users;
let live_test_db;
let testSeriesDb;
let allDataDb; /// update h new apna 
let is_unser_maintainece = false
const end_date = "06/02/2025"; // Format: dd/mm/yyyy
const end_time = "00:00:00";   // Format: hh:mm:ss
const add_to_fav_limit = 5;
const recent_test_limit = 5;
const signup_limit = 2000;
let is_ads_enable = false
let ads_html = `
<style>
  .ad-container {
    font-family: Arial, sans-serif;
    text-align: center;
    padding: 20px;
    background-color: #f0f0f0;
    border-radius: 10px;
    max-width: 600px;
    margin: 20px auto;
    box-sizing: border-box;
  }

  .ad-image {
    max-width: 100%;
    height: auto;
    margin-bottom: 15px;
    border-radius: 5px;
  }

  h2 {
    font-size: 1.5rem;
    margin: 10px 0;
  }

  .ad-description {
    text-align: left;
    font-size: 1rem;
    margin: 15px 0;
    line-height: 1.5;
    padding: 0 10px;
  }

  .ad-description ol {
    padding-left: 20px;
    margin: 0 auto;
    list-style: decimal inside;
  }

  .ad-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 15px;
  }

  .ad-link {
    display: block;
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    text-decoration: none;
    border-radius: 5px;
    font-weight: bold;
    transition: background-color 0.3s;
    width: 100%;
    box-sizing: border-box;
  }

  .ad-link:hover {
    background-color: #45a049;
  }

  @media (min-width: 768px) {
    .ad-container {
      padding: 30px;
      max-width: 90%;
    }

    h2 {
      font-size: 2rem;
    }

    .ad-description {
      font-size: 1.2rem;
      text-align: center;
      padding: 0;
    }

    .ad-links {
      flex-direction: row;
      justify-content: center;
    }

    .ad-link {
      width: auto;
      padding: 10px 20px;
    }
  }

  @media (max-width: 480px) {
    .ad-container {
      padding: 15px;
      max-width: 95%;
    }

    h2 {
      font-size: 1.2rem;
    }

    .ad-description {
      font-size: 0.9rem;
    }
  }

  @media (min-width: 1024px) {
    .ad-container {
      max-width: 80%;
    }
  }
</style>

<div class="ad-container">
 <!-- <img src="https://www.shutterstock.com/image-vector/important-notice-banner-megaphone-260nw-2035247687.jpg" alt="Advertisement" class="ad-image"> -->
 
  <div class="ad-description">
    <ul>
      <li>Web Under Testing Phase errors may occur !  </li>
      
    </ul>
  </div>
  <div class="ad-links">
    <a href="https://t.me/+5fxF6FcmAnJjZmM1" class="ad-link" target="_blank">Tell us on TG </a>
  </div>
   <div class="ad-links">
    <a href="https://t.me/alphastudywallah/10" class="ad-link" target="_blank">Alpha Study [PW] </a>
  </div>
</div>

`;



app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Use cookie-parser middleware
app.use(cookieParser());

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


async function connectToMongo() {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('test_db');
    live_test_db = client.db('live_test'); 
    dpp_quiz = client.db('dpp_quiz');
    users = client.db('users_db').collection('users'); 
    testSeriesDb = client.db('test_series_db');
    allDataDb = client.db("all_data"); // New DB for metadata storage
    console.log('Connected to MongoDB');
}

async function startServer() {
    await connectToMongo();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
  }
  

  // Secret key for JWT
const JWT_SECRET = '132432xsdcdscjnmb';

// Session and middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'lode_tera_baap_hu_14',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));


function is_under_maintaince(req, res, next) {
    if (is_unser_maintainece) {
        // Assuming you have these variables defined somewhere in your server code
        res.render('under_maintain', { end_date, end_time, is_unser_maintainece });
    } else {
        next();
    }
}


app.get('/player', async (req, res) => {

    res.render('player');     
});


 // Authentication middleware
 //   -------------------------------- users login and other section ------------------------------

 function isAuthenticated(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) {
       // return res.redirect('/login');
      return res.json({ message: 'LOGIN REQUIED FOR THIS FUNCTION / FEATURE' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.clearCookie('auth_token');
        return res.redirect('/login');
    }
}

function dpp_quiz_auth(req, res, next) {
    const token = req.cookies.auth_token;
    if (!token) {
        next();
     //   console.log("auth check")
    }
    else{
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
}





// Admin dashboard route









// ---------------------------------------- live test  testing ------------------------------//



// only for accepting responces ! 
app.post('/submit-live-test', isAuthenticated, async (req, res) => {
    const { batch_id, test_id, questions } = req.body;  // Extract the data sent from the frontend

    try {
        // Find the live test in the 'live_test' collection
        const liveTest = await live_test_db.collection('live_test').findOne({ test_id: test_id });
        
        
        if (!liveTest) {
            return res.status(404).json({ message: 'Live test not found' });
        }

        // Extract only the userAnswer from the questions array
        const userAnswers = questions.map(q => {
            return q.userAnswer !== undefined && q.userAnswer !== null ? q.userAnswer : null;
        });

        // Prepare the new user response object
        const newUserResponse = {
            user_id: req.user.userId,  // Add user ID to identify the user
            answers: userAnswers  // Store only the user answers
        };

        // Check if 'user_responses' field exists, if not initialize it
        if (!liveTest.user_responses) {
            liveTest.user_responses = [];
        }

        // Check if the user already submitted responses for this test_id
        const existingResponseIndex = liveTest.user_responses.findIndex(response => response.user_id === req.user.userId);

        if (existingResponseIndex !== -1) {
            // If the user already submitted answers, update the existing response
            liveTest.user_responses[existingResponseIndex].answers = userAnswers;
            liveTest.user_responses[existingResponseIndex].batch_id = batch_id;  // Update batch_id if needed
        } else {
            // Add the new user response to the 'user_responses' array
            liveTest.user_responses.push(newUserResponse);
        }

        // Update the live test document in the database
        await live_test_db.collection('live_test').updateOne(
            { test_id: test_id },
            { $set: { user_responses: liveTest.user_responses } }
        );

        res.status(200).json({ result: 'success', message: 'Quiz submitted successfully' });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ result: 'error', message: 'An error occurred while submitting the quiz' });
    }
});


app.post('/validate-live-test/:batchId/:testId', isAuthenticated, async (req, res) => {
    const { batchId: batch_id, testId: test_id } = req.params;
    const user_id = req.user.userId;

    console.log("Test ID:", test_id);
    console.log("Batch ID:", batch_id);

    // Validate IDs
    if (!test_id || !batch_id || !user_id) {
        return res.status(400).json({ message: 'Invalid test, batch, or user ID' });
    }

    try {
        const liveTestCollection = live_test_db.collection('live_test');

        // Query the live test document with necessary fields
        const liveTest = await liveTestCollection.findOne(
            { test_id, batch_id },
            { projection: { end_time: 1, correct_answers: 1, questions: 1,user_responses: { $elemMatch: { user_id } } } }
        );

        if (!liveTest) {
            return res.status(404).json({ message: 'Live test not found' });
        }

        const currentTime = Date.now();
        if (currentTime < liveTest.end_time) {
            return res.status(403).json({ message: 'Test has not ended yet' });
        }

        const correctAnswers = liveTest.correct_answers || [];
        if (correctAnswers.length === 0) {
            return res.status(200).json({ 
                result: 'pending', 
                message: 'Results are not yet available. Please check back later.' 
            });
        }

        const userResponse = liveTest.user_responses?.[0];
        if (!userResponse) {
            return res.status(404).json({ message: 'User response not found' });
        }

        if (userResponse.result_html || (userResponse.result_html && !userResponse.answers)) {
    return res.status(200).json({ 
        result: 'success', 
        message: 'Probably a duplicate request. Please check.' 
    });
}


        // Calculate marks for the user
        const [overallReport, sections] = await calculate_live_Marks(
            batch_id, 
            test_id, 
            user_id, 
            liveTest, 
            userResponse.answers
        );

        // Generate and encode result HTML
        const resultHtml = generateResultHtml({ overallReport, sections });
        const resultBase64 = Buffer.from(resultHtml).toString('base64');

        // Update the user's response with result HTML and remove answers
        const updateResult = await liveTestCollection.updateOne(
            { test_id, 'user_responses.user_id': user_id },
            { 
                $set: { 'user_responses.$.result_html': resultBase64 },
                // $unset: { 'user_responses.$.answers': "" }
            }
        );

        if (updateResult.modifiedCount === 0) {
            throw new Error('Failed to update user response.');
        }

        return res.status(200).json({ 
            result: 'success', 
            message: 'User test results validated and stored successfully.' 
        });
    } catch (error) {
        console.error('Error validating test:', error);
        return res.status(500).json({ 
            result: 'error', 
            message: 'An error occurred while validating the test.' 
        });
    }
});



// Function to clean old tests from database
async function cleanupOldTests(liveTestsCollection) {
    const sevenDaysAgo = (Date.now() - (7 * 24 * 60 * 60 * 1000)).toString();
    try {
        const result = await liveTestsCollection.deleteMany({
            end_time: { $lt: sevenDaysAgo }
        });
        console.log(`Cleaned up ${result.deletedCount} old tests`);
        return result;
    } catch (error) {
        console.error('Error cleaning up old tests:', error);
        throw error;
    }
}

async function restructureUserRecentTests(usersCollection, userId) {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) });
        if (!user) {
            console.log(`User not found: ${userId}`);
            return null;
        }

        // Check if recentTests is already in the new structure
        if (user.recentTests && 'batch_test' in user.recentTests) {
            // Already restructured, no need to do it again
            return user.recentTests;
        }

        // If not restructured, perform the restructuring
        const currentRecentTests = user.recentTests || [];
        const restructuredTests = {
            batch_test: currentRecentTests.filter(test => test.testType === 'batch_test'),
            batch_dpp: currentRecentTests.filter(test => test.testType === 'batch_dpp'),
            test_series: currentRecentTests.filter(test => test.testType === 'test_series'),
        };

        // Update in database
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
// Function to restructure all users' recent tests
async function restructureAllUsersRecentTests(usersCollection) {
    try {
        const cursor = usersCollection.find({});
        const updates = [];
        let count = 0;

        await cursor.forEach(user => {
            const currentRecentTests = user.recentTests || [];
            const restructuredTests = {
                batch_test: currentRecentTests.filter(test => test.testType === 'batch'),
                batch_dpp: currentRecentTests.filter(test => test.testType === 'dpp'),
                test_series: []
            };
            
            updates.push({
                updateOne: {
                    filter: { _id: user._id },
                    update: { $set: { recentTests: restructuredTests } }
                }
            });
            count++;
        });

        if (updates.length > 0) {
            const result = await usersCollection.bulkWrite(updates);
            console.log(`Updated ${result.modifiedCount} users`);
        }

        return { 
            success: true, 
            usersUpdated: count,
            message: `Successfully restructured tests for ${count} users`
        };
    } catch (error) {
        console.error('Error restructuring all users tests:', error);
        return { 
            success: false, 
            error: error.message,
            message: 'Failed to restructure user tests'
        };
    }
}


// Route to manually trigger restructuring of all users' tests
app.get('/admin/restructure-all-tests', async (req, res) => {
    try {
        const result = await restructureAllUsersRecentTests(users);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to restructure tests'
        });
    }
});




// Modified live test access route with proper date formatting
app.get('/live-test/:batchId/:testId', isAuthenticated, async (req, res) => {
    const testId = req.params.testId;
    const batchId = req.params.batchId;
    const userId = req.user.userId; // Assuming `req.user` contains the authenticated user's info
    const currentTime = Date.now().toString();

    try {
        const liveTest = await live_test_db.collection('live_test').findOne({ test_id: testId, batch_id: batchId });

        if (!liveTest) {
            return res.status(404).send('Test not found');
        }

        // Ensure user_responses exists and is an array
        const userResponses = liveTest.user_responses || [];
        if (!Array.isArray(userResponses)) {
            return res.status(500).send('Invalid test data format');
        }


        
        if (currentTime < liveTest.start_time) {
            return res.render('warning', {
                message: `This test will start at ${formatDateTime(liveTest.start_time)}.`,
            });
        }
        if (currentTime > liveTest.end_time) {
            return res.render('warning', {
                message: `This test ended at ${formatDateTime(liveTest.end_time)}.`,
            });
        }
        // Check if the user has already submitted the test
        const userResponse = userResponses.find(response => response.user_id === userId);
        if (userResponse && Array.isArray(userResponse.answers) && userResponse.answers.length > 0) {
            return res.render('warning', {
                message: 'You have already attempted this test.',
            });
        }

        // Add formatted times to the test data
        liveTest.formatted_start_time = formatDateTime(liveTest.start_time);
        liveTest.formatted_end_time = formatDateTime(liveTest.end_time);

        liveTest.questions = liveTest.questions.map(question => ({
            question: question.question || '',
            type: question.type || '',
            options: question.options || [],
            userAnswer: null,  // Initialize as null
            skipped: false,    // Initialize as false
            visited: false,
            timeTaken: 0,      // Initialize as 0
            section: question.section || 'N/A',
        }));

        res.render('live_test_template', {
            questions: JSON.stringify(liveTest.questions),
            submit_url: "/submit-live-test",
        });
    } catch (error) {
        console.error('Error accessing live test:', error);
        res.status(500).send('An error occurred while accessing the live test');
    }
});

 

app.post('/validate-token', (req, res) => {
    const token = req.cookies.auth_token;
    if (!token) {
        return res.json({ success: false , message : "No token found " });
    }
    try {
        //const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, message : "User Logged in" });
    } catch (error) {
        res.json({ success: false , message : "Error Occured" });
    }
});



// const removeInactiveUsers = async () => {
//     try {
//         const oneMonthAgo = new Date();
//         oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

//         // Find users whose last login was more than 1 month ago
//         const inactiveUsers = await users.find({ lastLogin: { $lt: oneMonthAgo } }).toArray();
//         console.log(inactiveUsers)

//         if (inactiveUsers.length > 0) {
//             // Remove those users
//             await users.deleteMany({ _id: { $in: inactiveUsers.map(user => user._id) } });
//             console.log(`Removed ${inactiveUsers.length} inactive users`);
//         } else {
//             console.log('No inactive users found');
//         }
//     } catch (error) {
//         console.error('Error during inactive user removal:', error);
//     }
// };

const removeInactiveUsers = async (timeConfig) => {
    try {
        console.log("Running inactive user cleanup...");
        console.log(timeConfig);
        
        // Set the threshold time based on the custom time config
        let thresholdDate = new Date();
        
        if (timeConfig.days) {
            thresholdDate.setDate(thresholdDate.getDate() - timeConfig.days);
        }
        if (timeConfig.months) {
            thresholdDate.setMonth(thresholdDate.getMonth() - timeConfig.months);
        }
        if (timeConfig.minutes) {
            thresholdDate.setMinutes(thresholdDate.getMinutes() - timeConfig.minutes);
        }

        // Find users who either:
        // 1. Have no 'lastLogin' field (missing)
        // 2. Have 'lastLogin' older than the calculated threshold date
        const inactiveUsers = await users.find({
            $or: [
                { lastLogin: { $lt: thresholdDate } }, // Users whose last login is older than the threshold
                { lastLogin: { $exists: false } }      // Users without a 'lastLogin' field
            ]
        }).toArray();

        if (inactiveUsers.length > 0) {
            // Remove those users
            await users.deleteMany({ _id: { $in: inactiveUsers.map(user => user._id) } });
            console.log(`Removed ${inactiveUsers.length} inactive users`);
        } else {
            console.log('No inactive users found');
        }
    } catch (error) {
        console.error('Error during inactive user removal:', error);
    }
};


//setInterval(removeInactiveUsers({ months: 1, days: 15 }), 7000);
//setInterval(removeInactiveUsers(), 24 * 60 * 60 * 1000); // Run every 24 hours ans tereko ms mai melega







 //---------------------------------------------- user login and other code ends ---------------------------------------------- //





// ---------------------------------------------------------- GENERAL CODES --------------------------------------------------- //

// Function to encode to Base64




                                        // ------------------------ TEST SECTIONS START -------------------------------//
                                        

app.get('/collections', is_under_maintaince, async (req, res) => {
    try {
        const dbCollections = await db.listCollections().toArray();
        const dppCollections = await dpp_quiz.listCollections().toArray();
        const testSeriesCollections = await testSeriesDb.listCollections().toArray();

        const processCollections = async (collections, category, sourceDb) => {
            for (const coll of collections) {
                const match = coll.name.match(/name_(.*?)&batch_(.*)/);
                if (!match) continue;

                const originalName = coll.name;
                const newId = uuidv4(); // Generate unique ID
                const collectionRef = sourceDb.collection(originalName);
                
                // Get first document for exam_name and class
                const firstDoc = await collectionRef.findOne({}, { projection: { exam_name: 1, class: 1 } });
                if (!firstDoc) continue;

                const examName = firstDoc.exam_name || "unknown";
                const className = firstDoc.class || "unknown";

                // Rename collection in test_Db
                await sourceDb.collection(originalName).rename(newId);

                // Store metadata in all_data DB
                await allDataDb.collection(category).insertOne({
                    _id : newId,
                    name: match[1],
                    batch_id: match[2],
                    exam_name: examName.toLowerCase(),
                    class: className
                });

                console.log(`Renamed ${originalName} -> ${newId} and stored metadata.`);
            }
        };

        // Process each type of collection
        await processCollections(dbCollections, "tests", db);
        await processCollections(dppCollections, "dpp", dpp_quiz);
        await processCollections(testSeriesCollections, "test_series", testSeriesDb);

        res.json({ message: "Collections renamed and metadata stored successfully." });
    } catch (error) {
        console.error('Error processing collections:', error);
        res.status(500).json({ error: 'An error occurred while processing collections' });
    }
});



const calculate_live_Marks = async (batchId, testId, userId,testData,userAnswers) => {
    try {
        // const liveTestCollection = live_test_db.collection('live_test');
        
        // // Fetch the test data directly from the `live_test` collection using `testId` and `batchId`
        // const testData = await liveTestCollection.findOne({ test_id: testId, batch_id: batchId });
        
        if (!testData) return [{}, {}];

        const dbQuestions = testData.questions || [];
        const correctAnswers = testData.correct_answers || [];
        
        // Fetch the user responses for the specified user ID
        // const userResponses = testData.user_responses.find(response => response.user_id === userId);
        // const userAnswers = userResponses ? userResponses.answers : [];
        
        let overallReport = {
            totalQuestions: dbQuestions.length,
            attempted: 0,
            skipped: 0,
            wrong: 0,
            right: 0,
            totalMarks: 0,
            accuracy: 0
        };
        let sections = {};

        dbQuestions.forEach((dbQuestion, index) => {
            const section = dbQuestion.section || 'Default';
            if (!sections[section]) {
                sections[section] = {
                    questions: [],
                    totalMarks: 0,
                    accuracy: 0
                };
            }

            const userAnswer = userAnswers[index]; // Get the user answer based on index
            const correctAnswer = parseInt(correctAnswers[index]); // Get the correct answer
            const questionType = dbQuestion.type;
            const marks = dbQuestion.marks || { correct: 1, wrong: 0 };
        
            if (userAnswer === null) {
                overallReport.skipped++;
            } else {
                overallReport.attempted++;
                if (questionType === 'integer') {
                    const userAnswerFloat = parseFloat(userAnswer);
                    const correctAnswerFloat = parseFloat(correctAnswer);
                    if (userAnswerFloat === correctAnswerFloat) {
                        overallReport.right++;
                        sections[section].totalMarks += marks.correct;
                        overallReport.totalMarks += marks.correct;
                    } else {
                        overallReport.wrong++;
                        sections[section].totalMarks -= marks.wrong;
                        overallReport.totalMarks -= marks.wrong;
                    }
                } else {
                    if (parseInt(userAnswer) === correctAnswer) {
                        overallReport.right++;
                        sections[section].totalMarks += marks.correct;
                        overallReport.totalMarks += marks.correct;
                    } else {
                        overallReport.wrong++;
                        sections[section].totalMarks -= marks.wrong;
                        overallReport.totalMarks -= marks.wrong;
                    }
                }
            }
            
            sections[section].questions.push({
                question: dbQuestion,
                userAnswer: userAnswer,
                type: questionType,
                marks: marks,
                answer: correctAnswer,
                options: dbQuestion.options || ['A','B','C','D']
            });
        });

        // Calculate accuracy
        const overallAttempted = overallReport.attempted;
        overallReport.accuracy = overallAttempted > 0 ? (overallReport.right / overallAttempted) * 100 : 0;

        Object.values(sections).forEach(section => {
            const sectionAttempted = section.questions.filter(q => q.userAnswer !== null).length;
            const sectionCorrect = section.questions.filter(q => q.userAnswer === q.answer).length;
            section.accuracy = sectionAttempted > 0 ? (sectionCorrect / sectionAttempted) * 100 : 0;
        });

        return [overallReport, sections];
    } catch (error) {
        console.error('Error calculating marks:', error);
        return [{}, {}];
    }
};


                                        // ------------------------ TEST SECTIONS   ENDS -------------------------------//



                                        // ------------------------ DPP SECTIONS  STARTS -------------------------------//                                        
  

//--------------------- DPP TEST ENDS ----------------------------
startServer().catch(console.error);



// cron.schedule('0 0 * * *', () => {
//     console.log('Running daily check for inactive users...');
    
//     try {
//         // hula lala 
//         removeInactiveUsers({ days: 30 });
//         console.log('Inactive users removed successfully.');
//     } catch (error) {
//         console.error('Error during inactive user removal:', error);
//     }
// });

// Example: Running a check every day at midnight for users inactive for 30 days
// cron.schedule('0 0 * * *', () => {
//     console.log('Running daily check for inactive users...');
//     removeInactiveUsers({ days: 30 });
// });

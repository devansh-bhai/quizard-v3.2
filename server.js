const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const app = express();

//------------------ my js impots ----------------------- //

const { connectToMongo } = require('./supports/DataBase/db1'); // db wala h 

const { signup } = require('./supports/auth/signup');
const { login } = require('./supports/auth/login');

const {add_fav , del_fav } = require('./supports/fav_batch');

const { delete_acc } = require('./supports/utils/del_acc');
const { adds_update } = require('./supports/utils/adds');
const { getInstructions } = require('./supports/utils/instructions');
const { get_id_info } = require('./supports/utils/get_id_info');

const { dashboard } = require('./supports/dashboard/dashboard');
const { admin_dashboard } = require('./supports/dashboard/admin_dashboard');

const {batch_test , batch_dpp , test_series } = require('./supports/landing_page/master_landing');


const { getBatchDetails } = require('./supports/batch_test_data/batches');
const { getTestData } = require('./supports/batch_test_data/test_data');
const { calculateMarks, storeRecentTest, generateBase64ResultHtml } = require('./supports/batch_test_data/submit_test');

const { dpp_subjects } = require('./supports/batch_dpp_data/subjects');
const { dpp_chapters } = require('./supports/batch_dpp_data/chapters');
const { dpp_chapter_tests } = require('./supports/batch_dpp_data/dpp_chapter_tests');
const { dpp_test_data } = require('./supports/batch_dpp_data/dpp_test_page');
const { get_subject_name } = require('./supports/utils/get_subject_name');
const { submit_dpp } = require('./supports/batch_dpp_data/submit_dpp');


const { check_result } = require('./supports/check_result/check_result');

const { generate_graph } = require('./supports/utils/graph_maker');

const { generate_results } = require('./supports/dashboard/admin_dashboard');

const { live_test_page } = require('./supports/live_test_data/test_page');
const { validate_test } = require('./supports/live_test_data/validate_test');
const { submit_live_test } = require('./supports/live_test_data/submit_live_test');

const JWT_SECRET = '132432xsdcdscjnmb';

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'lode_tera_baap_hu_14',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

//--------------------- varibles needed ---------------------------

let is_unser_maintainece = false
const end_date = "06/02/2025"; // Format: dd/mm/yyyy
const end_time = "00:00:00";   // Format: hh:mm:ss
const add_to_fav_limit = 5;

let is_ads_enable = false
let ads_html = ``

//--------------------- maintaince  and auth Check ---------------
function is_under_maintaince(req, res, next) {
    if (is_unser_maintainece) {
        // Assuming you have these variables defined somewhere in your server code
        res.render('under_maintain', { end_date, end_time, is_unser_maintainece });
    } else {
        next();
    }
}
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
        console.log(error)
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


//--------- loging and signup system start ------ //
app.get('/signup', (req, res) => {
    res.render('master_log_sign');
});

app.get('/login', is_under_maintaince, (req, res) => {
    res.render('master_log_sign');
});

 // Logout route
 app.get('/logout', (req, res) => {
    res.clearCookie('auth_token');
    res.redirect('/');
});

app.post('/signup', signup);
app.post('/login',login);

//--------- loging and signup system ENDS ------ //

// ----------------- Fav and del fave routes  STARTS ------------------- //
app.post('/add-to-fav',isAuthenticated, add_fav);
app.post('/remove-from-fav',isAuthenticated, del_fav);
app.post('/delete-account', isAuthenticated, delete_acc);
// ----------------- Fav and del fave routes  ENDS ------------------- //

// ------------------- Dashboard ------------------- //
app.get('/dashboard', isAuthenticated, dashboard);
app.get('/dashboard-admin',admin_dashboard);

// ----------------- Landing pages ----------------- //

app.get('/', is_under_maintaince, batch_test);
app.get('/dpp', is_under_maintaince, batch_dpp);
app.get('/test-series', is_under_maintaince, test_series);

// -------- ads update ----------//
app.get('/adds-update', adds_update(is_ads_enable, ads_html));

// ------------- to get data bof batch , test , dpps  ----------//


app.get('/get_id_info/:batch_id_or_id/:type', is_under_maintaince, async (req, res) => {
    await get_id_info(req.params, res);
});

 // -------------- instructions for test ---------- //
app.get('/instructions/:batch_id/:batch_name/:test_id/:mode?', async (req, res) => {
    const { batch_id, batch_name, test_id, mode = "normal" } = req.params;
    const result = await getInstructions(batch_id, batch_name, test_id, mode);
    if (result.error) {
        return res.status(500).json(result);
    }
    return res.json(result);
});



// ---------------------- CHECK RESULT ROUTES ------------------//

app.get('/check-result/:type/:batchId/:testId/:mode?', isAuthenticated, is_under_maintaince,check_result);

// ---------------- Graph Maker New ---------------- //

app.get('/stats', is_under_maintaince,generate_graph);

//--------------------- batch test sarts ------------------//

app.get('/batch/:batch_id/:batch_name/:type', is_under_maintaince, async (req, res) => {
    const { batch_id, batch_name, type = "batch_test" } = req.params;
    const result = await getBatchDetails(batch_id, batch_name, type);

    if (result.error) {
        return res.status(500).json(result);
    }

    res.render('batch', result);
});

app.get('/test_data/:batchId/:batch_name/:testId/:type?', is_under_maintaince, async (req, res) => {
    const { batchId, testId, batch_name } = req.params;
    const type = req.params.type || "batch_test";  // Default to "batch_test"
    const testData = await getTestData(batchId, testId, batch_name, type);

    if (testData.error) {
        return res.status(404).render('test_template', { error: testData.error });
    }

    res.render('test_template', {
        questions: JSON.stringify(testData.questions),
        test_name: testData.test_name,
        test_id: testId,
        submit_url: "/submit-test",
        is_dpp: false,
        type,
        batch_name,
        batch_id: batchId
    });
});



app.post('/submit-test', dpp_quiz_auth, async (req, res) => {
    try {
        const { batch_id: batchId, test_id: testId, test_name, type = "batch_test", batch_name, questions: userQuestions = [] } = req.body;

        if (!batchId || !testId || !batch_name) {
            return res.status(400).json({ error: 'Missing batch_id or test_id' });
        }

        // Calculate marks and sections
        const [overallReport, sections] = await calculateMarks(batchId, batch_name, testId, type, userQuestions);
        const base64ResultHtml = generateBase64ResultHtml(overallReport, sections);

        if (req.cookies.auth_token) {
            console.log("User authenticated");

            const userId = req.user?.userId;  // Ensure user ID is available
            const stored = await storeRecentTest(userId, batchId, batch_name, test_name, testId, base64ResultHtml, type);

            return res.json({
                result: base64ResultHtml,
                overallReport,
                message: stored ? "Test submitted & updated in dashboard" : "Test submitted, but dashboard update failed"
            });
        }

        return res.json({
            result: base64ResultHtml,
            overallReport,
            message: "No login found"
        });

    } catch (error) {
        console.error('Error during quiz submission:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



//---------------- DPP ROUTES ---------------// 

app.get('/dpp_batch_subjects/:batch_id/:batch_name',is_under_maintaince,dpp_subjects);
app.get('/dpp_chp/:batch_id/:batch_name/:subject_slug',is_under_maintaince,dpp_chapters);
app.get('/dpp_chp_entries/:batch_id/:batch_name/:subject_slug/:chapter_name',is_under_maintaince,dpp_chapter_tests);
app.get('/dpp_test/:batchId/:subjectSlug/:testId/:batch_name', is_under_maintaince,dpp_test_data);
app.get('/get-subject-name/:batch_name/:batch_id/:subject_slug',get_subject_name);
app.post('/submit-dpp-quiz', dpp_quiz_auth,submit_dpp);


// ---------------- Live Test Routes -----------------//
app.get('/live-test/:batchId/:testId', isAuthenticated, live_test_page);
app.post('/validate-live-test/:batchId/:testId', isAuthenticated,validate_test);
app.post('/submit-live-test', isAuthenticated,submit_live_test);
app.post('/generate-test-results/:batchId/:testId', generate_results);


async function startServer() {
    await connectToMongo();
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
  }
  
  
startServer().catch(console.error);

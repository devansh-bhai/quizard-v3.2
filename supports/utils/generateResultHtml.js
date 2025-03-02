
const generateResultHtml = (result) => {
    const overallReport = result.overallReport || {};
    const sections = result.sections || {};
    let resultHtml = `
        <!-- Slidebar for Sections 
        <div class="section-nav">-->
    `;

    // Slidebar for Section Navigation
    // for (const [section] of Object.entries(sections)) {
    //     resultHtml += `<button onclick="showSection('${section.toLowerCase()}')">${section}</button>`;
    // }
   // resultHtml += `</div>`;

    // Stats Info
    resultHtml += `
     <!--   <div class="stats-info">
            <p><strong>Test Ranking:</strong> 2</p>
            <p><strong>Topper Marks:</strong> 21</p>
            <p><strong>Your Marks:</strong> ${overallReport.totalMarks}</p>
        </div>
-->
        <h3>Detailed Result</h3>
        <div id="result">
    `;

    for (const [section, sectionData] of Object.entries(sections)) {
      //  resultHtml += `<div id='${section.toLowerCase()}' class='section'>`;
        resultHtml += `<div id='headings'> <hr>\n<h3> Section : ${section.toUpperCase()}</h3></div>`;
        resultHtml += "<table><tr><th>Sr No.</th><th>Question Image</th><th>Answer</th><th>Marks</th></tr>";

        sectionData.questions.forEach((question, index) => {
            resultHtml += "<tr>";
            resultHtml += `<td>${index + 1}</td>`;
            resultHtml += `<td><img src='${question.question.question.replace("<img src='", "").replace("' class='igg'>", "")}' class='result-image' onclick='openModal(this.src)'></td>`;
            
            const userAnswer = question.userAnswer;
            const correctAnswer = question.answer;
            const questionType = question.type;
            const options = question.options;
            const solution_vid = question.video_soln || "#";
           
            if (userAnswer === null) {
                // Skipped question handling (unchanged)
                if (questionType === 'integer') {
                    resultHtml += `<td style='color: orange;font-weight: bold;'>Question : Skipped<br>
                    <div style='color: green;font-weight: bold;'>Correct Answer: ${correctAnswer}</div><br>
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += "<td>0</td>";
                } else if (questionType === "multi"){
                    const correctAnswerArray = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
                    .map(ans => parseInt(ans))
                    .sort((a, b) => a - b);
                    const allCorrectAnswerTexts = correctAnswerArray.map(ans => options[ans]).join(', ');
                    resultHtml += `<td style='color: orange;font-weight: bold;'>Question : Skipped<br>
                        <div style='color: green;'>Correct Answers: ${allCorrectAnswerTexts}</div>
                       <!-- <br> <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a> -->
                    </td>`;
                    resultHtml += `<td>0</td>`;
                } else { //mcq 
                    const correctAnswerText = options[correctAnswer] || "Invalid Options / Error ";
                    resultHtml += `<td style='color: orange;font-weight: bold;'>Question : Skipped<br>
                    <div style='color: green;font-weight: bold;'>Correct Answer: ${correctAnswerText}</div><br>
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += "<td>0</td>";     
                }
            } else if (questionType === 'integer') {
                // Integer question handling (unchanged)
                if (parseFloat(userAnswer) === parseFloat(correctAnswer)) {
                    resultHtml += `<td><div style='color: green;font-weight: bold;'>${userAnswer} &#10004;</div> <br> 
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += `<td>+ ${question.marks.correct}</td>`;
                } else {
                    resultHtml += `<td style='color: red;font-weight: bold;'>${userAnswer} &#10060;<br>
                    <div style='color: green;font-weight: bold;'>Correct Answer: ${correctAnswer}</div><br> 
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += `<td>- ${question.marks.wrong}</td>`;
                }
            } else if (questionType === 'multi') {
                // Convert answers to sorted integer arrays
                const correctAnswerArray = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer])
                    .map(ans => parseInt(ans))
                    .sort((a, b) => a - b);
                
                const userAnswerArray = (Array.isArray(userAnswer) ? userAnswer : [userAnswer])
                    .map(ans => parseInt(ans))
                    .sort((a, b) => a - b);
             
                // Find correctly selected and missed options
                const correctlySelectedOptions = userAnswerArray.filter(ans => 
                    correctAnswerArray.includes(ans)
                );
                // const missedCorrectOptions = correctAnswerArray.filter(ans => 
                //     !userAnswerArray.includes(ans)
                // );
                const incorrectlySelectedOptions = userAnswerArray.filter(ans => 
                    !correctAnswerArray.includes(ans)
                );
               
                // Marking Scheme
                if (JSON.stringify(correctAnswerArray) === JSON.stringify(userAnswerArray)) {
                    // All correct
                    const userAnswerTexts = userAnswerArray.map(ans => options[ans]).join(', ');
                    resultHtml += `<td><div style='color: green;font-weight: bold;'>${userAnswerTexts} &#10004;</div><br>
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += `<td>+ ${question.marks.correct}</td>`;
                } else if (correctlySelectedOptions.length === 1) {
                    // Only one correct option selected
                    const correctlySelectedOptionTexts = correctlySelectedOptions.map(ans => options[ans]).join(', ');
                    const allCorrectAnswerTexts = correctAnswerArray.map(ans => options[ans]).join(', ');
                    
                    resultHtml += `<td style='color: orange;font-weight: bold;'>
                        <div>Correct Chosen: ${correctlySelectedOptionTexts}</div>
                        <div style='color: green;'>All Correct Answers: ${allCorrectAnswerTexts}</div>
                       <!-- <br> <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a> -->
                    </td>`;
                    resultHtml += `<td>+ 1</td>`;
                } else if (incorrectlySelectedOptions.length > 0) {
                    // Some wrong options selected
                    const correctAnswerTexts = correctAnswerArray.map(ans => options[ans]).join(', ');
                    const userAnswerTexts = userAnswerArray.map(ans => options[ans]).join(', ');
                    
                    resultHtml += `<td style='color: red;font-weight: bold;'>
                        <div>Your Answer: ${userAnswerTexts} &#10060;</div>
                        <div style='color: green;'>Correct Answer: ${correctAnswerTexts}</div>
                       <!-- <br> <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a> -->
                    </td>`;
                    resultHtml += `<td>- 2</td>`;
                } 
            } else {
                // Single select MCQ handling (unchanged)
                const userAnswerText = options[parseInt(userAnswer)] || "ND";
                const correctAnswerText = options[parseInt(correctAnswer)]|| "Invalid Options / Error";
                if (String(userAnswer) === String(correctAnswer)) {
                    resultHtml += `<td><div style='color: green;font-weight: bold;'>${userAnswerText} &#10004; </div><br> 
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += `<td>+ ${question.marks.correct} \</td>`;
                } else {
                    resultHtml += `<td style='color: red;font-weight: bold;'><div style='color: red;font-weight: bold;'>YOUR ANS : ${userAnswerText} &#10060;</div><br><div style='color: green;font-weight: bold;'>Correct Answer: ${correctAnswerText} </div><br>
                    <!-- <a href="#" class="video-solution-link" data-link="${solution_vid}">Video Solution </a></td> -->`;
                    resultHtml += `<td>- ${question.marks.wrong}</td>`;
                }
            }
            
            resultHtml += "</tr>";
        });

        resultHtml += `<tr style='font-weight: bold;'><td colspan='3'>Total Marks: ${sectionData.totalMarks}</td><td>Accuracy: ${sectionData.accuracy.toFixed(2)}%</td></tr>`;
        resultHtml += "</table>";

        // Progress Bar for Section (unchanged)
        // const totalQuestions = sectionData.questions.length;
        // const correct = sectionData.questions.filter(q => {
        //     if (q.type === 'multi') {
        //         return q.userAnswer && 
        //                q.userAnswer.length === q.answer.length && 
        //                q.userAnswer.every(ans => q.answer.includes(ans));
        //     }
        //     return q.userAnswer === q.answer;
        // }).length;
        // const wrong = sectionData.questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.answer).length;
        // const skipped = sectionData.questions.filter(q => q.userAnswer === null).length;

        // resultHtml += `<div class="progress-bar-container">`;
        // resultHtml += `<div class="progress-bar">`;
        // resultHtml += `<div class="correct-bar" style="width: ${(correct / totalQuestions) * 100}%;"></div>`;
        // resultHtml += `<div class="incorrect-bar" style="width: ${(wrong / totalQuestions) * 100}%;"></div>`;
        // resultHtml += `<div class="skipped-bar" style="width: ${(skipped / totalQuestions) * 100}%;"></div>`;
        // resultHtml += `</div>`;
        // resultHtml += `<div class="progress-labels">`;
        // resultHtml += `<span>Correct: ${((correct / totalQuestions) * 100).toFixed(2)}%</span>`;
        // resultHtml += `<span>Wrong: ${((wrong / totalQuestions) * 100).toFixed(2)}%</span>`;
        // resultHtml += `<span>Skipped: ${((skipped / totalQuestions) * 100).toFixed(2)}%</span>`;
        // resultHtml += `</div>`;
        // resultHtml += `</div>`;

        resultHtml += `</div>`; // Close section div
    }

    // Overall Report
    resultHtml += "<div class='overall-result-container'>";
    resultHtml += "<h3>Overall Report</h3>";
    resultHtml += "<div class='overall-result-box'>";
    resultHtml += `<p>Total Questions: ${overallReport.totalQuestions}</p>`;
    resultHtml += `<p>Attempted: ${overallReport.attempted}</p>`;
    resultHtml += `<p>Skipped: ${overallReport.skipped}</p>`;
    resultHtml += `<p>Wrong: ${overallReport.wrong}</p>`;
    resultHtml += `<p>Right: ${overallReport.right}</p>`;
    resultHtml += `<p>Total Marks: ${overallReport.totalMarks}</p>`;

    const accuracy = overallReport.accuracy;
    resultHtml += `<p>Overall Accuracy: <span class='accuracy-score'>${accuracy.toFixed(2)}%</span></p>`;

    let feedbackMessage = "";
    let feedbackIcon = "";
    if (accuracy >= 90) {
        feedbackMessage = "Excellent! Keep up the great work!";
        feedbackIcon = "&#128079;";
    } else if (accuracy >= 80) {
        feedbackMessage = "Keep going! You're on the right track!";
        feedbackIcon = "&#128077;";
    } else if (accuracy >= 50) {
        feedbackMessage = "Not bad! Keep practicing and improving!";
        feedbackIcon = "&#9992;";
    } else {
        feedbackMessage = "Don't give up! Practice makes perfect!";
        feedbackIcon = "&#128546;";
    }

    resultHtml += `<p class='feedback-message'>${feedbackIcon} ${feedbackMessage}</p>`;
    resultHtml += "</div></div>";

    resultHtml += `
        </div>
    </div>

    <!-- Modal for Image View -->
    <div id="myModal" class="modal">
        <span class="close" onclick="closeModal()">&times;</span>
        <img class="modal-content" id="img01">
    </div>

  
</body>
</html>
    `;

    return resultHtml;
};


module.exports = { generateResultHtml }
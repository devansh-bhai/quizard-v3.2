const { getDB } = require('../DataBase/db1');
const { formatUnixTimestampToIST } = require('../utils/time')


async function dpp_chapter_tests (req, res) {
      const { batch_id, batch_name, subject_slug, chapter_name } = req.params;
      const entries = [];
      try {
          //const collectionName = `name_${batch_name}&batch_${batch_id}`;
          const collectionName = batch_id;
          
          
          // Fetch the document for the specified subject_slug and chapter_name
          const document = await getDB('dpp_quiz').collection(collectionName).findOne({ subject_slug });
          const subject_name = document.subject_name
  
          if (document) {
 
              const chapter = document.chapters.find(chap => chap.chapter_name === chapter_name);
  
              if (chapter) {
                  chapter.entries.forEach((entry) => {
                      const entryInfo = {
                          test_name: entry.test_name,
                          test_id: entry.test_id,
                          batch_name : batch_name,
                          questions_count: entry.questions.length,
                          test_date: formatUnixTimestampToIST(entry.test_date)
                      };
                      entries.push(entryInfo);
                  });
              }
          }
  
         res.render('dpp_chapter_entries', { batch_name, subject_slug, chapter_name, entries, batch_id,subject_name });
      } catch (error) {
          console.error('Error fetching chapter entries:', error);
          res.status(500).json({ error: 'An error occurred while fetching chapter entries' });
      }
  };


  module.exports =  { dpp_chapter_tests }
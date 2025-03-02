const { getDB } = require('../DataBase/db1');





async function dpp_chapters (req, res)  {
    const { batch_id, batch_name, subject_slug } = req.params;
    const chapters = [];
    try {
        //const collectionName = `name_${batch_name}&batch_${batch_id}`;
        const collectionName = batch_id;
        
        // Fetch the document for the specified subject_slug
        const document = await getDB('dpp_quiz').collection(collectionName).findOne({ subject_slug });

        if (document) {
            subject_name = document.subject_name 
            document.chapters.forEach((chapter) => {
                const chapterInfo = {
                    chapter_name: chapter.chapter_name,
                    entries_count: chapter.entries.length
                };
                chapters.push(chapterInfo);
            });
        }

        res.render('dpp_chapters', { batch_name, chapters, batch_id, subject_slug,subject_name });
    } catch (error) {
        console.error('Error fetching chapters:', error);
        res.status(500).json({ error: 'An error occurred while fetching chapters' });
    }
};


module.exports = { dpp_chapters }
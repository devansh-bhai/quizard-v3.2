
const { getDB } = require('../DataBase/db1');
const { formatUnixTimestampToIST } = require('../utils/time')


 async function dpp_subjects (req, res) {
    const { batch_id, batch_name } = req.params;
    const subjects = [];
    try {
        // const collectionName = `name_${batch_name}&batch_${batch_id}`;
        const collectionName = batch_id;
        
        const pipeline = [
            {
                $project: {
                    subject_name: 1,
                    subject_slug: 1,
                    chapters: {
                        $map: {
                            input: "$chapters",
                            as: "chapter",
                            in: {
                                chapter_name: "$$chapter.chapter_name",
                                entries: {
                                    $map: {
                                        input: "$$chapter.entries",
                                        as: "entry",
                                        in: {
                                            test_name: "$$entry.test_name",
                                            test_id: "$$entry.test_id",
                                            questions_count: { $size: { $ifNull: ["$$entry.questions", []] } },
                                            test_date: "$$entry.test_date"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ];

        const documents = await getDB('dpp_quiz').collection(collectionName).aggregate(pipeline).toArray();
        
        documents.forEach((doc) => {
            const subjectInfo = {
                subject_name: doc.subject_name,
                subject_slug: doc.subject_slug,
                chapters: [],
                batch_id: batch_id,
                batch_name: batch_name,
                entries_length: 0 // Initialize entries length
            };

            const entriesLength = doc.chapters.length;

                // Add to the total entries count for the subject
                subjectInfo.entries_length += entriesLength;
            
            doc.chapters.forEach((chapter) => {
                const chapterInfo = {
                    chapter_name: chapter.chapter_name,
                    entries: []
                };

                // Calculate the number of entries in the chapter
                

                chapter.entries.forEach((entry) => {
                    chapterInfo.entries.unshift({
                        test_name: entry.test_name,
                        test_id: entry.test_id,
                        questions_count: entry.questions_count,
                        test_date: formatUnixTimestampToIST(entry.test_date)
                    });
                });

                subjectInfo.chapters.push(chapterInfo);
            });
            
            subjects.push(subjectInfo);
        });
        
        res.render('dpp_batch_subjects', { batch_name, subjects, batch_id });
    } catch (error) {
        console.error('Error fetching batch details:', error);
        res.status(500).json({ error: 'An error occurred while fetching batch details' });
    }
};


module.exports = { dpp_subjects }
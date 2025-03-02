function adds_update(is_ads_enable, ads_html) {
    return function (req, res) {  // Wrap inside another function
        if (is_ads_enable) {
            try {
                res.json({ 
                    success: true, 
                    data: ads_html 
                });
            } catch (error) {
                console.error('Error serving ads:', error);
                res.status(500).json({ 
                    success: false, 
                    message: 'An error occurred while serving ads' 
                });
            }
        } else {
            res.json({ 
                success: false, 
                message: 'NO ADS' 
            });
        }
    };
}

module.exports = { adds_update };

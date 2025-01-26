function errorHandler(err, req, res, next) {
    console.error('Error:', err.stack);
    
    // Log error to error_log.txt
    const fs = require('fs');
    const timestamp = new Date().toISOString();
    fs.appendFileSync('error_log.txt', `${timestamp} - ${err.stack}\n`);

    // Send appropriate response
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message
    });
}

module.exports = errorHandler;

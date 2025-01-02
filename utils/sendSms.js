const axios = require('axios');

const sendSms = async (message, numbers) => {
    try {
        const apiKey = process.env.FAST2SMS_API_KEY;

        if (!apiKey) {
            throw new Error("Fast2SMS API key is missing in the environment variables.");
        }

        if (!message || typeof message !== 'string') {
            throw new Error("Invalid message content.");
        }
        if (!Array.isArray(numbers) || numbers.length === 0) {
            throw new Error("Invalid mobile numbers array.");
        }

        const formattedNumbers = numbers.map((num) => num.trim()).join(',');

        const options = {
            method: 'POST',
            url: 'https://www.fast2sms.com/dev/bulkV2',
            headers: {
                authorization: apiKey,
                'Content-Type': 'application/json',
            },
            data: {
                route: 'v3',
                sender_id: 'TXTIND',
                message: message,
                language: 'english',
                numbers: formattedNumbers,
            },
        };

        console.log("options", options);
        const response = await axios(options);
        return response.data;
    } catch (error) {
        console.error("sending err", error.message);
        if (error.response) {
            console.error("err:", error.response.data);
        }
        throw error;
    }
};

module.exports = sendSms;

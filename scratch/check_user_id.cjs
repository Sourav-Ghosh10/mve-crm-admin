const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect("mongodb+srv://Codecit:Codecit123@cluster0.h119n.mongodb.net/crm?retryWrites=true&w=majority&appName=Cluster0");
        const user = await mongoose.connection.db.collection('users').findOne({ "personalInfo.email": "souravghoshmgu1@gmail.com" });
        if (user) {
            console.log('User ID:', user._id.toString());
            console.log('User Data:', JSON.stringify(user, null, 2));
        } else {
            console.log('User not found');
        }
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}
check();

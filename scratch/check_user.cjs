const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect("mongodb+srv://Codecit:Codecit123@cluster0.h119n.mongodb.net/crm?retryWrites=true&w=majority&appName=Cluster0");
        console.log('Connected to MongoDB');
        
        const user = await mongoose.connection.db.collection('users').findOne({ "personalInfo.email": "souravghoshmgu1@gmail.com" });
        if (user) {
            console.log('User found:', JSON.stringify({
                email: user.personalInfo.email,
                isAdmin: user.isAdmin,
                role: user.employment?.role,
                roleId: user.employment?.roleId
            }, null, 2));
        } else {
            console.log('User not found');
        }
        
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

check();

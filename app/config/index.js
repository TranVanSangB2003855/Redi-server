const config = {
    app: {
        port: 3000 ,
        //process.env.port || 
    },
    db: {
        uri: process.env.MONGODB_URI ||"mongodb://127.0.0.1:27017/redi_chat"//"mongodb+srv://admin:TRVASAmb6902@cluster0.ekgkgef.mongodb.net"
        // 
    },
    secret: "bezkoder-secret-key"
};

module.exports = config;
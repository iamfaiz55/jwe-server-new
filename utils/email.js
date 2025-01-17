const nodemailer = require("nodemailer")

const sendEmail = ({to, subject, message, attachments })=> new Promise((resolve, reject)=>{
    console.log("to", to);
    console.log("subject", subject);
    console.log("message",message);
    
   const transport = nodemailer.createTransport({
        service:"gmail",
        auth:{
            user:process.env.FROM_EMAIL,
            pass:process.env.EMAIL_PASS
        }
    })
    transport.sendMail({
        from:process.env.FROM_EMAIL,
        to,
        subject,
        text:message,
        html:message,
        attachments: attachments,
    }, err=> {
        if(err){
            console.log("---------------",err);
            reject(false)
        }else{
            resolve(true)
        }
    })
})

module.exports = sendEmail
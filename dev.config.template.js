// Customizar para desarrollos locales. Incluir en .gitignore para evitar publicar secretos.

module.exports.initLocals = () => {
    process.env.MONGODB_URI = ''
    process.env.ADMIN_EMAIL =''
    process.env.EMAIL_ACCOUNT =''
    process.env.EMAIL_PASS = ''
    process.env.JWT_SECRET = ''   
    process.env.COOKIE_SECRET = '' 
    process.env.COOKIE_NAME = ''
    provess.env.ENABLE_EMAIL_SEND = false
    provess.env.ENABLE_EMAIL_PREVIEW = true
}
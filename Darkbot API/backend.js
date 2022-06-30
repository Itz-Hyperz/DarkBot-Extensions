async function checkAuth(req, res, next) {
    if(req.isAuthenticated()){
        next();
    } else{
        res.redirect("/auth/discord");
    };
};

module.exports = {
    checkAuth: checkAuth
};
import jwt from 'jsonwebtoken';


export const authenticate = (req, res, next) => {
    const token = req.headers.cookie.toString()
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    console.log(token.split('=')[1]);
    jwt.verify(token.split('=')[1], process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        console.log(user);
        req.user = user;
        next();
    });
}
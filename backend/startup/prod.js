// import helmet from 'helmet';
import compression from 'compression';

export default function(app) {
    // app.use(helmet());
    app.use(compression({
        filter: (req, res) => {
            if (req.header['x-no-compression']) return false;
            return compression.filter(req, res);
        },
    }));
}
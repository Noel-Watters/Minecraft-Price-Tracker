import { supabase } from '../config/supabaseClient.js';

export const protectRoute = async (req, res, next) => {
        const token = req.headers.authorization?.split(' ')[1]; // Assuming Bearer token

        if (!token) {
                return res.status(401).json({ message: 'No authorization token provided' });
        }

        const { data: { user }, signupError: error } = await supabase.auth.getUser(token);

        if (error || !user) {
                return res.status(401).json({ message: 'Invalid or expired token' });
        }

        req.user = user;

        const { data: user_data, error: adminError } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id).single();

        if (adminError || !user_data) {
                console.log(`Unable to find user`);
                return res.status(401).json({ error: 'bad_request', details: 'Unable to find user' });
        }

        req.admin = (user_data.role === 'admin');

        next();
};

export const adminProtectRoute = async (req, res, next) => {
        if (!req.user) {
                console.log('No auth provided');
                return res.status(401).json({ error: 'bad_request', details: 'No auth provided' });
        }

        if (!req.admin) {
                console.log('Unauthorized admin request');
                return res.status(401).json({ error: 'bad_request', details: 'Unauthorized' });
        }

        next();
};
